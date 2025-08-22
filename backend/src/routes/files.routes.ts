import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FigmaService } from '../services/figma.service';

interface FileParams {
  id: string;
}

interface ImportBody {
  fileKey: string;
  name?: string;
}

interface ExportBody {
  format: 'json' | 'svg' | 'png' | 'pdf';
  scale?: number;
  nodeIds?: string[];
}

export default async function filesRoutes(fastify: FastifyInstance) {
  const figmaService = new FigmaService();

  // Optional authentication - check for token but don't require it
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      const token = request.cookies?.token || request.headers.authorization?.replace('Bearer ', '');
      
      if (token && fastify.jwt) {
        try {
          const decoded = fastify.jwt.verify(token);
          request.user = decoded;
        } catch (error) {
          // Invalid token, but continue without user
          fastify.log.info('Invalid token, continuing without authentication');
        }
      } else {
        // No token provided, will use environment variables
        fastify.log.info('No authentication token, using environment variables');
      }
    } catch (error) {
      // Continue without authentication
      fastify.log.error('Error in authentication check:', error);
    }
  });

  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    // Return empty files array - we don't list user files, just import directly by ID
    return { files: [] };
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    try {
      // Updated method signature: fileKey first, then optional accessToken
      const file = await figmaService.getFile(id, request.user?.accessToken);
      return { file };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch file details' });
    }
  });

  fastify.post('/import', async (request: FastifyRequest<{ Body: ImportBody }>, reply: FastifyReply) => {
    const { fileKey, name } = request.body;
    
    try {
      // Updated method signature: fileKey, name, then optional accessToken
      const file = await figmaService.importFile(fileKey, name, request.user?.accessToken);
      return { 
        success: true, 
        file 
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to import file' });
    }
  });

  fastify.post('/:id/export', async (request: FastifyRequest<{ Params: FileParams; Body: ExportBody }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { format, scale, nodeIds } = request.body;
    
    try {
      // Updated method signature: fileKey, format, options, then optional accessToken
      const exportResult = await figmaService.exportFile(
        id, 
        format, 
        { scale, nodeIds },
        request.user?.accessToken
      );
      
      // Handle different export result types
      if (exportResult.type === 'file') {
        // Single file - send as download
        reply
          .header('Content-Type', exportResult.contentType)
          .header('Content-Disposition', `attachment; filename="${exportResult.filename}"`)
          .send(exportResult.buffer);
      } else if (exportResult.type === 'json') {
        // JSON data - send as download
        reply
          .header('Content-Type', 'application/json')
          .header('Content-Disposition', `attachment; filename="${exportResult.filename}"`)
          .send(JSON.stringify(exportResult.data, null, 2));
      } else {
        // Multiple files - return URLs (frontend can handle multiple downloads)
        return { 
          success: true, 
          type: 'urls',
          data: exportResult.data 
        };
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to export file' });
    }
  });

  fastify.get('/:id/versions', async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    try {
      // Updated method signature: fileKey first, then optional accessToken
      const versions = await figmaService.getFileVersions(id, request.user?.accessToken);
      return { versions };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch file versions' });
    }
  });

  fastify.get('/:id/comments', async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    try {
      // Updated method signature: fileKey first, then optional accessToken
      const comments = await figmaService.getFileComments(id, request.user?.accessToken);
      return { comments };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch file comments' });
    }
  });
  
  fastify.get('/:id/nodes', async (request: FastifyRequest<{ 
    Params: FileParams; 
    Querystring: { ids?: string } 
  }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { ids } = request.query as { ids?: string };
    
    try {
      const nodeIds = ids ? ids.split(',') : undefined;
      const nodes = await figmaService.getFileNodes(id, nodeIds, request.user?.accessToken);
      return { 
        success: true,
        ...nodes 
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch file nodes' });
    }
  });
}