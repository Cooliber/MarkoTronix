const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Path to the settings file
const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

// Default configuration
const defaultConfig = {
  api: {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18000/api',
    websocketUrl: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:18000/ws',
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
    databaseUrl: 'postgresql://postgres:postgres@postgres:15432/hvac_crm',
    redisUrl: 'redis://redis:16379/0',
  },
  supabase: {
    supabaseUrl: '',
    supabaseKey: '',
  },
};

// Helper function to load settings
function loadSettings() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
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
    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// GET /api/settings - Get current settings
router.get('/', (req, res) => {
  const settings = loadSettings();
  res.json(settings);
});

// POST /api/settings - Update settings
router.post('/', (req, res) => {
  try {
    const settings = req.body;
    
    // Save settings to file
    const saved = saveSettings(settings);
    if (!saved) {
      return res.status(500).json({ error: 'Failed to save settings' });
    }
    
    // In a real implementation, this would update environment files and restart services
    console.log('Settings updated:', settings);
    
    return res.status(200).json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error handling settings update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
