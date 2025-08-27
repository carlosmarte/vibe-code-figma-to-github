import { config } from '../config';

// Dynamic imports for the external Figma modules
let FigmaFilesSDK: any;
let FigmaComponentsSDK: any;

async function initializeSDKs() {
  if (!FigmaFilesSDK) {
    const filesModule = await import('../../../external/figma-api-module/mjs/files/index.mjs');
    FigmaFilesSDK = filesModule.FigmaFilesSDK;
  }
  
  if (!FigmaComponentsSDK) {
    const componentsModule = await import('../../../external/figma-api-module/mjs/components/index.mjs');
    FigmaComponentsSDK = componentsModule.FigmaComponentsSDK;
  }
}

export class FigmaSDKService {
  private filesSDK: any;
  private componentsSDK: any;
  private initialized: boolean = false;

  async initialize(accessToken?: string) {
    if (!this.initialized) {
      await initializeSDKs();
      
      const token = accessToken || config.FIGMA_TOKEN;
      if (!token) {
        throw new Error('Figma API token not provided');
      }

      this.filesSDK = new FigmaFilesSDK({
        apiToken: token,
        clientConfig: {
          timeout: 30000,
          retryConfig: {
            maxRetries: 3,
            initialDelay: 1000
          }
        }
      });

      this.componentsSDK = new FigmaComponentsSDK({
        apiToken: token,
        clientConfig: {
          timeout: 30000,
          retryConfig: {
            maxRetries: 3,
            initialDelay: 1000
          }
        }
      });

      this.initialized = true;
    }
  }

  async getFile(fileKey: string, options?: any) {
    await this.initialize();
    return this.filesSDK.getFile(fileKey, options);
  }

  async getNodes(fileKey: string, nodeIds: string[], options?: any) {
    await this.initialize();
    return this.filesSDK.getNodes(fileKey, nodeIds, options);
  }

  async getFileVersions(fileKey: string) {
    await this.initialize();
    return this.filesSDK.getVersions(fileKey);
  }

  async getFileComments(fileKey: string) {
    await this.initialize();
    return this.filesSDK.getComments(fileKey);
  }

  async renderImages(fileKey: string, params: {
    ids: string[];
    format: 'jpg' | 'png' | 'svg' | 'pdf';
    scale?: number;
    svg_include_id?: boolean;
    svg_simplify_stroke?: boolean;
    use_absolute_bounds?: boolean;
  }) {
    await this.initialize();
    return this.filesSDK.renderImages(fileKey, params);
  }

  async getComponents(fileKey: string) {
    await this.initialize();
    try {
      // Try to get components using the components SDK
      return await this.componentsSDK.getFileComponents(fileKey);
    } catch (error) {
      // Fallback to extracting from file data
      const fileData = await this.getFile(fileKey);
      return this.extractComponentsFromFile(fileData);
    }
  }

  private extractComponentsFromFile(fileData: any) {
    const components: any[] = [];
    
    const extractNodes = (node: any, path: string[] = []) => {
      if (!node) return;
      
      const currentPath = [...path, node.name || 'Unnamed'];
      
      if (['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(node.type)) {
        components.push({
          id: node.id,
          name: node.name || 'Unnamed',
          type: node.type,
          path: currentPath.join(' / ')
        });
      }
      
      if (node.children) {
        node.children.forEach((child: any) => extractNodes(child, currentPath));
      }
    };
    
    if (fileData.document?.children) {
      fileData.document.children.forEach((page: any) => {
        if (page.children) {
          page.children.forEach((child: any) => extractNodes(child, [page.name]));
        }
      });
    }
    
    return components;
  }

  async getFilePreview(fileKey: string) {
    await this.initialize();
    
    try {
      const fileData = await this.getFile(fileKey);
      
      // Try to get preview of the first frame
      if (fileData.document?.children?.[0]?.children?.[0]) {
        const firstFrameId = fileData.document.children[0].children[0].id;
        const images = await this.renderImages(fileKey, {
          ids: [firstFrameId],
          format: 'png',
          scale: 2
        });
        
        return {
          previewUrl: images.images ? Object.values(images.images)[0] : fileData.thumbnailUrl,
          fileData
        };
      }
      
      return {
        previewUrl: fileData.thumbnailUrl,
        fileData
      };
    } catch (error) {
      console.error('Failed to get file preview:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const figmaSDKService = new FigmaSDKService();