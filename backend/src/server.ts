import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from './config';
import { registerRoutes } from './routes';
import authPlugin from './plugins/auth.plugin';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ProcessManager } from './utils/process-manager';

const execAsync = promisify(exec);
const processManager = ProcessManager.getInstance();

const buildServer = () => {
  const fastify = Fastify({
    logger: {
      level: config.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  });

  fastify.register(cors, {
    origin: config.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  fastify.register(cookie);

  fastify.register(jwt, {
    secret: config.JWT_SECRET || 'your-secret-key-change-in-production',
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  });

  fastify.register(swagger, {
    swagger: {
      info: {
        title: 'Figma Admin API',
        description: 'API for Figma File Admin Portal',
        version: '1.0.0',
      },
      host: 'localhost:3000',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
  });

  fastify.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
  });

  fastify.register(authPlugin);
  
  registerRoutes(fastify);

  return fastify;
};

async function checkPort(port: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(`lsof -i:${port}`);
    return !stdout || stdout.trim().length === 0;
  } catch {
    return true; // Port is available
  }
}

async function getProcessOnPort(port: number): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`lsof -i:${port} -t`);
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function killProcessOnPort(port: number): Promise<boolean> {
  try {
    const pid = await getProcessOnPort(port);
    if (pid) {
      console.log(`⚠️  Found existing process (PID: ${pid}) on port ${port}`);
      await execAsync(`kill -TERM ${pid}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if still running and force kill if needed
      const stillRunning = await getProcessOnPort(port);
      if (stillRunning) {
        await execAsync(`kill -9 ${pid}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      console.log(`✅ Cleared port ${port}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Failed to clear port ${port}:`, error);
    return false;
  }
}

async function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + maxAttempts - 1}`);
}

const start = async () => {
  // Clean up any stale process entries first
  await processManager.cleanupStaleProcesses();
  
  const server = buildServer();
  let actualPort = config.PORT;
  
  try {
    // Try to acquire lock for this port
    const lockAcquired = await processManager.acquireLock(config.PORT, 'backend');
    
    if (!lockAcquired) {
      console.log(`\n⚠️  Another backend instance is already running on port ${config.PORT}`);
      console.log(`💡 Use 'npm run stop' to stop all instances or 'npm run restart' to restart`);
      process.exit(1);
    }
    
    // Check if the desired port is available
    const portAvailable = await checkPort(config.PORT);
    
    if (!portAvailable) {
      console.log(`\n⚠️  Port ${config.PORT} is already in use by another process`);
      
      // In development, try to clear the port
      if (config.NODE_ENV === 'development') {
        console.log(`🔄 Attempting to clear port ${config.PORT}...`);
        await processManager.killAllOnPort(config.PORT);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const nowAvailable = await checkPort(config.PORT);
        if (nowAvailable) {
          actualPort = config.PORT;
          console.log(`✅ Port ${config.PORT} cleared successfully`);
        } else {
          // Couldn't clear, find an alternative
          console.log(`🔍 Finding an alternative port...`);
          actualPort = await findAvailablePort(config.PORT + 1);
          console.log(`📌 Using alternative port: ${actualPort}`);
        }
      } else {
        // In production, just find an alternative port
        actualPort = await findAvailablePort(config.PORT + 1);
        console.log(`📌 Using alternative port: ${actualPort}`);
      }
    }
    
    await server.listen({ 
      port: actualPort,
      host: '0.0.0.0'
    });
    console.log(`✅ Server running at http://localhost:${actualPort}`);
    console.log(`📚 API Documentation at http://localhost:${actualPort}/documentation`);
    
    if (actualPort !== config.PORT) {
      console.log(`\n💡 Note: Server is running on port ${actualPort} instead of the configured port ${config.PORT}`);
      console.log(`   To use the default port, stop the process on port ${config.PORT} or run: npm run clean:ports`);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Store the actual port for cleanup
  (global as any).__SERVER_PORT__ = actualPort;
  (global as any).__SERVER_INSTANCE__ = server;

  // Graceful shutdown handling
  const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    try {
      await server.close();
      console.log('Server closed successfully');
      
      // Release the process lock
      await processManager.releaseLock();
      
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));

  // Handle tsx watch restart
  process.on('SIGUSR2', async () => {
    console.log('Restarting server...');
    try {
      await server.close();
    } catch (err) {
      console.error('Error closing server:', err);
    }
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (err) => {
    console.error('Uncaught Exception:', err);
    await gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await gracefulShutdown('unhandledRejection');
  });
};

start();