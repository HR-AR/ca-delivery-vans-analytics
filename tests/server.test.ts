import request from 'supertest';
import app from '../src/ui-server';

describe('Express Server', () => {
  describe('GET /health', () => {
    it('should return health check status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'CA Delivery Vans Analytics');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/upload', () => {
    it('should return error when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/upload');
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'No file uploaded');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/nonexistent');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});
