import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Path to the settings file
const SETTINGS_FILE = path.join(process.cwd(), 'settings.json');

// Default configuration
const defaultConfig = {
  api: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8000/ws',
  },
  mail: {
    mailServer: '',
    mailPort: '993',
    mailUsername: '',
    mailPassword: '',
    mailUseTls: true,
    mailCheckInterval: '60',
  },
  offer: {
    openaiApiKey: '',
    defaultLlmModel: 'gpt-3.5-turbo',
  },
  link: {
    secretKey: '',
    docusignClientId: '',
    docusignUserId: '',
    docusignAccountId: '',
    hellosignApiKey: '',
  },
  database: {
    databaseUrl: 'postgresql://postgres:postgres@postgres:5432/hvac_crm',
    redisUrl: 'redis://redis:6379/0',
  },
  supabase: {
    supabaseUrl: '',
    supabaseKey: '',
  },
};

// Helper function to load settings
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return defaultConfig;
}

// Helper function to save settings
function saveSettings(settings) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Helper function to update environment files
async function updateEnvironmentFiles(settings) {
  try {
    // Update mail-ingest-service .env file
    const mailEnvContent = `# Database Configuration
DATABASE_URL=${settings.database.databaseUrl}

# Redis Configuration
REDIS_URL=${settings.database.redisUrl}

# Mail Server Configuration
MAIL_SERVER=${settings.mail.mailServer}
MAIL_PORT=${settings.mail.mailPort}
MAIL_USERNAME=${settings.mail.mailUsername}
MAIL_PASSWORD=${settings.mail.mailPassword}
MAIL_USE_TLS=${settings.mail.mailUseTls}
MAIL_CHECK_INTERVAL=${settings.mail.mailCheckInterval}

# Supabase Configuration
SUPABASE_URL=${settings.supabase.supabaseUrl}
SUPABASE_KEY=${settings.supabase.supabaseKey}
`;
    fs.writeFileSync(path.join(process.cwd(), '..', 'mail-ingest-service', '.env'), mailEnvContent, 'utf8');

    // Update offer-generation .env file
    const offerEnvContent = `# Database Configuration
DATABASE_URL=${settings.database.databaseUrl}

# Redis Configuration
REDIS_URL=${settings.database.redisUrl}

# OpenAI Configuration
OPENAI_API_KEY=${settings.offer.openaiApiKey}

# Storage Configuration
STORAGE_DIR=/app/storage

# Supabase Configuration
SUPABASE_URL=${settings.supabase.supabaseUrl}
SUPABASE_KEY=${settings.supabase.supabaseKey}
`;
    fs.writeFileSync(path.join(process.cwd(), '..', 'offer-generation', '.env'), offerEnvContent, 'utf8');

    // Update link-service .env file
    const linkEnvContent = `# Database Configuration
DATABASE_URL=${settings.database.databaseUrl}

# Redis Configuration
REDIS_URL=${settings.database.redisUrl}

# JWT Configuration
SECRET_KEY=${settings.link.secretKey}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# DocuSign Configuration
DOCUSIGN_INTEGRATION_KEY=${settings.link.docusignClientId}
DOCUSIGN_USER_ID=${settings.link.docusignUserId}
DOCUSIGN_ACCOUNT_ID=${settings.link.docusignAccountId}
DOCUSIGN_PRIVATE_KEY_PATH=/app/keys/docusign_private.key

# HelloSign Configuration
HELLOSIGN_API_KEY=${settings.link.hellosignApiKey}

# Supabase Configuration
SUPABASE_URL=${settings.supabase.supabaseUrl}
SUPABASE_KEY=${settings.supabase.supabaseKey}
`;
    fs.writeFileSync(path.join(process.cwd(), '..', 'link-service', '.env'), linkEnvContent, 'utf8');

    return true;
  } catch (error) {
    console.error('Error updating environment files:', error);
    return false;
  }
}

export default async function handler(req, res) {
  // Handle GET request to retrieve settings
  if (req.method === 'GET') {
    const settings = loadSettings();
    return res.status(200).json(settings);
  }
  
  // Handle POST request to save settings
  if (req.method === 'POST') {
    try {
      const settings = req.body;
      
      // Save settings to file
      const saved = saveSettings(settings);
      if (!saved) {
        return res.status(500).json({ error: 'Failed to save settings' });
      }
      
      // Update environment files
      const updated = await updateEnvironmentFiles(settings);
      if (!updated) {
        return res.status(500).json({ error: 'Failed to update environment files' });
      }
      
      return res.status(200).json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error handling settings update:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({ error: 'Method not allowed' });
}
