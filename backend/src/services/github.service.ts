import { config } from '../config';
import { Octokit } from '@octokit/rest';
import type { 
  GitHubRepoInfo, 
  GitHubBranch, 
  GitHubPullRequest, 
  GitHubExportRequest 
} from '../../../shared/types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    // Use provided token or fallback to environment variable
    const authToken = token || config.GITHUB_TOKEN_VIBE;
    
    if (!authToken) {
      throw new Error('GitHub token not provided. Please set GITHUB_TOKEN_VIBE in environment or provide token.');
    }
    
    this.octokit = new Octokit({
      auth: authToken,
      baseUrl: config.GITHUB_API_BASE_URL
    });
  }

  async validateRepo(repoUrl: string): Promise<GitHubRepoInfo> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    try {
      const { data } = await this.octokit.repos.get({ owner, repo });
      
      return {
        owner: data.owner.login,
        repo: data.name,
        fullName: data.full_name,
        defaultBranch: data.default_branch,
        private: data.private,
        permissions: {
          push: data.permissions?.push ?? false,
          pull: data.permissions?.pull ?? true,
          admin: data.permissions?.admin ?? false
        }
      };
    } catch (error: any) {
      if (error.status === 404) {
        throw new Error('Repository not found or you do not have access');
      }
      throw new Error(`Failed to validate repository: ${error.message}`);
    }
  }

  async getBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
    try {
      const { data } = await this.octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100
      });
      
      return data.map(branch => ({
        name: branch.name,
        protected: branch.protected
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }
  }

  async createBranch(
    owner: string, 
    repo: string, 
    branchName: string, 
    baseBranch: string
  ): Promise<void> {
    try {
      const { data: baseBranchData } = await this.octokit.repos.getBranch({
        owner,
        repo,
        branch: baseBranch
      });

      const baseSha = baseBranchData.commit.sha;

      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      });
    } catch (error: any) {
      if (error.status === 422 && error.message?.includes('Reference already exists')) {
        throw new Error(`Branch '${branchName}' already exists`);
      }
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  async commitFile(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    message: string
  ): Promise<string> {
    try {
      // Decode the file path if it's URL encoded
      const decodedPath = decodeURIComponent(filePath);
      
      let sha: string | undefined;
      
      try {
        const { data: existingFile } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: decodedPath,
          ref: branch
        });
        
        // Check if it's a file (not a directory)
        if (!Array.isArray(existingFile) && 'sha' in existingFile && existingFile.type === 'file') {
          sha = existingFile.sha;
          console.log(`Found existing file with SHA: ${sha}`);
        } else if (Array.isArray(existingFile)) {
          // It's a directory, we need to create a file in it
          console.log(`Path ${decodedPath} is a directory, creating new file`);
        }
      } catch (error: any) {
        if (error.status === 404) {
          console.log(`File ${decodedPath} does not exist, will create new file`);
        } else {
          console.error(`Error checking for existing file: ${error.message}`);
          throw error;
        }
      }

      const encodedContent = Buffer.from(content).toString('base64');

      const params: any = {
        owner,
        repo,
        path: decodedPath,
        message,
        content: encodedContent,
        branch
      };
      
      if (sha) {
        params.sha = sha;
      }

      console.log(`Committing file to ${decodedPath} on branch ${branch}${sha ? ' (updating existing)' : ' (creating new)'}`);
      
      const { data } = await this.octokit.repos.createOrUpdateFileContents(params);

      return data.commit.sha;
    } catch (error: any) {
      console.error('Commit file error details:', error.response?.data || error.message);
      throw new Error(`Failed to commit file: ${error.message}`);
    }
  }

  async createPullRequest(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<GitHubPullRequest> {
    try {
      const { data } = await this.octokit.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      });

      return {
        number: data.number,
        url: data.html_url,
        title: data.title,
        body: data.body || '',
        state: data.state,
        head: data.head.ref,
        base: data.base.ref,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (error: any) {
      if (error.status === 422) {
        const message = error.message || '';
        if (message.includes('No commits between')) {
          throw new Error('No changes to create a pull request');
        }
        if (message.includes('pull request already exists')) {
          throw new Error('A pull request already exists for this branch');
        }
      }
      throw new Error(`Failed to create pull request: ${error.message}`);
    }
  }

  async exportToGitHub(request: GitHubExportRequest): Promise<GitHubPullRequest> {
    const { owner, repo } = this.parseRepoUrl(request.repoUrl);
    
    await this.validateRepo(request.repoUrl);
    
    if (request.branchName !== request.baseBranch) {
      await this.createBranch(owner, repo, request.branchName, request.baseBranch);
    }
    
    // Ensure the file path has a proper filename and extension
    let filePath = request.filePath;
    
    // Check if the path doesn't have an extension (likely a directory)
    if (!filePath.match(/\.[a-zA-Z0-9]+$/)) {
      // If it doesn't end with a slash, add one
      if (!filePath.endsWith('/')) {
        filePath += '/';
      }
      // Add a default filename based on the component name
      const sanitizedName = request.componentName
        .replace(/[^a-zA-Z0-9-_]/g, '-')
        .toLowerCase();
      filePath += `${sanitizedName}.json`;
      console.log(`Adjusted file path from "${request.filePath}" to "${filePath}"`);
    }
    
    const commitMessage = `Export Figma component: ${request.componentName}`;
    await this.commitFile(
      owner,
      repo,
      request.branchName,
      filePath,
      request.componentData,
      commitMessage
    );
    
    const prTitle = `Export Figma component: ${request.componentName}`;
    const prBody = `## Figma Component Export

**Component:** ${request.componentName}
**File Path:** ${filePath}
**Exported at:** ${new Date().toISOString()}

### Description
This PR contains an exported Figma component.

---
*Automated export from Figma to GitHub*`;

    const pr = await this.createPullRequest(
      owner,
      repo,
      prTitle,
      prBody,
      request.branchName,
      request.targetBranch
    );

    return pr;
  }

  private parseRepoUrl(url: string): { owner: string; repo: string } {
    const httpsMatch = url.match(/https:\/\/github\.com\/([^\/]+)\/([^\/\.]+)/);
    
    if (httpsMatch) {
      return {
        owner: httpsMatch[1],
        repo: httpsMatch[2]
      };
    }
    
    const gitMatch = url.match(/git@github\.com:([^\/]+)\/([^\.]+)\.git/);
    
    if (gitMatch) {
      return {
        owner: gitMatch[1],
        repo: gitMatch[2]
      };
    }
    
    const pathMatch = url.match(/^([^\/]+)\/([^\/]+)$/);
    
    if (pathMatch) {
      return {
        owner: pathMatch[1],
        repo: pathMatch[2]
      };
    }
    
    throw new Error('Invalid GitHub repository URL. Expected format: https://github.com/owner/repo');
  }
}

export const githubService = new GitHubService();