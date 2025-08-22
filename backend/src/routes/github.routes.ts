import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { GitHubService } from '../services/github.service';
import { storageService } from '../services/storage.service';
import type {
  GitHubValidateRepoRequest,
  GitHubBranchesRequest,
  GitHubExportRequest,
  GitHubExportResponse
} from '../../../shared/types';

export default async function githubRoutes(fastify: FastifyInstance) {
  let githubService: GitHubService | null = null;

  const getGitHubService = (token?: string) => {
    // Use provided token or fallback to environment variable
    const authToken = token || config.GITHUB_TOKEN_VIBE;
    
    if (!authToken) {
      throw new Error('GitHub token not provided. Please set GITHUB_TOKEN_VIBE in environment or provide token.');
    }
    
    // Create new service instance if token is different or doesn't exist yet
    if (!githubService || token) {
      githubService = new GitHubService(token);
    }
    return githubService;
  };

  fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      configured: !!config.GITHUB_TOKEN_VIBE,
      message: config.GITHUB_TOKEN_VIBE
        ? 'GitHub API is configured and ready'
        : 'GitHub token is not configured. Please set GITHUB_TOKEN_VIBE environment variable.'
    };
  });

  fastify.post<{ Body: GitHubValidateRepoRequest }>(
    '/validate-repo',
    {
      schema: {
        body: {
          type: 'object',
          required: ['repoUrl'],
          properties: {
            repoUrl: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const service = getGitHubService();
        const repoInfo = await service.validateRepo(request.body.repoUrl);
        return { success: true, data: repoInfo };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  fastify.get<{ Params: GitHubBranchesRequest }>(
    '/:owner/:repo/branches',
    {
      schema: {
        params: {
          type: 'object',
          required: ['owner', 'repo'],
          properties: {
            owner: { type: 'string' },
            repo: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const service = getGitHubService();
        const { owner, repo } = request.params;
        const branches = await service.getBranches(owner, repo);
        return { success: true, data: branches };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  fastify.post<{ Body: GitHubExportRequest }>(
    '/export',
    {
      schema: {
        body: {
          type: 'object',
          required: [
            'repoUrl',
            'filePath',
            'componentName',
            'componentData',
            'baseBranch',
            'branchName',
            'targetBranch'
          ],
          properties: {
            repoUrl: { type: 'string' },
            filePath: { type: 'string' },
            componentName: { type: 'string' },
            componentData: { type: 'string' },
            baseBranch: { type: 'string' },
            branchName: { type: 'string' },
            targetBranch: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const service = getGitHubService();
        
        const pullRequest = await service.exportToGitHub(request.body);
        
        const storedResponse = await storageService.savePRResponse(
          pullRequest,
          request.body
        );
        
        const response: GitHubExportResponse = {
          success: true,
          pullRequest,
          storageId: storedResponse.id
        };
        
        return response;
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(400).send({
          success: false,
          error: error.message
        } as GitHubExportResponse);
      }
    }
  );

  fastify.get('/export/history', async (request, reply) => {
    try {
      const history = await storageService.getExportHistory();
      return { success: true, data: history };
    } catch (error: any) {
      fastify.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to retrieve export history'
      });
    }
  });

  fastify.get<{ Params: { id: string } }>(
    '/export/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const prResponse = await storageService.getPRResponse(request.params.id);
        
        if (!prResponse) {
          return reply.code(404).send({
            success: false,
            error: 'Export record not found'
          });
        }
        
        return { success: true, data: prResponse };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to retrieve export record'
        });
      }
    }
  );

  fastify.get<{ Querystring: { limit?: number } }>(
    '/export/recent',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 50 }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const limit = request.query.limit || 10;
        const recentExports = await storageService.getRecentExports(limit);
        return { success: true, data: recentExports };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to retrieve recent exports'
        });
      }
    }
  );

  fastify.post<{ Body: { daysToKeep?: number } }>(
    '/export/cleanup',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            daysToKeep: { type: 'number', minimum: 1 }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const daysToKeep = request.body.daysToKeep || 30;
        const deletedCount = await storageService.cleanupOldExports(daysToKeep);
        return {
          success: true,
          message: `Cleaned up ${deletedCount} old export records`
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          success: false,
          error: 'Failed to cleanup old exports'
        });
      }
    }
  );
}