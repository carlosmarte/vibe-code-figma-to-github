# Figma to GitHub Export - Setup Guide

## Quick Start

### 1. Prerequisites
- Node.js 18+ installed
- Figma account with Personal Access Token
- GitHub account with Personal Access Token

### 2. Environment Setup

You can configure tokens in two ways:

#### Option A: Using .env file (recommended for development)
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your tokens:
   - **FIGMA_TOKEN**: Get from https://www.figma.com/developers/api#access-tokens
   - **GITHUB_TOKEN_VIBE**: Get from https://github.com/settings/tokens (needs 'repo' scope)

#### Option B: Using system environment variables
Set environment variables directly in your shell:
```bash
export FIGMA_TOKEN="your_figma_token_here"
export GITHUB_TOKEN_VIBE="your_github_token_here"
```

Or add them to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.)

### 3. Install & Run

```bash
# Install dependencies
npm install

# Start the application
npm run dev
```

The application will be available at http://localhost:5173

## Workflow

1. **Import**: Go to Import page, enter your Figma file ID or URL
2. **Select**: Choose components to export on the Export page
3. **Export**: Either download as JSON/PNG/SVG or push directly to GitHub

## Troubleshooting

### "Failed to import file"
- Check that your FIGMA_TOKEN is valid
- Ensure you have access to the Figma file
- File ID should be the alphanumeric string from the Figma URL

### "GitHub token not configured"
- Make sure GITHUB_TOKEN_VIBE is set in your .env file
- Token needs 'repo' scope for creating pull requests

### Port already in use
The application automatically handles port conflicts, but if issues persist:
```bash
# Kill processes on ports
lsof -ti:3200 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```