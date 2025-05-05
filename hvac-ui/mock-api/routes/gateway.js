const express = require('express');
const router = express.Router();

// Mail Ingest Service Routes
router.get('/mail/emails', (req, res) => {
  const emails = [
    {
      id: 1,
      from_email: 'client@example.com',
      from_name: 'John Doe',
      subject: 'Request for HVAC installation',
      body: 'I would like to request a quote for installing a new HVAC system in my home.',
      received_date: '2025-05-01T10:30:00Z',
      processed: true,
      attachments: []
    },
    {
      id: 2,
      from_email: 'another.client@example.com',
      from_name: 'Jane Smith',
      subject: 'AC repair needed',
      body: 'My air conditioner is not working properly. Can you send someone to check it?',
      received_date: '2025-05-02T14:15:00Z',
      processed: false,
      attachments: []
    },
    {
      id: 3,
      from_email: 'business@example.com',
      from_name: 'Business Corp',
      subject: 'Commercial HVAC maintenance',
      body: 'We need to schedule regular maintenance for our office building HVAC system.',
      received_date: '2025-05-03T09:45:00Z',
      processed: true,
      attachments: []
    }
  ];
  
  res.json(emails);
});

router.get('/mail/emails/:id', (req, res) => {
  const emailId = parseInt(req.params.id);
  
  const email = {
    id: emailId,
    from_email: 'client@example.com',
    from_name: 'John Doe',
    subject: 'Request for HVAC installation',
    body: 'I would like to request a quote for installing a new HVAC system in my home. The property is approximately 2000 sq ft with two floors. Please let me know what options are available and the estimated cost.',
    html_body: '<p>I would like to request a quote for installing a new HVAC system in my home. The property is approximately 2000 sq ft with two floors. Please let me know what options are available and the estimated cost.</p>',
    received_date: '2025-05-01T10:30:00Z',
    processed: true,
    attachments: []
  };
  
  res.json(email);
});

router.get('/mail/emails/:id/attachments', (req, res) => {
  const emailId = parseInt(req.params.id);
  
  const attachments = [
    {
      id: 1,
      email_id: emailId,
      filename: 'house_plan.pdf',
      content_type: 'application/pdf',
      size: 1024000,
      url: '/attachments/house_plan.pdf'
    }
  ];
  
  res.json(attachments);
});

router.post('/mail/manual/fetch', (req, res) => {
  res.json({
    success: true,
    message: 'Email fetch triggered successfully',
    timestamp: new Date().toISOString()
  });
});

router.post('/mail/emails/:id/reprocess', (req, res) => {
  const emailId = parseInt(req.params.id);
  
  res.json({
    success: true,
    message: `Email ${emailId} reprocessing triggered successfully`,
    timestamp: new Date().toISOString()
  });
});

// Offer Generation Service Routes
router.get('/offers', (req, res) => {
  const offers = [
    {
      id: 1,
      client_name: 'John Doe',
      client_email: 'client@example.com',
      client_phone: '+48 123 456 789',
      service_type: 'HVAC Installation',
      description: 'New HVAC system installation for a 2000 sq ft home',
      price: 12000,
      currency: 'PLN',
      valid_until: '2025-06-01T23:59:59Z',
      status: 'draft',
      created_at: '2025-05-01T12:00:00Z',
      updated_at: '2025-05-01T12:00:00Z'
    },
    {
      id: 2,
      client_name: 'Jane Smith',
      client_email: 'another.client@example.com',
      client_phone: '+48 987 654 321',
      service_type: 'AC Repair',
      description: 'Repair of malfunctioning air conditioner',
      price: 500,
      currency: 'PLN',
      valid_until: '2025-05-15T23:59:59Z',
      status: 'sent',
      created_at: '2025-05-02T15:00:00Z',
      updated_at: '2025-05-02T15:30:00Z'
    },
    {
      id: 3,
      client_name: 'Business Corp',
      client_email: 'business@example.com',
      client_phone: '+48 111 222 333',
      service_type: 'Commercial HVAC Maintenance',
      description: 'Annual maintenance contract for office building HVAC system',
      price: 5000,
      currency: 'PLN',
      valid_until: '2025-06-30T23:59:59Z',
      status: 'accepted',
      created_at: '2025-05-03T10:00:00Z',
      updated_at: '2025-05-04T09:00:00Z'
    }
  ];
  
  res.json(offers);
});

router.get('/offers/:id', (req, res) => {
  const offerId = parseInt(req.params.id);
  
  const offer = {
    id: offerId,
    client_name: 'John Doe',
    client_email: 'client@example.com',
    client_phone: '+48 123 456 789',
    client_address: 'ul. Przykładowa 123, 00-001 Warszawa',
    service_type: 'HVAC Installation',
    description: 'New HVAC system installation for a 2000 sq ft home',
    price: 12000,
    currency: 'PLN',
    valid_days: 30,
    valid_until: '2025-06-01T23:59:59Z',
    pdf_path: '/storage/offers/offer_1.pdf',
    status: 'draft',
    created_at: '2025-05-01T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z'
  };
  
  res.json(offer);
});

router.post('/offers/generate', (req, res) => {
  const { email_id } = req.body;
  
  const offer = {
    id: 4,
    email_id: email_id,
    client_name: 'John Doe',
    client_email: 'client@example.com',
    client_phone: '+48 123 456 789',
    service_type: 'HVAC Installation',
    description: 'New HVAC system installation for a 2000 sq ft home',
    price: 12000,
    currency: 'PLN',
    valid_days: 30,
    valid_until: '2025-06-01T23:59:59Z',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.json(offer);
});

router.get('/offers/:id/pdf', (req, res) => {
  const offerId = parseInt(req.params.id);
  
  // In a real implementation, this would send the PDF file
  // For mock purposes, we'll just send a message
  res.send(`This is a mock PDF for offer ${offerId}`);
});

// Link Service Routes
router.get('/links/offers/:id/link', (req, res) => {
  const offerId = parseInt(req.params.id);
  
  res.json({
    offer_id: offerId,
    link: `https://hvac-crm.example.com/offers/${offerId}/view`,
    expires_at: '2025-06-01T23:59:59Z',
    created_at: new Date().toISOString()
  });
});

router.post('/links/offers/:id/signature', (req, res) => {
  const offerId = parseInt(req.params.id);
  
  res.json({
    signature_id: 'sig_123456789',
    offer_id: offerId,
    status: 'pending',
    signature_url: `https://hvac-crm.example.com/offers/${offerId}/sign`,
    expires_at: '2025-05-15T23:59:59Z',
    created_at: new Date().toISOString()
  });
});

router.get('/links/signature/:id/status', (req, res) => {
  const signatureId = req.params.id;
  
  res.json({
    signature_id: signatureId,
    status: 'pending',
    updated_at: new Date().toISOString()
  });
});

module.exports = router;