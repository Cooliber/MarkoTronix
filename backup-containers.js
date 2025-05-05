const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Configuration
const config = {
  backupDir: path.join(__dirname, 'backups'),
  databaseBackups: [
    {
      containerName: 'markotronix-postgres-1',
      database: 'hvac_crm',
      user: 'postgres',
      filename: 'postgres_hvac_crm'
    }
  ],
  volumeBackups: [
    {
      name: 'mail-attachments',
      filename: 'mail-attachments'
    },
    {
      name: 'offer-storage',
      filename: 'offer-storage'
    },
    {
      name: 'link-storage',
      filename: 'link-storage'
    },
    {
      name: 'postgres-data',
      filename: 'postgres-data'
    },
    {
      name: 'redis-data',
      filename: 'redis-data'
    }
  ],
  retention: {
    days: 7,  // Keep backups for 7 days
    weekly: 4, // Keep 4 weekly backups
    monthly: 3 // Keep 3 monthly backups
  },
  supabaseBackup: {
    enabled: true,
    tables: ['emails', 'attachments', 'clients', 'offers', 'links']
  }
};

// Create backup directory if it doesn't exist
if (!fs.existsSync(config.backupDir)) {
  fs.mkdirSync(config.backupDir, { recursive: true });
}

// Create date-based directory structure
const now = moment();
const dateStr = now.format('YYYY-MM-DD');
const timeStr = now.format('HH-mm-ss');
const backupPath = path.join(config.backupDir, dateStr);

if (!fs.existsSync(backupPath)) {
  fs.mkdirSync(backupPath, { recursive: true });
}

// Function to log messages
function log(message) {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  
  // Append to log file
  fs.appendFileSync(path.join(config.backupDir, 'backup.log'), logMessage + '\n');
}

// Function to backup PostgreSQL database
function backupDatabase(dbConfig) {
  try {
    log(`Starting backup of database ${dbConfig.database} from container ${dbConfig.containerName}...`);
    
    const backupFilename = `${dbConfig.filename}_${dateStr}_${timeStr}.sql`;
    const backupFilePath = path.join(backupPath, backupFilename);
    
    // Execute pg_dump command
    execSync(`docker exec ${dbConfig.containerName} pg_dump -U ${dbConfig.user} ${dbConfig.database} > ${backupFilePath}`);
    
    // Compress the backup
    execSync(`gzip ${backupFilePath}`);
    
    log(`Database backup completed: ${backupFilename}.gz`);
    return `${backupFilePath}.gz`;
  } catch (err) {
    log(`ERROR: Failed to backup database ${dbConfig.database}: ${err.message}`);
    return null;
  }
}

// Function to backup Docker volume
function backupVolume(volumeConfig) {
  try {
    log(`Starting backup of volume ${volumeConfig.name}...`);
    
    const backupFilename = `${volumeConfig.filename}_${dateStr}_${timeStr}.tar.gz`;
    const backupFilePath = path.join(backupPath, backupFilename);
    
    // Execute volume backup command
    execSync(`docker run --rm -v markotronix_${volumeConfig.name}:/source -v ${backupPath}:/backup alpine tar -czf /backup/${backupFilename} -C /source .`);
    
    log(`Volume backup completed: ${backupFilename}`);
    return backupFilePath;
  } catch (err) {
    log(`ERROR: Failed to backup volume ${volumeConfig.name}: ${err.message}`);
    return null;
  }
}

// Function to backup Supabase data using the API
function backupSupabase() {
  if (!config.supabaseBackup.enabled) {
    return;
  }
  
  try {
    log('Starting Supabase data backup...');
    
    // Create directory for Supabase backups
    const supabasePath = path.join(backupPath, 'supabase');
    if (!fs.existsSync(supabasePath)) {
      fs.mkdirSync(supabasePath, { recursive: true });
    }
    
    // For each table, export data using the API service
    for (const table of config.supabaseBackup.tables) {
      log(`Backing up Supabase table: ${table}`);
      
      // Use the mail-ingest-service to export the data
      // This assumes you have an export endpoint in your service
      execSync(`curl -X GET http://localhost:8001/export/${table} -o ${path.join(supabasePath, `${table}_${dateStr}_${timeStr}.json`)}`);
      
      log(`Supabase table backup completed: ${table}`);
    }
    
    // Compress the Supabase backup directory
    execSync(`tar -czf ${path.join(backupPath, `supabase_${dateStr}_${timeStr}.tar.gz`)} -C ${backupPath} supabase`);
    
    // Remove the uncompressed directory
    execSync(`rm -rf ${supabasePath}`);
    
    log('Supabase data backup completed');
  } catch (err) {
    log(`ERROR: Failed to backup Supabase data: ${err.message}`);
  }
}

// Function to clean up old backups
function cleanupOldBackups() {
  try {
    log('Starting cleanup of old backups...');
    
    // Get all backup directories
    const backupDirs = fs.readdirSync(config.backupDir)
      .filter(file => {
        const fullPath = path.join(config.backupDir, file);
        return fs.statSync(fullPath).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(file);
      })
      .sort();
    
    // Keep recent daily backups
    const dailyCutoff = moment().subtract(config.retention.days, 'days');
    
    // Keep weekly backups (Sunday)
    const weeklyBackups = [];
    let weekCounter = 0;
    
    // Keep monthly backups (1st of month)
    const monthlyBackups = [];
    let monthCounter = 0;
    
    // Determine which backups to keep
    const backupsToKeep = new Set();
    
    backupDirs.forEach(dir => {
      const backupDate = moment(dir, 'YYYY-MM-DD');
      
      // Keep recent backups
      if (backupDate.isAfter(dailyCutoff)) {
        backupsToKeep.add(dir);
        return;
      }
      
      // Keep weekly backups (Sundays)
      if (backupDate.day() === 0 && weekCounter < config.retention.weekly) {
        backupsToKeep.add(dir);
        weeklyBackups.push(dir);
        weekCounter++;
        return;
      }
      
      // Keep monthly backups (1st of month)
      if (backupDate.date() === 1 && monthCounter < config.retention.monthly) {
        backupsToKeep.add(dir);
        monthlyBackups.push(dir);
        monthCounter++;
        return;
      }
    });
    
    // Delete directories not in the keep set
    backupDirs.forEach(dir => {
      if (!backupsToKeep.has(dir)) {
        const dirPath = path.join(config.backupDir, dir);
        log(`Removing old backup: ${dir}`);
        execSync(`rm -rf ${dirPath}`);
      }
    });
    
    log('Cleanup of old backups completed');
  } catch (err) {
    log(`ERROR: Failed to clean up old backups: ${err.message}`);
  }
}

// Main backup function
async function runBackup() {
  log('Starting backup process...');
  
  // Backup databases
  for (const dbConfig of config.databaseBackups) {
    backupDatabase(dbConfig);
  }
  
  // Backup volumes
  for (const volumeConfig of config.volumeBackups) {
    backupVolume(volumeConfig);
  }
  
  // Backup Supabase data
  backupSupabase();
  
  // Clean up old backups
  cleanupOldBackups();
  
  log('Backup process completed successfully');
}

// Run the backup
runBackup().catch(err => {
  log(`ERROR: Backup process failed: ${err.message}`);
  process.exit(1);
});
