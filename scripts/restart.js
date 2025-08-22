#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    const script = spawn('node', [path.join(__dirname, `${scriptName}.js`)], {
      stdio: 'inherit'
    });

    script.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} script failed with code ${code}`));
      }
    });

    script.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.clear();
  log('🔄 Figma Admin Portal - Restart', colors.bright + colors.cyan);
  log('=' .repeat(50), colors.cyan);

  try {
    // First, try graceful shutdown
    log('\n🛑 Stopping existing services...', colors.yellow);
    try {
      await runScript('shutdown');
    } catch (error) {
      log('   ⚠️  Graceful shutdown failed, forcing cleanup...', colors.yellow);
    }

    // Force kill any remaining processes
    const { exec } = require('child_process');
    const ports = [3000, 3200, 5173, 5174, 5175];
    for (const port of ports) {
      await new Promise((resolve) => {
        exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null`, () => resolve());
      });
    }

    // Wait a moment for complete cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then start services (which also does cleanup)
    log('\n🚀 Starting services...', colors.green);
    await runScript('startup');

  } catch (error) {
    log(`\n❌ Restart failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the restart script
main().catch(console.error);