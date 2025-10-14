import request from 'supertest';
import app from '../../src/ui-server';
import path from 'path';
import fs from 'fs';

describe('Upload Endpoint', () => {
  const validCsvPath = path.join(__dirname, '../fixtures/valid-nash.csv');

  // Clean up uploads directory after tests
  afterAll(() => {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }
  });

  describe('POST /api/upload', () => {
    it('should accept valid CSV files', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('File uploaded successfully');
      expect(response.body.filename).toBe('valid-nash.csv');
      expect(response.body.size).toBeGreaterThan(0);
    });

    it('should reject non-CSV files', async () => {
      // Create a temporary non-CSV file
      const tempFile = path.join(__dirname, '../fixtures/test.txt');
      fs.writeFileSync(tempFile, 'This is not a CSV file');

      const response = await request(app)
        .post('/api/upload')
        .attach('file', tempFile);

      // Clean up temp file
      fs.unlinkSync(tempFile);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should reject files over 50MB', async () => {
      // Create a large file (simulate > 50MB)
      const largeCsvPath = path.join(__dirname, '../fixtures/large-file.csv');
      const largeContent = 'a'.repeat(51 * 1024 * 1024); // 51MB
      fs.writeFileSync(largeCsvPath, largeContent);

      const response = await request(app)
        .post('/api/upload')
        .attach('file', largeCsvPath);

      // Clean up
      fs.unlinkSync(largeCsvPath);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });

    it('should return error when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/upload');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('should return correct response format for successful upload', async () => {
      const response = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('size');

      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
      expect(typeof response.body.filename).toBe('string');
      expect(typeof response.body.size).toBe('number');
    });
  });
});
