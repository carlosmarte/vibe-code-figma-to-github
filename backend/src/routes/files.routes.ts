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

  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const files = await figmaService.getUserFiles(request.user.accessToken);
      return { files };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch files' });
    }
  });

  fastify.get('/:id', async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    try {
      const file = await figmaService.getFile(request.user.accessToken, id);
      return { file };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch file details' });
    }
  });

  fastify.post('/import', async (request: FastifyRequest<{ Body: ImportBody }>, reply: FastifyReply) => {
    const { fileKey, name } = request.body;
    
    try {
      const file = await figmaService.importFile(request.user.accessToken, fileKey, name);
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
      const exportData = await figmaService.exportFile(
        request.user.accessToken, 
        id, 
        format, 
        { scale, nodeIds }
      );
      return { 
        success: true, 
        data: exportData 
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to export file' });
    }
  });

  fastify.get('/:id/versions', async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    try {
      const versions = await figmaService.getFileVersions(request.user.accessToken, id);
      return { versions };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch file versions' });
    }
  });

  fastify.get('/:id/comments', async (request: FastifyRequest<{ Params: FileParams }>, reply: FastifyReply) => {
    const { id } = request.params;
    
    try {
      const comments = await figmaService.getFileComments(request.user.accessToken, id);
      return { comments };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch file comments' });
    }
  });
}