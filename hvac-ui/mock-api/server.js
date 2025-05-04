const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const WebSocket = require('ws');

// Create Express app
const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to HVAC CRM WebSocket server',
    timestamp: new Date().toISOString()
  }));

  // Handle messages
  ws.on('message', (message) => {
    console.log('Received message:', message);

    // Echo the message back
    ws.send(JSON.stringify({
      type: 'echo',
      message: message.toString(),
      timestamp: new Date().toISOString()
    }));
  });

  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Container test endpoint
app.get('/api/container-test', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Container is working properly',
    container: 'api',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/customers', (req, res) => {
  res.json([
    { id: '1', name: 'Jan Kowalski', email: 'jan.kowalski@example.com', phone: '+48 123 456 789' },
    { id: '2', name: 'Anna Nowak', email: 'anna.nowak@example.com', phone: '+48 987 654 321' },
    { id: '3', name: 'Piotr Wiśniewski', email: 'piotr.wisniewski@example.com', phone: '+48 111 222 333' }
  ]);
});

app.get('/api/customers/:id', (req, res) => {
  const customerId = req.params.id;
  res.json({
    id: customerId,
    name: 'Jan Kowalski',
    email: 'jan.kowalski@example.com',
    phone: '+48 123 456 789',
    address: 'ul. Przykładowa 123, 00-001 Warszawa',
    notes: 'Klient preferuje kontakt telefoniczny w godzinach 9-17.'
  });
});

app.get('/api/service-orders', (req, res) => {
  res.json([
    { id: '1', customerId: '1', status: 'pending', date: '2025-05-10', problem: 'Klimatyzacja nie chłodzi' },
    { id: '2', customerId: '2', status: 'completed', date: '2025-05-02', problem: 'Wymiana filtrów' },
    { id: '3', customerId: '3', status: 'in-progress', date: '2025-05-05', problem: 'Hałas z jednostki zewnętrznej' }
  ]);
});

app.get('/api/service-orders/:id', (req, res) => {
  const orderId = req.params.id;
  res.json({
    id: orderId,
    customerId: '1',
    status: 'pending',
    date: '2025-05-10',
    time: '10:00-12:00',
    problem: 'Klimatyzacja nie chłodzi',
    notes: 'Klient zgłasza, że jednostka wewnętrzna działa, ale powietrze nie jest schładzane.',
    technicianId: '1',
    technician: {
      id: '1',
      name: 'Adam Serwisant',
      phone: '+48 555 123 456'
    },
    customer: {
      id: '1',
      name: 'Jan Kowalski',
      email: 'jan.kowalski@example.com',
      phone: '+48 123 456 789',
      address: 'ul. Przykładowa 123, 00-001 Warszawa'
    }
  });
});

app.get('/api/warranties', (req, res) => {
  res.json([
    { id: '1', customerId: '1', productId: '1', purchaseDate: '2024-01-15', warrantyPeriod: 24, extendedWarranty: false },
    { id: '2', customerId: '2', productId: '2', purchaseDate: '2024-03-20', warrantyPeriod: 36, extendedWarranty: true },
    { id: '3', customerId: '3', productId: '3', purchaseDate: '2024-02-10', warrantyPeriod: 24, extendedWarranty: false }
  ]);
});

app.get('/api/products', (req, res) => {
  res.json([
    { id: '1', name: 'Klimatyzator ścienny', model: 'AC-100', manufacturer: 'CoolAir', price: 2500 },
    { id: '2', name: 'Klimatyzator kasetonowy', model: 'AC-200', manufacturer: 'CoolAir', price: 3500 },
    { id: '3', name: 'Klimatyzator kanałowy', model: 'AC-300', manufacturer: 'CoolAir', price: 4500 }
  ]);
});

// n8n webhook endpoint
app.post('/api/n8n/webhook', (req, res) => {
  console.log('Received webhook from n8n:', req.body);
  res.status(200).json({
    success: true,
    message: 'Webhook received',
    timestamp: new Date().toISOString()
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
  console.log(`WebSocket server running at ws://localhost:${port}`);
});