// Import the actual utility functions
import {
  Warranty,
  filterWarrantiesByStatus,
  filterWarrantiesByClient,
  generateWarrantyId,
  calculateWarrantyStatus,
  filterWarrantiesByEquipmentType,
  sortWarranties,
  calculateDaysRemaining,
  isExpiringSoon
} from '@/utils/warrantyUtils';

// Mock warranty data
const mockWarranties: Warranty[] = [
  {
    id: 'W001',
    clientName: 'Jan Kowalski',
    equipmentType: 'Split AC Unit',
    model: 'CoolBreeze X5',
    serialNumber: 'CB-X5-12345',
    installationDate: '2024-04-15',
    expiryDate: '2026-04-15',
    status: 'active',
  },
  {
    id: 'W002',
    clientName: 'Anna Nowak',
    equipmentType: 'Heat Pump',
    model: 'EcoHeat Pro',
    serialNumber: 'EH-P-67890',
    installationDate: '2024-03-10',
    expiryDate: '2029-03-10',
    status: 'active',
  },
  {
    id: 'W003',
    clientName: 'Piotr Wiśniewski',
    equipmentType: 'Central AC',
    model: 'AirMaster 3000',
    serialNumber: 'AM-3K-54321',
    installationDate: '2023-08-22',
    expiryDate: '2023-08-22', // Expired warranty
    status: 'expired',
  },
];

// Tests
describe('Warranty Utility Functions', () => {
  describe('filterWarrantiesByStatus', () => {
    it('should filter active warranties', () => {
      const activeWarranties = filterWarrantiesByStatus(mockWarranties, 'active');
      expect(activeWarranties.length).toBe(2);
      expect(activeWarranties[0].id).toBe('W001');
      expect(activeWarranties[1].id).toBe('W002');
    });

    it('should filter expired warranties', () => {
      const expiredWarranties = filterWarrantiesByStatus(mockWarranties, 'expired');
      expect(expiredWarranties.length).toBe(1);
      expect(expiredWarranties[0].id).toBe('W003');
    });

    it('should throw error for invalid status', () => {
      // @ts-ignore - Testing invalid input
      expect(() => filterWarrantiesByStatus(mockWarranties, 'invalid-status')).toThrow('Nieprawidłowy status gwarancji');
    });

    it('should throw error for empty status', () => {
      expect(() => filterWarrantiesByStatus(mockWarranties, '')).toThrow('Nieprawidłowy status gwarancji');
    });

    it('should throw error for invalid warranties array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => filterWarrantiesByStatus('not-an-array', 'active')).toThrow('Nieprawidłowa lista gwarancji');
    });
  });

  describe('filterWarrantiesByClient', () => {
    it('should filter warranties by exact client name', () => {
      const janWarranties = filterWarrantiesByClient(mockWarranties, 'Jan Kowalski');
      expect(janWarranties.length).toBe(1);
      expect(janWarranties[0].id).toBe('W001');
    });

    it('should filter warranties by partial client name', () => {
      const partialNameWarranties = filterWarrantiesByClient(mockWarranties, 'nowak');
      expect(partialNameWarranties.length).toBe(1);
      expect(partialNameWarranties[0].id).toBe('W002');
    });

    it('should be case insensitive', () => {
      const caseInsensitiveWarranties = filterWarrantiesByClient(mockWarranties, 'PIOTR');
      expect(caseInsensitiveWarranties.length).toBe(1);
      expect(caseInsensitiveWarranties[0].id).toBe('W003');
    });

    it('should throw error for invalid warranties array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => filterWarrantiesByClient('not-an-array', 'Jan')).toThrow('Nieprawidłowa lista gwarancji');
    });

    it('should throw error for null client name', () => {
      // @ts-ignore - Testing invalid input
      expect(() => filterWarrantiesByClient(mockWarranties, null)).toThrow('Nazwa klienta jest wymagana');
    });

    it('should handle warranties with missing client names', () => {
      const warrantiesWithMissingNames = [
        { ...mockWarranties[0], clientName: undefined },
        { ...mockWarranties[1] },
        { ...mockWarranties[2], clientName: null }
      ];

      // @ts-ignore - Testing invalid data
      const filtered = filterWarrantiesByClient(warrantiesWithMissingNames, 'nowak');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('W002');
    });
  });

  describe('generateWarrantyId', () => {
    it('should generate the next ID in sequence', () => {
      const nextId = generateWarrantyId(mockWarranties);
      expect(nextId).toBe('W004');
    });

    it('should handle empty warranty list', () => {
      const firstId = generateWarrantyId([]);
      expect(firstId).toBe('W001');
    });

    it('should handle warranties with invalid IDs', () => {
      const warrantiesWithInvalidIds = [
        { ...mockWarranties[0], id: 'invalid' },
        { ...mockWarranties[1], id: '' },
        { ...mockWarranties[2], id: 'X123' }
      ];

      const id = generateWarrantyId(warrantiesWithInvalidIds);
      expect(id).toBe('W001');
    });

    it('should find the highest ID and increment it', () => {
      const warrantiesWithMixedIds = [
        { ...mockWarranties[0], id: 'W005' },
        { ...mockWarranties[1], id: 'W002' },
        { ...mockWarranties[2], id: 'W010' }
      ];

      const id = generateWarrantyId(warrantiesWithMixedIds);
      expect(id).toBe('W011');
    });

    it('should throw error for invalid warranties array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => generateWarrantyId('not-an-array')).toThrow('Nieprawidłowa lista gwarancji');
    });
  });

  describe('calculateWarrantyStatus', () => {
    it('should return active for future dates', () => {
      // Set a future date (one year from now)
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const formattedDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const status = calculateWarrantyStatus(formattedDate);
      expect(status).toBe('active');
    });

    it('should return expired for past dates', () => {
      // Set a past date (one year ago)
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);
      const formattedDate = pastDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const status = calculateWarrantyStatus(formattedDate);
      expect(status).toBe('expired');
    });

    it('should throw error for empty date', () => {
      expect(() => calculateWarrantyStatus('')).toThrow('Data wygaśnięcia gwarancji jest wymagana');
    });

    it('should throw error for invalid date format', () => {
      expect(() => calculateWarrantyStatus('invalid-date')).toThrow('Nieprawidłowy format daty wygaśnięcia gwarancji');
    });
  });

  describe('filterWarrantiesByEquipmentType', () => {
    it('should filter warranties by equipment type', () => {
      const acWarranties = filterWarrantiesByEquipmentType(mockWarranties, 'AC');
      expect(acWarranties.length).toBe(2);
      expect(acWarranties[0].id).toBe('W001');
      expect(acWarranties[1].id).toBe('W003');
    });

    it('should be case insensitive', () => {
      const heatPumpWarranties = filterWarrantiesByEquipmentType(mockWarranties, 'heat');
      expect(heatPumpWarranties.length).toBe(1);
      expect(heatPumpWarranties[0].id).toBe('W002');
    });

    it('should throw error for invalid warranties array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => filterWarrantiesByEquipmentType('not-an-array', 'AC')).toThrow('Nieprawidłowa lista gwarancji');
    });

    it('should throw error for null equipment type', () => {
      // @ts-ignore - Testing invalid input
      expect(() => filterWarrantiesByEquipmentType(mockWarranties, null)).toThrow('Typ urządzenia jest wymagany');
    });

    it('should handle warranties with missing equipment types', () => {
      const warrantiesWithMissingTypes = [
        { ...mockWarranties[0], equipmentType: undefined },
        { ...mockWarranties[1] },
        { ...mockWarranties[2], equipmentType: null }
      ];

      // @ts-ignore - Testing invalid data
      const filtered = filterWarrantiesByEquipmentType(warrantiesWithMissingTypes, 'Heat');
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('W002');
    });
  });

  describe('sortWarranties', () => {
    it('should sort warranties by client name in ascending order', () => {
      const sortedWarranties = sortWarranties(mockWarranties, 'clientName');
      expect(sortedWarranties[0].clientName).toBe('Anna Nowak');
      expect(sortedWarranties[1].clientName).toBe('Jan Kowalski');
      expect(sortedWarranties[2].clientName).toBe('Piotr Wiśniewski');
    });

    it('should sort warranties by expiry date in descending order', () => {
      const sortedWarranties = sortWarranties(mockWarranties, 'expiryDate', false);
      expect(sortedWarranties[0].expiryDate).toBe('2029-03-10');
      expect(sortedWarranties[1].expiryDate).toBe('2026-04-15');
      expect(sortedWarranties[2].expiryDate).toBe('2023-08-22');
    });

    it('should throw error for invalid warranties array', () => {
      // @ts-ignore - Testing invalid input
      expect(() => sortWarranties('not-an-array', 'clientName')).toThrow('Nieprawidłowa lista gwarancji');
    });

    it('should throw error for invalid field', () => {
      // @ts-ignore - Testing invalid input
      expect(() => sortWarranties(mockWarranties, null)).toThrow('Pole sortowania jest wymagane');
    });

    it('should handle warranties with missing values', () => {
      const warrantiesWithMissingValues = [
        { ...mockWarranties[0], clientName: undefined },
        { ...mockWarranties[1] },
        { ...mockWarranties[2], clientName: null }
      ];

      // @ts-ignore - Testing invalid data
      const sorted = sortWarranties(warrantiesWithMissingValues, 'clientName');

      // Empty values should be sorted first
      expect(sorted[0].id).toBe('W001');
      expect(sorted[1].id).toBe('W003');
      expect(sorted[2].id).toBe('W002');
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should calculate positive days for future dates', () => {
      // Set a future date (30 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const formattedDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const daysRemaining = calculateDaysRemaining(formattedDate);
      expect(daysRemaining).toBeGreaterThanOrEqual(29); // Allow for time zone differences
      expect(daysRemaining).toBeLessThanOrEqual(31);
    });

    it('should calculate negative days for past dates', () => {
      // Set a past date (30 days ago)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const formattedDate = pastDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const daysRemaining = calculateDaysRemaining(formattedDate);
      expect(daysRemaining).toBeLessThanOrEqual(-29); // Allow for time zone differences
      expect(daysRemaining).toBeGreaterThanOrEqual(-31);
    });

    it('should throw error for empty date', () => {
      expect(() => calculateDaysRemaining('')).toThrow('Data wygaśnięcia gwarancji jest wymagana');
    });

    it('should throw error for invalid date format', () => {
      expect(() => calculateDaysRemaining('invalid-date')).toThrow('Nieprawidłowy format daty wygaśnięcia gwarancji');
    });

    it('should handle today\'s date correctly', () => {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

      const daysRemaining = calculateDaysRemaining(formattedDate);
      // Should be 0 or 1 depending on the time of day
      expect(daysRemaining).toBeGreaterThanOrEqual(0);
      expect(daysRemaining).toBeLessThanOrEqual(1);
    });
  });

  describe('isExpiringSoon', () => {
    it('should return true for warranties expiring within the threshold', () => {
      // Set a date 15 days from now
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15);
      const formattedDate = soonDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const expiringSoon = isExpiringSoon(formattedDate, 30);
      expect(expiringSoon).toBe(true);
    });

    it('should return false for warranties not expiring within the threshold', () => {
      // Set a date 60 days from now
      const laterDate = new Date();
      laterDate.setDate(laterDate.getDate() + 60);
      const formattedDate = laterDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const expiringSoon = isExpiringSoon(formattedDate, 30);
      expect(expiringSoon).toBe(false);
    });

    it('should return false for already expired warranties', () => {
      // Set a date 10 days ago
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 10);
      const formattedDate = expiredDate.toISOString().split('T')[0]; // YYYY-MM-DD

      const expiringSoon = isExpiringSoon(formattedDate, 30);
      expect(expiringSoon).toBe(false);
    });

    it('should throw error for negative threshold', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      const formattedDate = futureDate.toISOString().split('T')[0];

      expect(() => isExpiringSoon(formattedDate, -5)).toThrow('Próg dni musi być liczbą dodatnią');
    });

    it('should throw error for invalid date', () => {
      expect(() => isExpiringSoon('invalid-date', 30)).toThrow('Nieprawidłowy format daty wygaśnięcia gwarancji');
    });

    it('should use default threshold of 30 days when not specified', () => {
      // Set a date 20 days from now (within default 30 days threshold)
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 20);
      const formattedDate = soonDate.toISOString().split('T')[0];

      // Not specifying threshold should use default of 30
      const expiringSoon = isExpiringSoon(formattedDate);
      expect(expiringSoon).toBe(true);
    });
  });
});