import fs from 'fs';
import path from 'path';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    totalRows: number;
    nonCAStores: number;
    unknownCarriers: string[];
  };
}

const REQUIRED_COLUMNS = [
  'Carrier',
  'Date',
  'Store Id', // Note: lowercase 'd' in Id
  'Walmart Trip Id',
  'Courier Name',
  'Total Orders',
  'Delivered Orders',
];

const KNOWN_CARRIERS = ['FOX', 'NTG', 'FDC'];

// Load CA stores from CSV file (273 stores)
let CA_STORES: number[] = [];
function loadCAStores(): number[] {
  if (CA_STORES.length > 0) return CA_STORES;

  try {
    const caStoresPath = path.join(__dirname, '../../States/walmart_stores_ca_only.csv');
    const content = fs.readFileSync(caStoresPath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    CA_STORES = lines
      .filter(line => line.trim())
      .map(line => {
        const storeId = line.split(',')[0];
        return parseInt(storeId, 10);
      })
      .filter(id => !isNaN(id));

    console.log(`Loaded ${CA_STORES.length} CA stores from walmart_stores_ca_only.csv`);
    return CA_STORES;
  } catch (error) {
    console.error('Error loading CA stores, using defaults:', error);
    CA_STORES = [2082, 2242, 5930]; // Fallback to original 3
    return CA_STORES;
  }
}

export class NashValidator {
  /**
   * Validates Nash CSV file format and data
   */
  static async validate(filePath: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalRows = 0;
    let nonCAStores = 0;
    const unknownCarriers = new Set<string>();

    // Load CA stores list
    const caStores = loadCAStores();

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        errors.push('File does not exist');
        return { valid: false, errors, warnings };
      }

      // Read file
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        errors.push('File is empty');
        return { valid: false, errors, warnings };
      }

      // Parse header
      const header = lines[0].split(',').map(col => col.trim());

      // Check for required columns
      const missingColumns = REQUIRED_COLUMNS.filter(
        required => !header.includes(required)
      );

      if (missingColumns.length > 0) {
        errors.push(
          `Missing required columns: ${missingColumns.join(', ')}\n` +
          `Found columns: ${header.join(', ')}\n` +
          `\nDiagnosis: Column names must match exactly (case-sensitive). ` +
          `Common issue: "Store ID" vs "Store Id" (lowercase 'd')`
        );
      }

      // Check for wrong column names (common mistakes)
      if (header.includes('Store ID') && !header.includes('Store Id')) {
        errors.push(
          `Column "Store ID" found but should be "Store Id" (lowercase 'd')`
        );
      }

      // If critical errors, return early
      if (errors.length > 0) {
        return { valid: false, errors, warnings };
      }

      // Get column indices
      const storeIdIndex = header.indexOf('Store Id');
      const dateIndex = header.indexOf('Date');
      const carrierIndex = header.indexOf('Carrier');

      // Validate data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        totalRows++;
        const columns = line.split(',').map(col => col.trim());

        // Validate Store Id (must be numeric)
        const storeId = columns[storeIdIndex];
        if (storeId && !/^\d+$/.test(storeId)) {
          errors.push(`Row ${i + 1}: Store Id must be numeric, got "${storeId}"`);
        } else if (storeId) {
          const storeNum = parseInt(storeId);
          if (!caStores.includes(storeNum)) {
            nonCAStores++;
          }
        }

        // Validate Date format
        const date = columns[dateIndex];
        if (date && !this.isValidDate(date)) {
          errors.push(
            `Row ${i + 1}: Invalid date format "${date}". ` +
            `Expected format: MM/DD/YYYY`
          );
        }

        // Check for unknown carriers
        const carrier = columns[carrierIndex];
        if (carrier && !KNOWN_CARRIERS.includes(carrier)) {
          unknownCarriers.add(carrier);
        }
      }

      // Add warnings
      if (nonCAStores > 0) {
        warnings.push(
          `Found ${nonCAStores} non-CA stores (will be excluded from analysis). ` +
          `CA stores: ${CA_STORES.join(', ')}`
        );
      }

      if (unknownCarriers.size > 0) {
        warnings.push(
          `Unknown carriers found: ${Array.from(unknownCarriers).join(', ')}. ` +
          `Known carriers: ${KNOWN_CARRIERS.join(', ')}`
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        stats: {
          totalRows,
          nonCAStores,
          unknownCarriers: Array.from(unknownCarriers),
        },
      };
    } catch (error) {
      errors.push(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validates date format (MM/DD/YYYY or YYYY-MM-DD)
   */
  private static isValidDate(dateString: string): boolean {
    // Try parsing as MM/DD/YYYY
    const datePattern1 = /^\d{2}\/\d{2}\/\d{4}$/;
    // Try parsing as YYYY-MM-DD
    const datePattern2 = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern1.test(dateString) && !datePattern2.test(dateString)) {
      return false;
    }

    // Try to parse the date
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}
