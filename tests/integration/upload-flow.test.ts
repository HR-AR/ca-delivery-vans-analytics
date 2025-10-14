import request from 'supertest';
import app from '../../src/ui-server';
import { NashValidator } from '../../src/utils/nash-validator';
import path from 'path';
import fs from 'fs';

describe('End-to-End Upload Flow', () => {
  const validCsvPath = path.join(__dirname, '../fixtures/valid-nash.csv');
  const invalidCsvPath = path.join(__dirname, '../fixtures/invalid-nash.csv');
  const uploadsDir = path.join(process.cwd(), 'uploads');

  // Clean up after all tests
  afterAll(() => {
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }
  });

  describe('Complete Upload and Validation Flow', () => {
    it('should upload valid CSV and pass validation', async () => {
      // Step 1: Upload file
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body.success).toBe(true);

      // Step 2: Validate the uploaded content
      const validationResult = await NashValidator.validate(validCsvPath);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors.length).toBe(0);
      expect(validationResult.stats).toBeDefined();
      expect(validationResult.stats?.totalRows).toBe(3);
    });

    it('should detect validation errors in uploaded invalid CSV', async () => {
      // Upload file with validation errors (should be rejected)
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', invalidCsvPath);

      // Should fail with 400 due to validation errors
      expect(uploadResponse.status).toBe(400);
      expect(uploadResponse.body.success).toBe(false);
      expect(uploadResponse.body.error).toBeDefined();
      expect(uploadResponse.body.validationErrors).toBeDefined();
      expect(uploadResponse.body.validationErrors.length).toBeGreaterThan(0);
    });

    it('should provide detailed error messages for format issues', async () => {
      const validationResult = await NashValidator.validate(invalidCsvPath);

      expect(validationResult.valid).toBe(false);

      // Check for date format error (invalid-nash.csv has incorrect date)
      const hasDateError = validationResult.errors.some(
        err => err.includes('Invalid date format')
      );
      expect(hasDateError).toBe(true);

      // Verify error message is descriptive
      expect(validationResult.errors.length).toBeGreaterThan(0);
      expect(validationResult.errors[0].length).toBeGreaterThan(20);
    });

    it('should track statistics across the flow', async () => {
      // Upload and validate
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(uploadResponse.status).toBe(200);

      const validationResult = await NashValidator.validate(validCsvPath);

      // Verify stats are captured
      expect(validationResult.stats).toBeDefined();
      expect(validationResult.stats?.totalRows).toBeGreaterThan(0);
      expect(typeof validationResult.stats?.nonCAStores).toBe('number');
      expect(Array.isArray(validationResult.stats?.unknownCarriers)).toBe(true);
    });
  });

  describe('Integration with CA Store Filtering', () => {
    it('should identify CA stores in uploaded data', async () => {
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(uploadResponse.status).toBe(200);

      const validationResult = await NashValidator.validate(validCsvPath);

      // Valid CSV has only CA stores (2082, 2242, 5930)
      expect(validationResult.stats?.nonCAStores).toBe(0);
    });

    it('should warn about non-CA stores in mixed data', async () => {
      // Create a temporary file with mixed CA and non-CA stores
      const mixedCsvPath = path.join(__dirname, '../fixtures/temp-mixed.csv');
      const content = `Carrier,Date,Store Id,Walmart Trip Id,Courier Name,Total Orders,Delivered Orders
FOX,2025-10-08,2082,id-1,John Doe,100,95
NTG,2025-10-08,1916,id-2,Jane Doe,80,78`;
      fs.writeFileSync(mixedCsvPath, content);

      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', mixedCsvPath);

      expect(uploadResponse.status).toBe(200);

      const validationResult = await NashValidator.validate(mixedCsvPath);

      expect(validationResult.warnings.length).toBeGreaterThan(0);
      expect(validationResult.warnings.some(w => w.includes('non-CA stores'))).toBe(true);

      // Clean up
      fs.unlinkSync(mixedCsvPath);
    });
  });

  describe('Error Recovery', () => {
    it('should handle corrupted CSV gracefully', async () => {
      const corruptedPath = path.join(__dirname, '../fixtures/temp-corrupted.csv');
      fs.writeFileSync(corruptedPath, 'This is not a valid CSV\nNo proper structure');

      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', corruptedPath);

      // Should fail validation and return 400
      expect(uploadResponse.status).toBe(400);
      expect(uploadResponse.body.success).toBe(false);
      expect(uploadResponse.body.error).toBeDefined();

      // Clean up
      fs.unlinkSync(corruptedPath);
    });

    it('should provide actionable error messages', async () => {
      const validationResult = await NashValidator.validate(invalidCsvPath);

      expect(validationResult.valid).toBe(false);

      // Error messages should be descriptive
      validationResult.errors.forEach(error => {
        expect(error.length).toBeGreaterThan(10);
        expect(typeof error).toBe('string');
      });
    });
  });
});
