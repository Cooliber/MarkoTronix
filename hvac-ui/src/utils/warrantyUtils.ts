/**
 * Warranty utility functions for the HVAC CRM system
 */

export interface Warranty {
  id: string;
  clientName: string;
  equipmentType: string;
  model: string;
  serialNumber: string;
  installationDate: string;
  expiryDate: string;
  status: string;
  notes?: string;
}

/**
 * Filter warranties by their status (active or expired)
 * @param warranties Array of warranty objects
 * @param status Status to filter by ('active' or 'expired')
 * @returns Filtered array of warranties
 * @throws Error if the warranties array or status is invalid
 */
export const filterWarrantiesByStatus = (warranties: Warranty[], status: string): Warranty[] => {
  if (!Array.isArray(warranties)) {
    throw new Error('Nieprawidłowa lista gwarancji');
  }

  if (!status || (status !== 'active' && status !== 'expired')) {
    throw new Error('Nieprawidłowy status gwarancji. Dozwolone wartości: "active" lub "expired"');
  }

  return warranties.filter(warranty => warranty.status === status);
};

/**
 * Filter warranties by client name (case insensitive, partial match)
 * @param warranties Array of warranty objects
 * @param clientName Client name to search for
 * @returns Filtered array of warranties
 * @throws Error if the warranties array or client name is invalid
 */
export const filterWarrantiesByClient = (warranties: Warranty[], clientName: string): Warranty[] => {
  if (!Array.isArray(warranties)) {
    throw new Error('Nieprawidłowa lista gwarancji');
  }

  if (clientName === undefined || clientName === null) {
    throw new Error('Nazwa klienta jest wymagana');
  }

  // Convert clientName to string in case it's not already
  const searchTerm = String(clientName).toLowerCase();

  return warranties.filter(warranty => {
    // Safely handle missing or invalid clientName
    if (!warranty || !warranty.clientName) return false;

    try {
      return warranty.clientName.toLowerCase().includes(searchTerm);
    } catch (error) {
      // If there's an error (e.g., clientName is not a string), skip this warranty
      return false;
    }
  });
};

/**
 * Generate a new warranty ID based on the existing warranties
 * @param warranties Array of existing warranty objects
 * @returns New warranty ID in the format 'W001', 'W002', etc.
 * @throws Error if the warranties array is invalid
 */
export const generateWarrantyId = (warranties: Warranty[]): string => {
  if (!Array.isArray(warranties)) {
    throw new Error('Nieprawidłowa lista gwarancji');
  }

  try {
    // Find the highest ID number
    let maxId = 0;

    for (const warranty of warranties) {
      if (!warranty.id || typeof warranty.id !== 'string' || !warranty.id.startsWith('W')) {
        continue; // Skip invalid IDs
      }

      const idNumber = parseInt(warranty.id.substring(1));
      if (!isNaN(idNumber) && idNumber > maxId) {
        maxId = idNumber;
      }
    }

    return `W${(maxId + 1).toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating warranty ID:', error);
    // Fallback to a timestamp-based ID if something goes wrong
    const timestamp = new Date().getTime();
    return `W${timestamp.toString().slice(-6)}`;
  }
};

/**
 * Calculate warranty status based on expiry date
 * @param expiryDate Warranty expiry date in YYYY-MM-DD format
 * @returns 'active' if warranty is still valid, 'expired' if not
 * @throws Error if the date format is invalid
 */
export const calculateWarrantyStatus = (expiryDate: string): string => {
  if (!expiryDate || typeof expiryDate !== 'string') {
    throw new Error('Data wygaśnięcia gwarancji jest wymagana');
  }

  const today = new Date();
  const expiry = new Date(expiryDate);

  if (isNaN(expiry.getTime())) {
    throw new Error('Nieprawidłowy format daty wygaśnięcia gwarancji');
  }

  return expiry > today ? 'active' : 'expired';
};

/**
 * Filter warranties by equipment type
 * @param warranties Array of warranty objects
 * @param equipmentType Equipment type to filter by
 * @returns Filtered array of warranties
 * @throws Error if the warranties array or equipment type is invalid
 */
export const filterWarrantiesByEquipmentType = (warranties: Warranty[], equipmentType: string): Warranty[] => {
  if (!Array.isArray(warranties)) {
    throw new Error('Nieprawidłowa lista gwarancji');
  }

  if (equipmentType === undefined || equipmentType === null) {
    throw new Error('Typ urządzenia jest wymagany');
  }

  // Convert equipmentType to string in case it's not already
  const searchTerm = String(equipmentType).toLowerCase();

  return warranties.filter(warranty => {
    // Safely handle missing or invalid equipmentType
    if (!warranty || !warranty.equipmentType) return false;

    try {
      return warranty.equipmentType.toLowerCase().includes(searchTerm);
    } catch (error) {
      // If there's an error, skip this warranty
      return false;
    }
  });
};

/**
 * Sort warranties by a specific field
 * @param warranties Array of warranty objects
 * @param field Field to sort by
 * @param ascending Sort order (true for ascending, false for descending)
 * @returns Sorted array of warranties
 * @throws Error if the warranties array or field is invalid
 */
export const sortWarranties = (
  warranties: Warranty[],
  field: keyof Warranty,
  ascending: boolean = true
): Warranty[] => {
  if (!Array.isArray(warranties)) {
    throw new Error('Nieprawidłowa lista gwarancji');
  }

  if (!field || typeof field !== 'string') {
    throw new Error('Pole sortowania jest wymagane');
  }

  // Create a safe copy of the array
  const warrantiesCopy = [...warranties];

  try {
    return warrantiesCopy.sort((a, b) => {
      // Handle missing or undefined values
      const valueA = a[field] ?? '';
      const valueB = b[field] ?? '';

      if (valueA < valueB) return ascending ? -1 : 1;
      if (valueA > valueB) return ascending ? 1 : -1;
      return 0;
    });
  } catch (error) {
    console.error('Error sorting warranties:', error);
    // Return unsorted array as fallback
    return warrantiesCopy;
  }
};

/**
 * Calculate days remaining until warranty expiry
 * @param expiryDate Warranty expiry date in YYYY-MM-DD format
 * @returns Number of days remaining (negative if expired)
 * @throws Error if the date format is invalid
 */
export const calculateDaysRemaining = (expiryDate: string): number => {
  if (!expiryDate || typeof expiryDate !== 'string') {
    throw new Error('Data wygaśnięcia gwarancji jest wymagana');
  }

  const today = new Date();
  const expiry = new Date(expiryDate);

  if (isNaN(expiry.getTime())) {
    throw new Error('Nieprawidłowy format daty wygaśnięcia gwarancji');
  }

  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if a warranty is expiring soon (within the specified days)
 * @param expiryDate Warranty expiry date in YYYY-MM-DD format
 * @param daysThreshold Number of days to consider as "expiring soon"
 * @returns Boolean indicating if warranty is expiring soon
 * @throws Error if the date format is invalid or threshold is negative
 */
export const isExpiringSoon = (expiryDate: string, daysThreshold: number = 30): boolean => {
  if (daysThreshold < 0) {
    throw new Error('Próg dni musi być liczbą dodatnią');
  }

  try {
    const daysRemaining = calculateDaysRemaining(expiryDate);
    return daysRemaining > 0 && daysRemaining <= daysThreshold;
  } catch (error) {
    // Re-throw the error from calculateDaysRemaining
    throw error;
  }
};