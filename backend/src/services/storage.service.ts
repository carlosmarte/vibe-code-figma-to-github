import fs from 'fs/promises';
import path from 'path';
import type { GitHubPullRequest, StoredPRResponse } from '../../../shared/types';

export class StorageService {
  private storageBasePath: string;
  private githubExportsPath: string;
  private historyFilePath: string;

  constructor() {
    this.storageBasePath = path.join(process.cwd(), 'storage');
    this.githubExportsPath = path.join(this.storageBasePath, 'github-exports');
    this.historyFilePath = path.join(this.githubExportsPath, 'export-history.json');
  }

  async ensureStorageDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.githubExportsPath, { recursive: true });
    } catch (error: any) {
      console.error('Failed to create storage directories:', error);
      throw new Error('Failed to initialize storage');
    }
  }

  async savePRResponse(
    pr: GitHubPullRequest,
    exportDetails: {
      repoUrl: string;
      componentName: string;
      filePath: string;
      branchName: string;
      baseBranch: string;
      targetBranch: string;
    }
  ): Promise<StoredPRResponse> {
    await this.ensureStorageDirectories();

    const timestamp = Date.now();
    const repoName = this.extractRepoName(exportDetails.repoUrl);
    const fileName = `pr-${timestamp}-${repoName}.json`;
    const filePath = path.join(this.githubExportsPath, fileName);

    const storedResponse: StoredPRResponse = {
      id: `${timestamp}-${pr.number}`,
      timestamp: new Date().toISOString(),
      pullRequest: pr,
      exportDetails,
      fileName
    };

    await fs.writeFile(filePath, JSON.stringify(storedResponse, null, 2));
    
    await this.updateExportHistory(storedResponse);

    return storedResponse;
  }

  async getExportHistory(): Promise<StoredPRResponse[]> {
    try {
      await this.ensureStorageDirectories();
      const historyData = await fs.readFile(this.historyFilePath, 'utf-8');
      return JSON.parse(historyData);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw new Error('Failed to read export history');
    }
  }

  async getPRResponse(id: string): Promise<StoredPRResponse | null> {
    const history = await this.getExportHistory();
    return history.find(item => item.id === id) || null;
  }

  async getPRResponseByFile(fileName: string): Promise<StoredPRResponse | null> {
    try {
      const filePath = path.join(this.githubExportsPath, fileName);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async getRecentExports(limit: number = 10): Promise<StoredPRResponse[]> {
    const history = await this.getExportHistory();
    return history.slice(0, limit);
  }

  private async updateExportHistory(newExport: StoredPRResponse): Promise<void> {
    const history = await this.getExportHistory();
    
    history.unshift(newExport);
    
    const maxHistorySize = 100;
    if (history.length > maxHistorySize) {
      history.length = maxHistorySize;
    }

    await fs.writeFile(this.historyFilePath, JSON.stringify(history, null, 2));
  }

  private extractRepoName(repoUrl: string): string {
    const match = repoUrl.match(/([^\/]+)\/([^\/\.]+)(?:\.git)?$/);
    if (match) {
      return `${match[1]}-${match[2]}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    }
    return 'unknown-repo';
  }

  async cleanupOldExports(daysToKeep: number = 30): Promise<number> {
    const history = await this.getExportHistory();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const filesToDelete: string[] = [];
    const updatedHistory = history.filter(item => {
      const itemDate = new Date(item.timestamp);
      if (itemDate < cutoffDate) {
        filesToDelete.push(item.fileName);
        return false;
      }
      return true;
    });

    for (const fileName of filesToDelete) {
      try {
        const filePath = path.join(this.githubExportsPath, fileName);
        await fs.unlink(filePath);
      } catch (error) {
        console.error(`Failed to delete old export file: ${fileName}`, error);
      }
    }

    if (filesToDelete.length > 0) {
      await fs.writeFile(this.historyFilePath, JSON.stringify(updatedHistory, null, 2));
    }

    return filesToDelete.length;
  }
}

export const storageService = new StorageService();