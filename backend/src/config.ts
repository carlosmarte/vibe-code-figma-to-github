import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load .env file if it exists, otherwise rely on system environment variables
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('📋 Loaded configuration from .env file');
} else {
  console.log('📋 Using system environment variables (no .env file found)');
}

export const config = {
  PORT: parseInt(process.env.PORT || '3200', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Figma API Configuration - Using Personal Access Token
  FIGMA_TOKEN: process.env.FIGMA_TOKEN || '',
  FIGMA_API_BASE_URL: 'https://api.figma.com/v1',
  
  // GitHub API Configuration
  GITHUB_TOKEN_VIBE: process.env.GITHUB_TOKEN_VIBE || '',
  GITHUB_API_BASE_URL: 'https://api.github.com',
  
  // Database (optional - for storing user sessions/data)
  DATABASE_URL: process.env.DATABASE_URL || '',
};