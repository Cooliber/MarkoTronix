// Simple test to verify Jest is working
describe('Basic Tests', () => {
  it('should pass a simple test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string operations', () => {
    expect('Warranty').toContain('War');
    expect('Warranty Card').toMatch(/Card$/);
  });
});

// Test the mock warranty data structure
describe('Warranty Data Structure', () => {
  // Define a sample warranty object that matches the structure in the component
  const sampleWarranty = {
    id: 'W001',
    clientName: 'Jan Kowalski',
    equipmentType: 'Split AC Unit',
    model: 'CoolBreeze X5',
    serialNumber: 'CB-X5-12345',
    installationDate: '2024-04-15',
    expiryDate: '2026-04-15',
    status: 'active',
  };

  it('should have the correct properties', () => {
    expect(sampleWarranty).toHaveProperty('id');
    expect(sampleWarranty).toHaveProperty('clientName');
    expect(sampleWarranty).toHaveProperty('equipmentType');
    expect(sampleWarranty).toHaveProperty('model');
    expect(sampleWarranty).toHaveProperty('serialNumber');
    expect(sampleWarranty).toHaveProperty('installationDate');
    expect(sampleWarranty).toHaveProperty('expiryDate');
    expect(sampleWarranty).toHaveProperty('status');
  });

  it('should have valid date formats', () => {
    // Test if the dates are in YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(sampleWarranty.installationDate).toMatch(dateRegex);
    expect(sampleWarranty.expiryDate).toMatch(dateRegex);
  });

  it('should have a valid status', () => {
    expect(['active', 'expired']).toContain(sampleWarranty.status);
  });
});