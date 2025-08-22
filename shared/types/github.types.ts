export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
  permissions: {
    push: boolean;
    pull: boolean;
    admin: boolean;
  };
}

export interface GitHubBranch {
  name: string;
  protected: boolean;
}

export interface GitHubExportRequest {
  repoUrl: string;
  filePath: string;
  componentName: string;
  componentData: string;
  baseBranch: string;
  branchName: string;
  targetBranch: string;
  convertToReact?: boolean;
  fileExtension?: 'json' | 'tsx' | 'jsx';
}

export interface GitHubPullRequest {
  number: number;
  url: string;
  title: string;
  body: string;
  state: string;
  head: string;
  base: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredPRResponse {
  id: string;
  timestamp: string;
  pullRequest: GitHubPullRequest;
  exportDetails: {
    repoUrl: string;
    componentName: string;
    filePath: string;
    branchName: string;
    baseBranch: string;
    targetBranch: string;
  };
  fileName: string;
}

export interface GitHubValidateRepoRequest {
  repoUrl: string;
}

export interface GitHubBranchesRequest {
  owner: string;
  repo: string;
}

export interface GitHubExportResponse {
  success: boolean;
  pullRequest?: GitHubPullRequest;
  storageId?: string;
  error?: string;
}