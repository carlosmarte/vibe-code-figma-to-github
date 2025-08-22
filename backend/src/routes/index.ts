import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import filesRoutes from './files.routes';
import userRoutes from './user.routes';
import healthRoutes from './health.routes';

export const registerRoutes = (fastify: FastifyInstance) => {
  fastify.register(healthRoutes, { prefix: '/api/health' });
  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(filesRoutes, { prefix: '/api/files' });
  fastify.register(userRoutes, { prefix: '/api/user' });
};