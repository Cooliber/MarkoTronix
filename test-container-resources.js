const { execSync } = require('child_process');

// Function to get container stats
function getContainerStats(containerName) {
  try {
    const output = execSync(`docker stats ${containerName} --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}},{{.MemPerc}},{{.NetIO}},{{.BlockIO}},{{.PIDs}}"`).toString().trim();
    const [name, cpuPerc, memUsage, memPerc, netIO, blockIO, pids] = output.split(',');
    
    return {
      name,
      cpuPerc,
      memUsage,
      memPerc,
      netIO,
      blockIO,
      pids
    };
  } catch (err) {
    return {
      name: containerName,
      error: err.message
    };
  }
}

// Function to get container logs (last N lines)
function getContainerLogs(containerName, lines = 10) {
  try {
    const output = execSync(`docker logs ${containerName} --tail ${lines}`).toString();
    return output;
  } catch (err) {
    return `Error getting logs: ${err.message}`;
  }
}

// Function to get container details
function getContainerDetails(containerName) {
  try {
    const output = execSync(`docker inspect ${containerName}`).toString();
    return JSON.parse(output);
  } catch (err) {
    return { error: err.message };
  }
}

// Function to get container environment variables
function getContainerEnv(containerName) {
  try {
    const details = getContainerDetails(containerName);
    if (details.error) return { error: details.error };
    
    const env = details[0].Config.Env;
    return env.reduce((acc, envVar) => {
      const [key, value] = envVar.split('=');
      acc[key] = value;
      return acc;
    }, {});
  } catch (err) {
    return { error: err.message };
  }
}

// Function to get container network settings
function getContainerNetwork(containerName) {
  try {
    const details = getContainerDetails(containerName);
    if (details.error) return { error: details.error };
    
    return details[0].NetworkSettings;
  } catch (err) {
    return { error: err.message };
  }
}

// Function to get container volumes
function getContainerVolumes(containerName) {
  try {
    const details = getContainerDetails(containerName);
    if (details.error) return { error: details.error };
    
    return details[0].Mounts;
  } catch (err) {
    return { error: err.message };
  }
}

// Main function to test container resources
function testContainerResources(containerNames) {
  console.log('=== Container Resource Tests ===\n');
  
  for (const containerName of containerNames) {
    console.log(`\n--- Testing container: ${containerName} ---\n`);
    
    // Get container stats
    console.log('Container Stats:');
    const stats = getContainerStats(containerName);
    if (stats.error) {
      console.log(`  Error: ${stats.error}`);
    } else {
      console.log(`  CPU Usage: ${stats.cpuPerc}`);
      console.log(`  Memory Usage: ${stats.memUsage} (${stats.memPerc})`);
      console.log(`  Network I/O: ${stats.netIO}`);
      console.log(`  Block I/O: ${stats.blockIO}`);
      console.log(`  PIDs: ${stats.pids}`);
    }
    
    // Get container environment variables
    console.log('\nContainer Environment Variables:');
    const env = getContainerEnv(containerName);
    if (env.error) {
      console.log(`  Error: ${env.error}`);
    } else {
      Object.entries(env).forEach(([key, value]) => {
        // Mask sensitive values
        if (key.toLowerCase().includes('key') || 
            key.toLowerCase().includes('secret') || 
            key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('token')) {
          console.log(`  ${key}: ********`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      });
    }
    
    // Get container volumes
    console.log('\nContainer Volumes:');
    const volumes = getContainerVolumes(containerName);
    if (volumes.error) {
      console.log(`  Error: ${volumes.error}`);
    } else if (volumes.length === 0) {
      console.log('  No volumes mounted');
    } else {
      volumes.forEach((volume, index) => {
        console.log(`  Volume ${index + 1}:`);
        console.log(`    Source: ${volume.Source}`);
        console.log(`    Destination: ${volume.Destination}`);
        console.log(`    Mode: ${volume.Mode}`);
        console.log(`    RW: ${volume.RW}`);
      });
    }
    
    // Get container logs
    console.log('\nContainer Logs (last 5 lines):');
    const logs = getContainerLogs(containerName, 5);
    console.log(logs);
  }
  
  console.log('\n=== Tests Completed ===');
}

// Run the tests for the MarkoTronix containers
const containers = [
  'markotronix-hvac-ui-1',
  'markotronix-api-1',
  'markotronix-redis-1',
  'markotronix-postgres-1'
];

testContainerResources(containers);