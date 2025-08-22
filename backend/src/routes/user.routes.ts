import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FigmaService } from '../services/figma.service';

export default async function userRoutes(fastify: FastifyInstance) {
  const figmaService = new FigmaService();

  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userInfo = await figmaService.getCurrentUser(request.user.accessToken);
      return { user: userInfo };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch user info' });
    }
  });

  fastify.get('/teams', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const teams = await figmaService.getUserTeams(request.user.accessToken);
      return { teams };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch teams' });
    }
  });

  fastify.get('/projects', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const projects = await figmaService.getUserProjects(request.user.accessToken);
      return { projects };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch projects' });
    }
  });
}