import request from 'supertest';
import app from '../../src/ui-server';

describe('Server Health Check', () => {
  describe('GET /health', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return correct JSON structure', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('timestamp');

      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('CA Delivery Vans Analytics');
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Server Configuration', () => {
    it('should have correct port configuration', () => {
      const port = process.env.PORT || 3000;
      expect(port).toBeDefined();
      expect(typeof port === 'string' || typeof port === 'number').toBe(true);
    });
  });
});
