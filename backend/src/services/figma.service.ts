import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export class FigmaService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.FIGMA_API_BASE_URL,
      timeout: 30000,
    });
  }

  private getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getCurrentUser(accessToken: string) {
    try {
      const response = await this.api.get('/me', {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  }

  async getUserFiles(accessToken: string) {
    try {
      const response = await this.api.get('/me/files', {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get user files:', error);
      throw error;
    }
  }

  async getUserTeams(accessToken: string) {
    try {
      const response = await this.api.get('/me/teams', {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get user teams:', error);
      throw error;
    }
  }

  async getUserProjects(accessToken: string, teamId?: string) {
    try {
      const endpoint = teamId ? `/teams/${teamId}/projects` : '/me/projects';
      const response = await this.api.get(endpoint, {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get user projects:', error);
      throw error;
    }
  }

  async getFile(accessToken: string, fileKey: string) {
    try {
      const response = await this.api.get(`/files/${fileKey}`, {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get file:', error);
      throw error;
    }
  }

  async getFileVersions(accessToken: string, fileKey: string) {
    try {
      const response = await this.api.get(`/files/${fileKey}/versions`, {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get file versions:', error);
      throw error;
    }
  }

  async getFileComments(accessToken: string, fileKey: string) {
    try {
      const response = await this.api.get(`/files/${fileKey}/comments`, {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get file comments:', error);
      throw error;
    }
  }

  async importFile(accessToken: string, fileKey: string, name?: string) {
    try {
      const fileData = await this.getFile(accessToken, fileKey);
      
      // Process and store the file data as needed
      // This is where you'd implement your import logic
      
      return {
        fileKey,
        name: name || fileData.name,
        data: fileData,
        importedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to import file:', error);
      throw error;
    }
  }

  async exportFile(
    accessToken: string, 
    fileKey: string, 
    format: 'json' | 'svg' | 'png' | 'pdf',
    options?: { scale?: number; nodeIds?: string[] }
  ) {
    try {
      if (format === 'json') {
        // Export as JSON (raw Figma file data)
        const fileData = await this.getFile(accessToken, fileKey);
        return fileData;
      } else {
        // Export as image/vector format
        const params: any = {
          format,
          scale: options?.scale || 1,
        };
        
        if (options?.nodeIds?.length) {
          params.ids = options.nodeIds.join(',');
        }

        const response = await this.api.get(`/images/${fileKey}`, {
          headers: this.getAuthHeaders(accessToken),
          params,
        });
        
        return response.data;
      }
    } catch (error) {
      console.error('Failed to export file:', error);
      throw error;
    }
  }

  async getTeamProjects(accessToken: string, teamId: string) {
    try {
      const response = await this.api.get(`/teams/${teamId}/projects`, {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get team projects:', error);
      throw error;
    }
  }

  async getProjectFiles(accessToken: string, projectId: string) {
    try {
      const response = await this.api.get(`/projects/${projectId}/files`, {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get project files:', error);
      throw error;
    }
  }
}