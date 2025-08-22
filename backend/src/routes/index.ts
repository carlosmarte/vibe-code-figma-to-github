import { FastifyInstance } from 'fastify';
import figmaRoutes from './figma.routes';
import healthRoutes from './health.routes';
import githubRoutes from './github.routes';
import filesRoutes from './files.routes';

export const registerRoutes = (fastify: FastifyInstance) => {
  fastify.register(healthRoutes, { prefix: '/api/health' });
  fastify.register(figmaRoutes, { prefix: '/api/figma' });
  fastify.register(githubRoutes, { prefix: '/api/github' });
  fastify.register(filesRoutes, { prefix: '/api/files' });
};