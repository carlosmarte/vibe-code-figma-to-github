import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

export class FigmaService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: config.FIGMA_API_BASE_URL,
      timeout: 30000,
    });
  }

  private getAuthHeaders(accessToken?: string) {
    // Use provided token or fallback to environment variable
    const token = accessToken || config.FIGMA_TOKEN;
    if (!token) {
      throw new Error('Figma API token not provided. Please set FIGMA_TOKEN in environment or provide token.');
    }
    return {
      'X-Figma-Token': token,
      'Content-Type': 'application/json',
    };
  }

  async getCurrentUser(accessToken?: string) {
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

  async getUserFiles(accessToken?: string) {
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

  async getUserTeams(accessToken?: string) {
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

  async getUserProjects(accessToken?: string, teamId?: string) {
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

  async getFile(fileKey: string, accessToken?: string) {
    try {
      const response = await this.api.get(`/files/${fileKey}`, {
        headers: this.getAuthHeaders(accessToken),
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your Figma token has access to this file.');
      } else if (error.response?.status === 404) {
        throw new Error(`File not found: ${fileKey}`);
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      console.error('Failed to get file:', error.response?.data || error.message);
      throw new Error(`Failed to get file: ${error.response?.data?.err || error.message}`);
    }
  }

  async getFileVersions(fileKey: string, accessToken?: string) {
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

  async getFileComments(fileKey: string, accessToken?: string) {
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

  async importFile(fileKey: string, name?: string, accessToken?: string) {
    try {
      const fileData = await this.getFile(fileKey, accessToken);
      
      // Extract useful metadata
      const pages = fileData.document?.children?.map((page: any) => ({
        id: page.id,
        name: page.name,
        type: page.type,
        childrenCount: page.children?.length || 0,
      })) || [];
      
      // Extract components if present
      const components = fileData.components ? Object.keys(fileData.components).map(key => ({
        id: key,
        name: fileData.components[key].name,
        description: fileData.components[key].description,
      })) : [];
      
      // Extract styles if present
      const styles = fileData.styles ? Object.keys(fileData.styles).map(key => ({
        id: key,
        name: fileData.styles[key].name,
        type: fileData.styles[key].style_type,
      })) : [];
      
      return {
        fileKey,
        name: name || fileData.name,
        lastModified: fileData.lastModified,
        version: fileData.version,
        pages,
        components,
        styles,
        thumbnailUrl: fileData.thumbnailUrl,
        importedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to import file:', error);
      throw error;
    }
  }
  
  async getFileNodes(fileKey: string, nodeIds?: string[], accessToken?: string) {
    try {
      // If specific node IDs are provided, fetch only those
      if (nodeIds && nodeIds.length > 0) {
        const response = await this.api.get(`/files/${fileKey}/nodes`, {
          headers: this.getAuthHeaders(accessToken),
          params: {
            ids: nodeIds.join(','),
          },
        });
        return response.data;
      }
      
      // Otherwise, get all exportable nodes from the file
      const fileData = await this.getFile(fileKey, accessToken);
      const exportableNodes: any[] = [];
      
      // Traverse the document tree to find exportable nodes
      const findExportableNodes = (node: any, path: string[] = []) => {
        const currentPath = [...path, node.name];
        
        // Add frames, components, and component sets
        if (['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(node.type)) {
          exportableNodes.push({
            id: node.id,
            name: node.name,
            type: node.type,
            path: currentPath.join(' / '),
          });
        }
        
        // Recursively process children
        if (node.children) {
          node.children.forEach((child: any) => findExportableNodes(child, currentPath));
        }
      };
      
      // Start from document pages
      if (fileData.document?.children) {
        fileData.document.children.forEach((page: any) => {
          if (page.children) {
            page.children.forEach((child: any) => findExportableNodes(child, [page.name]));
          }
        });
      }
      
      return {
        nodes: exportableNodes,
        fileKey,
        fileName: fileData.name,
      };
    } catch (error) {
      console.error('Failed to get file nodes:', error);
      throw error;
    }
  }

  async exportFile(
    fileKey: string, 
    format: 'json' | 'svg' | 'png' | 'pdf',
    options?: { scale?: number; nodeIds?: string[] },
    accessToken?: string
  ) {
    try {
      if (format === 'json') {
        // Export as JSON (raw Figma file data)
        const fileData = await this.getFile(fileKey, accessToken);
        return {
          type: 'json',
          data: fileData,
          filename: `${fileKey}.json`
        };
      } else {
        // Export as image/vector format - requires node IDs
        // If no node IDs provided, first get the file to extract the document node
        let nodeIds = options?.nodeIds;
        
        if (!nodeIds || nodeIds.length === 0) {
          // Get the file structure to find exportable nodes
          const fileData = await this.getFile(fileKey, accessToken);
          
          // Extract all top-level frames from the first page
          if (fileData.document?.children?.[0]?.children) {
            nodeIds = fileData.document.children[0].children
              .filter((node: any) => node.type === 'FRAME' || node.type === 'COMPONENT')
              .map((node: any) => node.id);
          }
          
          // If still no nodes, try to use the canvas/page node itself
          if (!nodeIds || nodeIds.length === 0) {
            if (fileData.document?.children?.[0]?.id) {
              nodeIds = [fileData.document.children[0].id];
            } else {
              throw new Error('No exportable nodes found in the Figma file');
            }
          }
        }
        
        const params: any = {
          format,
          ids: nodeIds.join(','),
        };
        
        // Only add scale for raster formats (PNG)
        if (format === 'png') {
          params.scale = options?.scale || 1;
        }

        const response = await this.api.get(`/images/${fileKey}`, {
          headers: this.getAuthHeaders(accessToken),
          params,
        });
        
        // Download the files from the URLs
        const images = response.data.images;
        const downloads = [];
        
        for (const [nodeId, url] of Object.entries(images)) {
          downloads.push({
            nodeId,
            url: url as string,
            format
          });
        }
        
        // If single file, download and return it
        if (downloads.length === 1) {
          const fileBuffer = await this.downloadFile(downloads[0].url);
          return {
            type: 'file',
            buffer: fileBuffer,
            filename: `${fileKey}-${downloads[0].nodeId}.${format}`,
            contentType: this.getContentType(format)
          };
        }
        
        // Multiple files - return URLs for now (could be enhanced to create a zip)
        return {
          type: 'urls',
          data: response.data,
          format
        };
      }
    } catch (error) {
      console.error('Failed to export file:', error);
      throw error;
    }
  }
  
  private async downloadFile(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Failed to download file from Figma:', error);
      throw new Error('Failed to download exported file');
    }
  }
  
  private getContentType(format: string): string {
    switch (format) {
      case 'svg':
        return 'image/svg+xml';
      case 'png':
        return 'image/png';
      case 'pdf':
        return 'application/pdf';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  async getTeamProjects(teamId: string, accessToken?: string) {
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

  async getProjectFiles(projectId: string, accessToken?: string) {
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