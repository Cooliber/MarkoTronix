const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  backupDir: path.join(__dirname, 'backups'),
  databaseConfig: {
    containerName: 'markotronix-postgres-1',
    database: 'hvac_crm',
    user: 'postgres'
  }
};

// Function to log messages
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Function to list available backups
function listBackups() {
  try {
    // Get all backup directories
    const backupDirs = fs.readdirSync(config.backupDir)
      .filter(file => {
        const fullPath = path.join(config.backupDir, file);
        return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(file);
      })
      .sort()
      .reverse(); // Most recent first
    
    if (backupDirs.length === 0) {
      log('No backups found.');
      return [];
    }
    
    log('Available backups:');
    backupDirs.forEach((dir, index) => {
      console.log(`${index + 1}. ${dir}`);
    });
    
    return backupDirs;
  } catch (err) {
    log(`ERROR: Failed to list backups: ${err.message}`);
    return [];
  }
}

// Function to list backup files in a directory
function listBackupFiles(backupDir) {
  try {
    const fullPath = path.join(config.backupDir, backupDir);
    const files = fs.readdirSync(fullPath)
      .filter(file => file.endsWith('.sql.gz') || file.endsWith('.tar.gz'))
      .sort();
    
    if (files.length === 0) {
      log(`No backup files found in ${backupDir}.`);
      return [];
    }
    
    log(`Available backup files in ${backupDir}:`);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    return files;
  } catch (err) {
    log(`ERROR: Failed to list backup files: ${err.message}`);
    return [];
  }
}

// Function to restore PostgreSQL database
function restoreDatabase(backupDir, backupFile) {
  try {
    log(`Starting database restore from ${backupFile}...`);
    
    const backupFilePath = path.join(config.backupDir, backupDir, backupFile);
    
    // Check if the file exists
    if (!fs.existsSync(backupFilePath)) {
      log(`ERROR: Backup file ${backupFilePath} does not exist.`);
      return false;
    }
    
    // Decompress the backup file
    const sqlFilePath = backupFilePath.replace('.gz', '');
    execSync(`gunzip -c ${backupFilePath} > ${sqlFilePath}`);
    
    // Restore the database
    execSync(`cat ${sqlFilePath} | docker exec -i ${config.databaseConfig.containerName} psql -U ${config.databaseConfig.user} ${config.databaseConfig.database}`);
    
    // Clean up the decompressed file
    fs.unlinkSync(sqlFilePath);
    
    log(`Database restore completed successfully.`);
    return true;
  } catch (err) {
    log(`ERROR: Failed to restore database: ${err.message}`);
    return false;
  }
}

// Function to restore Docker volume
function restoreVolume(backupDir, backupFile, volumeName) {
  try {
    log(`Starting volume restore for ${volumeName} from ${backupFile}...`);
    
    const backupFilePath = path.join(config.backupDir, backupDir, backupFile);
    
    // Check if the file exists
    if (!fs.existsSync(backupFilePath)) {
      log(`ERROR: Backup file ${backupFilePath} does not exist.`);
      return false;
    }
    
    // Stop the related containers
    log('Stopping related containers...');
    execSync('docker-compose stop');
    
    // Restore the volume
    execSync(`docker run --rm -v markotronix_${volumeName}:/dest -v ${path.dirname(backupFilePath)}:/backup alpine sh -c "rm -rf /dest/* && tar -xzf /backup/${path.basename(backupFile)} -C /dest"`);
    
    // Restart the containers
    log('Restarting containers...');
    execSync('docker-compose up -d');
    
    log(`Volume restore completed successfully.`);
    return true;
  } catch (err) {
    log(`ERROR: Failed to restore volume: ${err.message}`);
    return false;
  }
}

// Function to restore Supabase data
function restoreSupabase(backupDir, backupFile) {
  try {
    log(`Starting Supabase data restore from ${backupFile}...`);
    
    const backupFilePath = path.join(config.backupDir, backupDir, backupFile);
    
    // Check if the file exists
    if (!fs.existsSync(backupFilePath)) {
      log(`ERROR: Backup file ${backupFilePath} does not exist.`);
      return false;
    }
    
    // Create a temporary directory
    const tempDir = path.join(__dirname, 'temp_supabase_restore');
    if (fs.existsSync(tempDir)) {
      execSync(`rm -rf ${tempDir}`);
    }
    fs.mkdirSync(tempDir);
    
    // Extract the backup
    execSync(`tar -xzf ${backupFilePath} -C ${tempDir}`);
    
    // Get all JSON files
    const jsonFiles = fs.readdirSync(path.join(tempDir, 'supabase'))
      .filter(file => file.endsWith('.json'));
    
    // Import each JSON file
    for (const jsonFile of jsonFiles) {
      const tableName = jsonFile.split('_')[0];
      log(`Importing data for table: ${tableName}`);
      
      // Use the mail-ingest-service to import the data
      // This assumes you have an import endpoint in your service
      execSync(`curl -X POST http://localhost:8001/import/${tableName} -H "Content-Type: application/json" -d @${path.join(tempDir, 'supabase', jsonFile)}`);
    }
    
    // Clean up
    execSync(`rm -rf ${tempDir}`);
    
    log(`Supabase data restore completed successfully.`);
    return true;
  } catch (err) {
    log(`ERROR: Failed to restore Supabase data: ${err.message}`);
    return false;
  }
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function main() {
  log('MarkoTronix Backup Restore Tool');
  log('==============================');
  
  // List available backups
  const backupDirs = listBackups();
  if (backupDirs.length === 0) {
    rl.close();
    return;
  }
  
  // Prompt for backup selection
  rl.question('Enter the number of the backup to restore: ', (answer) => {
    const backupIndex = parseInt(answer) - 1;
    if (isNaN(backupIndex) || backupIndex < 0 || backupIndex >= backupDirs.length) {
      log('Invalid selection. Exiting.');
      rl.close();
      return;
    }
    
    const selectedBackupDir = backupDirs[backupIndex];
    log(`Selected backup: ${selectedBackupDir}`);
    
    // List backup files
    const backupFiles = listBackupFiles(selectedBackupDir);
    if (backupFiles.length === 0) {
      rl.close();
      return;
    }
    
    // Prompt for file selection
    rl.question('Enter the number of the backup file to restore: ', (answer) => {
      const fileIndex = parseInt(answer) - 1;
      if (isNaN(fileIndex) || fileIndex < 0 || fileIndex >= backupFiles.length) {
        log('Invalid selection. Exiting.');
        rl.close();
        return;
      }
      
      const selectedFile = backupFiles[fileIndex];
      log(`Selected file: ${selectedFile}`);
      
      // Determine the type of backup
      if (selectedFile.includes('postgres') && selectedFile.endsWith('.sql.gz')) {
        // Database backup
        rl.question('This will overwrite the current database. Are you sure? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            restoreDatabase(selectedBackupDir, selectedFile);
          } else {
            log('Database restore cancelled.');
          }
          rl.close();
        });
      } else if (selectedFile.includes('supabase') && selectedFile.endsWith('.tar.gz')) {
        // Supabase backup
        rl.question('This will overwrite Supabase data. Are you sure? (y/n): ', (answer) => {
          if (answer.toLowerCase() === 'y') {
            restoreSupabase(selectedBackupDir, selectedFile);
          } else {
            log('Supabase restore cancelled.');
          }
          rl.close();
        });
      } else if (selectedFile.endsWith('.tar.gz')) {
        // Volume backup
        const volumeName = selectedFile.split('_')[0];
        rl.question(`This will overwrite the ${volumeName} volume. Are you sure? (y/n): `, (answer) => {
          if (answer.toLowerCase() === 'y') {
            restoreVolume(selectedBackupDir, selectedFile, volumeName);
          } else {
            log('Volume restore cancelled.');
          }
          rl.close();
        });
      } else {
        log('Unknown backup file type. Cannot restore.');
        rl.close();
      }
    });
  });
}

// Run the main function
main().catch(err => {
  log(`ERROR: ${err.message}`);
  rl.close();
});
