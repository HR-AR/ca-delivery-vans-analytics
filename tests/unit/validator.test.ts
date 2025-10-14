import { NashValidator } from '../../src/utils/nash-validator';
import path from 'path';
import fs from 'fs';

describe('Nash Data Validator', () => {
  const validCsvPath = path.join(__dirname, '../fixtures/valid-nash.csv');
  const invalidCsvPath = path.join(__dirname, '../fixtures/invalid-nash.csv');
  const tempDir = path.join(__dirname, '../fixtures/temp');

  beforeAll(() => {
    // Create temp directory for test files
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });

  describe('Column Validation', () => {
    it('should detect missing columns', async () => {
      // Create CSV with missing "Carrier" column
      const missingColPath = path.join(tempDir, 'missing-carrier.csv');
      const content = `Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
2025-10-08,2082,test-id,John Doe,100,95`;
      fs.writeFileSync(missingColPath, content);

      const result = await NashValidator.validate(missingColPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required columns');
      expect(result.errors[0]).toContain('Carrier');
    });

    it('should detect wrong column names (Store ID vs Store Id)', async () => {
      // Create CSV with wrong column name
      const wrongColPath = path.join(tempDir, 'wrong-column.csv');
      const content = `Carrier,Date,Store ID,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
FOX,2025-10-08,2082,test-id,John Doe,100,95`;
      fs.writeFileSync(wrongColPath, content);

      const result = await NashValidator.validate(wrongColPath);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(err => err.includes('Store Id'))).toBe(true);
    });

    it('should validate all required columns are present', async () => {
      const result = await NashValidator.validate(validCsvPath);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Data Type Validation', () => {
    it('should detect invalid Store Id (non-numeric)', async () => {
      const invalidStorePath = path.join(tempDir, 'invalid-store.csv');
      const content = `Carrier,Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
FOX,2025-10-08,ABC123,test-id,John Doe,100,95`;
      fs.writeFileSync(invalidStorePath, content);

      const result = await NashValidator.validate(invalidStorePath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('Store Id must be numeric'))).toBe(true);
    });

    it('should detect invalid date formats', async () => {
      const result = await NashValidator.validate(invalidCsvPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('Invalid date format'))).toBe(true);
    });

    it('should accept valid date formats', async () => {
      const validDatePath = path.join(tempDir, 'valid-dates.csv');
      const content = `Carrier,Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
FOX,10/08/2025,2082,test-id-1,John Doe,100,95
NTG,2025-10-08,2242,test-id-2,Jane Doe,80,78`;
      fs.writeFileSync(validDatePath, content);

      const result = await NashValidator.validate(validDatePath);

      expect(result.valid).toBe(true);
    });
  });

  describe('CA Store Filtering', () => {
    it('should count non-CA stores correctly', async () => {
      const mixedStoresPath = path.join(tempDir, 'mixed-stores.csv');
      const content = `Carrier,Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
FOX,2025-10-08,2082,test-id-1,John Doe,100,95
NTG,2025-10-08,1916,test-id-2,Jane Doe,80,78
FOX,2025-10-08,5930,test-id-3,Bob Smith,90,88
NTG,2025-10-08,1027,test-id-4,Alice Jones,75,72`;
      fs.writeFileSync(mixedStoresPath, content);

      const result = await NashValidator.validate(mixedStoresPath);

      expect(result.stats).toBeDefined();
      expect(result.stats?.nonCAStores).toBe(2);
      expect(result.warnings.some(w => w.includes('non-CA stores'))).toBe(true);
    });

    it('should list CA stores in warnings', async () => {
      const mixedStoresPath = path.join(tempDir, 'mixed-stores2.csv');
      const content = `Carrier,Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
FOX,2025-10-08,1234,test-id-1,John Doe,100,95`;
      fs.writeFileSync(mixedStoresPath, content);

      const result = await NashValidator.validate(mixedStoresPath);

      expect(result.warnings.some(w => w.includes('2082, 2242, 5930'))).toBe(true);
    });
  });

  describe('Carrier Validation', () => {
    it('should identify unknown carriers', async () => {
      const unknownCarrierPath = path.join(tempDir, 'unknown-carrier.csv');
      const content = `Carrier,Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
UNKNOWN_CARRIER,2025-10-08,2082,test-id-1,John Doe,100,95
FOX,2025-10-08,2242,test-id-2,Jane Doe,80,78`;
      fs.writeFileSync(unknownCarrierPath, content);

      const result = await NashValidator.validate(unknownCarrierPath);

      expect(result.stats?.unknownCarriers).toContain('UNKNOWN_CARRIER');
      expect(result.warnings.some(w => w.includes('Unknown carriers'))).toBe(true);
    });

    it('should accept known carriers (FOX, NTG, FDC)', async () => {
      const knownCarriersPath = path.join(tempDir, 'known-carriers.csv');
      const content = `Carrier,Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
FOX,2025-10-08,2082,test-id-1,John Doe,100,95
NTG,2025-10-08,2242,test-id-2,Jane Doe,80,78
FDC,2025-10-08,5930,test-id-3,Bob Smith,90,88`;
      fs.writeFileSync(knownCarriersPath, content);

      const result = await NashValidator.validate(knownCarriersPath);

      expect(result.stats?.unknownCarriers.length).toBe(0);
      expect(result.warnings.every(w => !w.includes('Unknown carriers'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty files', async () => {
      const emptyPath = path.join(tempDir, 'empty.csv');
      fs.writeFileSync(emptyPath, '');

      const result = await NashValidator.validate(emptyPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('empty'))).toBe(true);
    });

    it('should handle non-existent files', async () => {
      const nonExistentPath = path.join(tempDir, 'does-not-exist.csv');

      const result = await NashValidator.validate(nonExistentPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('does not exist'))).toBe(true);
    });

    it('should return stats for valid files', async () => {
      const result = await NashValidator.validate(validCsvPath);

      expect(result.stats).toBeDefined();
      expect(result.stats?.totalRows).toBeGreaterThan(0);
      expect(typeof result.stats?.nonCAStores).toBe('number');
      expect(Array.isArray(result.stats?.unknownCarriers)).toBe(true);
    });
  });
});
