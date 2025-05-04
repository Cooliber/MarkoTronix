const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  containers: [
    'markotronix-hvac-ui-1',
    'markotronix-api-1',
    'markotronix-redis-1',
    'markotronix-postgres-1'
  ],
  thresholds: {
    cpu: 80, // percentage
    memory: 80, // percentage
    disk: 80, // percentage
    restarts: 5 // count
  },
  checkInterval: 60000, // 1 minute in milliseconds
  logFile: path.join(__dirname, 'logs', 'container-monitoring.log'),
  alertsFile: path.join(__dirname, 'logs', 'container-alerts.log')
};

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Function to get container stats
function getContainerStats(containerName) {
  try {
    const output = execSync(`docker stats ${containerName} --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}},{{.PIDs}}"`).toString().trim();
    const [name, cpuPerc, memUsage, memPerc, netIO, blockIO, pids] = output.split(',');
    
    return {
      name,
      cpuPerc: parseFloat(cpuPerc.replace('%', '')),
      memUsage,
      memPerc: parseFloat(memPerc.replace('%', '')),
      netIO,
      blockIO,
      pids: parseInt(pids, 10)
    };
  } catch (err) {
    return {
      name: containerName,
      error: err.message
    };
  }
}

// Function to get container restart count
function getContainerRestarts(containerName) {
  try {
    const output = execSync(`docker inspect ${containerName} --format "{{.RestartCount}}"`).toString().trim();
    return parseInt(output, 10);
  } catch (err) {
    return -1;
  }
}

// Function to log message
function logMessage(message, isAlert = false) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  
  console.log(logMessage);
  
  // Log to file
  fs.appendFileSync(config.logFile, logMessage + '\n');
  
  // If it's an alert, also log to alerts file
  if (isAlert) {
    fs.appendFileSync(config.alertsFile, logMessage + '\n');
  }
}

// Function to check container health
function checkContainerHealth() {
  logMessage('Starting container health check...');
  
  for (const containerName of config.containers) {
    // Check if container is running
    try {
      const status = execSync(`docker inspect --format "{{.State.Status}}" ${containerName}`).toString().trim();
      
      if (status !== 'running') {
        logMessage(`ALERT: Container ${containerName} is not running (status: ${status})`, true);
        continue;
      }
      
      // Get container stats
      const stats = getContainerStats(containerName);
      
      if (stats.error) {
        logMessage(`ERROR: Failed to get stats for container ${containerName}: ${stats.error}`);
        continue;
      }
      
      // Get restart count
      const restarts = getContainerRestarts(containerName);
      
      // Log current stats
      logMessage(`Container ${containerName}: CPU: ${stats.cpuPerc}%, Memory: ${stats.memPerc}%, PIDs: ${stats.pids}, Restarts: ${restarts}`);
      
      // Check thresholds
      if (stats.cpuPerc > config.thresholds.cpu) {
        logMessage(`ALERT: Container ${containerName} CPU usage (${stats.cpuPerc}%) exceeds threshold (${config.thresholds.cpu}%)`, true);
      }
      
      if (stats.memPerc > config.thresholds.memory) {
        logMessage(`ALERT: Container ${containerName} memory usage (${stats.memPerc}%) exceeds threshold (${config.thresholds.memory}%)`, true);
      }
      
      if (restarts > config.thresholds.restarts) {
        logMessage(`ALERT: Container ${containerName} restart count (${restarts}) exceeds threshold (${config.thresholds.restarts})`, true);
      }
    } catch (err) {
      logMessage(`ERROR: Failed to check container ${containerName}: ${err.message}`);
    }
  }
  
  logMessage('Container health check completed.');
}

// Main function
function main() {
  logMessage('Container monitoring started.');
  
  // Run initial check
  checkContainerHealth();
  
  // Set up interval for regular checks
  setInterval(checkContainerHealth, config.checkInterval);
}

// Start monitoring
main();
