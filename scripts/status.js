#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PID_FILE = path.join(__dirname, '../.pids.json');
const BACKEND_PORT = process.env.BACKEND_PORT || 3200;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 5173;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkProcess(pid) {
  return new Promise((resolve) => {
    exec(`ps -p ${pid} -o comm=`, (error, stdout) => {
      resolve(!error && stdout.trim().length > 0);
    });
  });
}

function checkPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -i:${port}`, (error, stdout) => {
      if (!error && stdout) {
        // Extract PID from lsof output
        const lines = stdout.trim().split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          resolve({ inUse: true, pid: parts[1] });
        } else {
          resolve({ inUse: false });
        }
      } else {
        resolve({ inUse: false });
      }
    });
  });
}

async function checkHealth(url) {
  return new Promise((resolve) => {
    exec(`curl -s -o /dev/null -w "%{http_code}" ${url}`, (error, stdout) => {
      if (!error && stdout === '200') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function main() {
  console.clear();
  log('📊 Figma Admin Portal - Service Status', colors.bright + colors.cyan);
  log('=' .repeat(50), colors.cyan);

  const status = {
    backend: { running: false, pid: null, port: BACKEND_PORT, healthy: false },
    frontend: { running: false, pid: null, port: FRONTEND_PORT, healthy: false }
  };

  // Check PID file
  if (fs.existsSync(PID_FILE)) {
    log('\n📋 Checking saved processes...', colors.cyan);
    
    try {
      const pids = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
      
      // Check backend
      if (pids.backend) {
        const isRunning = await checkProcess(pids.backend);
        status.backend.running = isRunning;
        status.backend.pid = pids.backend;
      }

      // Check frontend
      if (pids.frontend) {
        const isRunning = await checkProcess(pids.frontend);
        status.frontend.running = isRunning;
        status.frontend.pid = pids.frontend;
      }
    } catch (error) {
      log(`⚠️  Error reading PID file: ${error.message}`, colors.yellow);
    }
  }

  // Check ports
  log('\n🔍 Checking service ports...', colors.cyan);
  
  const backendPort = await checkPort(BACKEND_PORT);
  const frontendPort = await checkPort(FRONTEND_PORT);

  if (backendPort.inUse) {
    status.backend.running = true;
    if (!status.backend.pid) {
      status.backend.pid = backendPort.pid;
    }
  }

  if (frontendPort.inUse) {
    status.frontend.running = true;
    if (!status.frontend.pid) {
      status.frontend.pid = frontendPort.pid;
    }
  }

  // Check health endpoints
  if (status.backend.running) {
    status.backend.healthy = await checkHealth(`http://localhost:${BACKEND_PORT}/api/health`);
  }

  if (status.frontend.running) {
    status.frontend.healthy = await checkHealth(`http://localhost:${FRONTEND_PORT}`);
  }

  // Display status
  log('\n📈 Service Status:', colors.bright);
  log('─' .repeat(50));

  // Backend status
  log('\n🔧 Backend Service:', colors.cyan);
  if (status.backend.running) {
    log(`   Status:  ${colors.green}● Running${colors.reset}`);
    log(`   PID:     ${status.backend.pid}`);
    log(`   Port:    ${status.backend.port}`);
    log(`   Health:  ${status.backend.healthy ? `${colors.green}✅ Healthy` : `${colors.yellow}⚠️  Unhealthy`}${colors.reset}`);
    log(`   URL:     http://localhost:${status.backend.port}`);
    log(`   API Docs: http://localhost:${status.backend.port}/documentation`);
  } else {
    log(`   Status:  ${colors.red}○ Not Running${colors.reset}`);
    log(`   Port:    ${status.backend.port} (available)`);
  }

  // Frontend status
  log('\n⚛️  Frontend Service:', colors.cyan);
  if (status.frontend.running) {
    log(`   Status:  ${colors.green}● Running${colors.reset}`);
    log(`   PID:     ${status.frontend.pid}`);
    log(`   Port:    ${status.frontend.port}`);
    log(`   Health:  ${status.frontend.healthy ? `${colors.green}✅ Healthy` : `${colors.yellow}⚠️  Unhealthy`}${colors.reset}`);
    log(`   URL:     http://localhost:${status.frontend.port}`);
  } else {
    log(`   Status:  ${colors.red}○ Not Running${colors.reset}`);
    log(`   Port:    ${status.frontend.port} (available)`);
  }

  // Check for additional Vite ports
  log('\n🔍 Additional port check:', colors.cyan);
  const additionalPorts = [3000, 5174, 5175];
  let hasAdditional = false;
  
  for (const port of additionalPorts) {
    const portStatus = await checkPort(port);
    if (portStatus.inUse) {
      log(`   ⚠️  Port ${port} is in use (PID: ${portStatus.pid})`, colors.yellow);
      hasAdditional = true;
    }
  }
  
  if (!hasAdditional) {
    log(`   ✅ No additional services found`, colors.green);
  }

  // Summary
  log('\n' + '=' .repeat(50), colors.cyan);
  
  const allRunning = status.backend.running && status.frontend.running;
  const allHealthy = status.backend.healthy && status.frontend.healthy;
  const noneRunning = !status.backend.running && !status.frontend.running;

  if (allRunning && allHealthy) {
    log('✨ All services are running and healthy!', colors.bright + colors.green);
  } else if (allRunning) {
    log('⚠️  Services are running but some may be unhealthy', colors.yellow);
  } else if (noneRunning) {
    log('💤 No services are currently running', colors.yellow);
    log(`\n💡 Run ${colors.cyan}npm run start${colors.reset} to start all services`);
  } else {
    log('⚠️  Some services are not running', colors.yellow);
    log(`\n💡 Run ${colors.cyan}npm run restart${colors.reset} to restart all services`);
  }

  log('=' .repeat(50), colors.cyan);
  
  process.exit(0);
}

// Run the status script
main().catch(error => {
  log(`❌ Status check failed: ${error.message}`, colors.red);
  process.exit(1);
});