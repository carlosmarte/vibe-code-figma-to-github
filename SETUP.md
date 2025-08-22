# Figma to GitHub Export - Complete Setup Guide

## 📋 Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Features & Usage](#features--usage)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Overview

This application bridges Figma and GitHub, allowing you to:
- Import Figma designs and components
- Export them in various formats (JSON, PNG, SVG, PDF)
- Convert Figma components to React components (NEW!)
- Push exports directly to GitHub as pull requests

## Prerequisites

### Required Software
- **Node.js** (v18.0.0 or higher)
  - Check version: `node --version`
  - Download: https://nodejs.org/
- **npm** (v8.0.0 or higher)
  - Comes with Node.js
  - Check version: `npm --version`
- **Git**
  - Check installation: `git --version`
  - Download: https://git-scm.com/

### Required Accounts & Tokens
1. **Figma Account**
   - Personal Access Token required
   - Get it here: https://www.figma.com/developers/api#access-tokens

2. **GitHub Account**
   - Personal Access Token required
   - Get it here: https://github.com/settings/tokens
   - Required scopes: `repo` (full control of private repositories)

## Installation

### Step 1: Clone the Repository
```bash
# Clone the repository
git clone https://github.com/carlosmarte/vibe-code-figma-to-github.git

# Navigate to the project directory
cd vibe-code-figma-to-github
```

### Step 2: Install Dependencies
```bash
# Install all dependencies for both frontend and backend
npm install
```

This will install dependencies for:
- Root workspace
- Backend server (`/backend`)
- Frontend application (`/frontend`)

### Step 3: Verify Installation
```bash
# Check that all dependencies are installed
npm list --depth=0
```

## Configuration

### Step 1: Create Environment File
```bash
# Copy the example environment file
cp .env.example .env
```

### Step 2: Configure Tokens

Edit the `.env` file and add your tokens:

```env
# Figma API Configuration
FIGMA_TOKEN=figd_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# GitHub API Configuration  
GITHUB_TOKEN_VIBE=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Server Configuration (optional - defaults shown)
PORT=3200
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 3: Verify Configuration
```bash
# Test Figma token
curl -H "X-Figma-Token: YOUR_FIGMA_TOKEN" \
  "https://api.figma.com/v1/me"

# Test GitHub token
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
  "https://api.github.com/user"
```

Both commands should return your user information if tokens are valid.

## Running the Application

### Development Mode (Recommended)
```bash
# Start both frontend and backend with hot reload
npm run dev
```

This starts:
- Backend API server: http://localhost:3200
- Frontend React app: http://localhost:5173
- API Documentation: http://localhost:3200/documentation

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Individual Services
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend

# Stop all services
npm run stop
```

## Features & Usage

### 1. Import Figma Files
1. Navigate to **Import** page (http://localhost:5173/import)
2. Enter Figma file ID or URL:
   - File ID: `tmaZV2VEXIIrWYVjqaNUxa`
   - Or full URL: `https://www.figma.com/file/tmaZV2VEXIIrWYVjqaNUxa/...`
3. Click **Import File**
4. View file structure and components

### 2. Export Components

#### Traditional Export (Download)
1. Go to **Export** page
2. Enter the Figma file ID
3. Select export format:
   - **JSON**: Raw Figma data
   - **PNG**: Raster image (scalable)
   - **SVG**: Vector graphics
   - **PDF**: Document format
4. Configure options (scale for PNG, node IDs)
5. Click **Export File** to download

#### GitHub Export (Pull Request)
1. Go to **Export** → **GitHub Export** tab
2. Enter GitHub repository URL
3. Configure:
   - **File Path**: Where to save (e.g., `src/components/`)
   - **Component**: Select from dropdown
   - **✨ NEW - Convert to React**: Check to generate React component
   - **Branches**: Select base and target branches
4. Click **Export to GitHub**
5. A pull request will be created automatically

### 3. React Component Conversion (NEW!)
When "Convert to React Component" is checked:
- Figma designs are converted to functional React components
- TypeScript interfaces are generated
- Styles are converted to CSS
- Filename is auto-generated from component name
- File extension changes to `.tsx`

Example conversion:
- Figma Component: "Primary Button"
- Generated file: `primary-button.tsx`
- Includes props interface and styled component

### 4. Settings
Configure default options:
- API endpoints
- Default export formats
- GitHub organization defaults

## Troubleshooting

### Common Issues

#### "Failed to import file" Error
**Causes & Solutions:**
1. **Invalid token**: Check `FIGMA_TOKEN` in `.env`
2. **No file access**: Ensure you have view access to the Figma file
3. **Wrong file ID**: Use the alphanumeric string from Figma URL
4. **Token format**: Should start with `figd_`

#### "GitHub export failed" Error
**Causes & Solutions:**
1. **Invalid token**: Check `GITHUB_TOKEN_VIBE` in `.env`
2. **Missing permissions**: Token needs `repo` scope
3. **Invalid repository**: Check repository URL format
4. **Protected branch**: Can't push directly to protected branches

#### Port Already in Use
```bash
# Check what's using the ports
lsof -i :3200
lsof -i :5173

# Kill processes if needed
kill -9 $(lsof -ti:3200)
kill -9 $(lsof -ti:5173)

# Or use the built-in command
npm run clean:ports
```

#### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
rm -rf backend/node_modules backend/package-lock.json
npm install
```

#### Environment Variables Not Loading
1. Check `.env` file exists in root directory
2. Restart the development server after changes
3. Verify no syntax errors in `.env`
4. Don't commit `.env` to version control

### Debugging

#### Enable Debug Logging
```bash
# Set log level in .env
LOG_LEVEL=debug

# Or set when running
LOG_LEVEL=debug npm run dev
```

#### Check Server Logs
Backend logs show:
- API requests and responses
- Token validation status
- File processing details
- Error stack traces

#### Test API Endpoints
```bash
# Test backend health
curl http://localhost:3200/health

# Test Figma integration
curl -X POST http://localhost:3200/api/files/import \
  -H "Content-Type: application/json" \
  -d '{"fileKey": "YOUR_FILE_ID"}'

# View API documentation
open http://localhost:3200/documentation
```

## Development

### Project Structure
```
vibe-code-figma-to-github/
├── backend/              # Express/Fastify API server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   └── config.ts    # Configuration
│   └── package.json
├── frontend/            # React application
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── services/   # API clients
│   └── package.json
├── shared/              # Shared types and utilities
│   └── types/
└── .env                 # Environment configuration
```

### Available Scripts
```bash
# Development
npm run dev              # Start everything
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only

# Building
npm run build           # Build everything
npm run build:backend   # Backend only
npm run build:frontend  # Frontend only

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode

# Utilities
npm run clean           # Clean build artifacts
npm run clean:ports     # Kill processes on ports
npm run stop            # Stop all services
npm run restart         # Restart everything
```

### Making Changes
1. Backend changes: Edit files in `/backend/src`
2. Frontend changes: Edit files in `/frontend/src`
3. Hot reload is enabled - changes apply automatically

### Adding New Features
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes following existing patterns
3. Test thoroughly
4. Create pull request

## Support

### Resources
- [Figma API Documentation](https://www.figma.com/developers/api)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

### Getting Help
- Check existing issues: [GitHub Issues](https://github.com/carlosmarte/vibe-code-figma-to-github/issues)
- Create new issue with:
  - Error messages
  - Steps to reproduce
  - Environment details
  - Screenshots if applicable

### Contributing
Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See LICENSE file for details

---

**Last Updated**: August 2025
**Version**: 1.0.0