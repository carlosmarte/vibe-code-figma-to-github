import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

interface FigmaFileRequest {
  Params: {
    fileId: string;
  };
}

interface FigmaFileDetailsRequest {
  Querystring: {
    version?: string;
    depth?: number;
    geometry?: string;
    plugin_data?: string;
    branch_data?: boolean;
  };
}

export default async function figmaRoutes(fastify: FastifyInstance) {
  // Check if Figma token is configured
  fastify.get('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      configured: !!config.FIGMA_TOKEN,
      message: config.FIGMA_TOKEN 
        ? 'Figma API is configured and ready' 
        : 'Figma token is not configured. Please set FIGMA_TOKEN environment variable.'
    };
  });

  // Get Figma file details
  fastify.get<FigmaFileRequest & FigmaFileDetailsRequest>(
    '/files/:fileId', 
    {
      schema: {
        params: {
          type: 'object',
          required: ['fileId'],
          properties: {
            fileId: { type: 'string', description: 'Figma file ID or key' }
          }
        },
        querystring: {
          type: 'object',
          properties: {
            version: { type: 'string', description: 'Version ID to fetch' },
            depth: { type: 'number', description: 'Depth of node tree to return' },
            geometry: { type: 'string', description: 'Geometry data to include' },
            plugin_data: { type: 'string', description: 'Plugin data to include' },
            branch_data: { type: 'boolean', description: 'Include branch data' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              lastModified: { type: 'string' },
              thumbnailUrl: { type: 'string' },
              version: { type: 'string' },
              document: { type: 'object', additionalProperties: true },
              components: { type: 'object', additionalProperties: true },
              componentSets: { type: 'object', additionalProperties: true },
              schemaVersion: { type: 'number' },
              styles: { type: 'object', additionalProperties: true },
              role: { type: 'string' },
              editorType: { type: 'string' },
              linkAccess: { type: 'string' }
            },
            additionalProperties: true
          },
          401: {
            type: 'object',
            properties: {
              error: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      if (!config.FIGMA_TOKEN) {
        return reply.code(401).send({ 
          error: 'Figma token not configured. Please set FIGMA_TOKEN environment variable.' 
        });
      }

      const { fileId } = request.params;
      const queryParams = new URLSearchParams();
      
      // Don't add depth by default - let Figma API return full structure
      if (request.query.depth) queryParams.append('depth', request.query.depth.toString());
      if (request.query.version) queryParams.append('version', request.query.version);
      if (request.query.geometry) queryParams.append('geometry', request.query.geometry);
      if (request.query.plugin_data) queryParams.append('plugin_data', request.query.plugin_data);
      if (request.query.branch_data) queryParams.append('branch_data', 'true');

      const queryString = queryParams.toString();
      const url = `${config.FIGMA_API_BASE_URL}/files/${fileId}${queryString ? `?${queryString}` : ''}`;
      
      console.log('Fetching Figma file with URL:', url);
      console.log('Using token:', config.FIGMA_TOKEN ? `${config.FIGMA_TOKEN.substring(0, 10)}...` : 'NO TOKEN');

      try {
        const response = await fetch(url, {
          headers: {
            'X-Figma-Token': config.FIGMA_TOKEN
          }
        });

        if (!response.ok) {
          const error = await response.text();
          fastify.log.error(`Figma API error: ${response.status} - ${error}`);
          
          if (response.status === 403) {
            return reply.code(403).send({ 
              error: 'Invalid Figma token or insufficient permissions' 
            });
          }
          
          if (response.status === 404) {
            return reply.code(404).send({ 
              error: 'Figma file not found' 
            });
          }
          
          return reply.code(response.status).send({ 
            error: `Figma API error: ${error}` 
          });
        }

        const text = await response.text();
        console.log('Raw response length:', text.length);
        const data = JSON.parse(text);
        console.log('Figma API returned document with:', data.document ? Object.keys(data.document) : 'NO DOCUMENT');
        console.log('Document children count:', data.document?.children?.length || 0);
        console.log('Data keys:', Object.keys(data));
        return data;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ 
          error: 'Failed to fetch Figma file' 
        });
      }
    }
  );

  // Get file versions
  fastify.get<FigmaFileRequest>(
    '/files/:fileId/versions',
    {
      schema: {
        params: {
          type: 'object',
          required: ['fileId'],
          properties: {
            fileId: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      if (!config.FIGMA_TOKEN) {
        return reply.code(401).send({ 
          error: 'Figma token not configured' 
        });
      }

      const { fileId } = request.params;
      const url = `${config.FIGMA_API_BASE_URL}/files/${fileId}/versions`;

      try {
        const response = await fetch(url, {
          headers: {
            'X-Figma-Token': config.FIGMA_TOKEN
          }
        });

        if (!response.ok) {
          const error = await response.text();
          return reply.code(response.status).send({ 
            error: `Figma API error: ${error}` 
          });
        }

        const data = await response.json();
        return data;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ 
          error: 'Failed to fetch file versions' 
        });
      }
    }
  );

  // Get file comments
  fastify.get<FigmaFileRequest>(
    '/files/:fileId/comments',
    {
      schema: {
        params: {
          type: 'object',
          required: ['fileId'],
          properties: {
            fileId: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      if (!config.FIGMA_TOKEN) {
        return reply.code(401).send({ 
          error: 'Figma token not configured' 
        });
      }

      const { fileId } = request.params;
      const url = `${config.FIGMA_API_BASE_URL}/files/${fileId}/comments`;

      try {
        const response = await fetch(url, {
          headers: {
            'X-Figma-Token': config.FIGMA_TOKEN
          }
        });

        if (!response.ok) {
          const error = await response.text();
          return reply.code(response.status).send({ 
            error: `Figma API error: ${error}` 
          });
        }

        const data = await response.json();
        return data;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ 
          error: 'Failed to fetch file comments' 
        });
      }
    }
  );

  // Export file nodes
  fastify.post<{
    Params: { fileId: string };
    Body: {
      ids: string[];
      format: 'jpg' | 'png' | 'svg' | 'pdf';
      scale?: number;
      svg_include_id?: boolean;
      svg_simplify_stroke?: boolean;
      use_absolute_bounds?: boolean;
    };
  }>(
    '/files/:fileId/export',
    {
      schema: {
        params: {
          type: 'object',
          required: ['fileId'],
          properties: {
            fileId: { type: 'string' }
          }
        },
        body: {
          type: 'object',
          required: ['ids', 'format'],
          properties: {
            ids: { 
              type: 'array',
              items: { type: 'string' }
            },
            format: { 
              type: 'string',
              enum: ['jpg', 'png', 'svg', 'pdf']
            },
            scale: { type: 'number' },
            svg_include_id: { type: 'boolean' },
            svg_simplify_stroke: { type: 'boolean' },
            use_absolute_bounds: { type: 'boolean' }
          }
        }
      }
    },
    async (request, reply) => {
      if (!config.FIGMA_TOKEN) {
        return reply.code(401).send({ 
          error: 'Figma token not configured' 
        });
      }

      const { fileId } = request.params;
      const { ids, format, scale, ...options } = request.body;
      
      const queryParams = new URLSearchParams({
        ids: ids.join(','),
        format
      });
      
      if (scale) queryParams.append('scale', scale.toString());
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });

      const url = `${config.FIGMA_API_BASE_URL}/images/${fileId}?${queryParams}`;

      try {
        const response = await fetch(url, {
          headers: {
            'X-Figma-Token': config.FIGMA_TOKEN
          }
        });

        if (!response.ok) {
          const error = await response.text();
          return reply.code(response.status).send({ 
            error: `Figma API error: ${error}` 
          });
        }

        const data = await response.json();
        return data;
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ 
          error: 'Failed to export file' 
        });
      }
    }
  );
}