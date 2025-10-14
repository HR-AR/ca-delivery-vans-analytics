import request from 'supertest';
import app from '../../src/ui-server';
import fs from 'fs';
import path from 'path';

const TEST_DATA_DIR = path.join(process.cwd(), 'data');
const TEST_REGISTRY_FILE = path.join(TEST_DATA_DIR, 'store-registry.json');
const TEST_RATE_CARDS_FILE = path.join(TEST_DATA_DIR, 'rate-cards.json');

describe('Store Registry API Endpoints', () => {
  // Clean up test data files before each test
  beforeEach(() => {
    if (fs.existsSync(TEST_REGISTRY_FILE)) {
      fs.unlinkSync(TEST_REGISTRY_FILE);
    }
    if (fs.existsSync(TEST_RATE_CARDS_FILE)) {
      fs.unlinkSync(TEST_RATE_CARDS_FILE);
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_REGISTRY_FILE)) {
      fs.unlinkSync(TEST_REGISTRY_FILE);
    }
    if (fs.existsSync(TEST_RATE_CARDS_FILE)) {
      fs.unlinkSync(TEST_RATE_CARDS_FILE);
    }
  });

  describe('GET /api/stores/registry', () => {
    it('should return empty registry initially', async () => {
      const response = await request(app).get('/api/stores/registry');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('stores');
      expect(response.body).toHaveProperty('last_updated');
      expect(response.body).toHaveProperty('version');
      expect(response.body.stores).toEqual({});
    });

    it('should return existing stores', async () => {
      // First, add some stores
      await request(app)
        .post('/api/stores/registry/bulk')
        .send({
          stores: [
            { storeId: '2082', sparkCpd: 5.6, targetBatchSize: 92 }
          ]
        });

      const response = await request(app).get('/api/stores/registry');

      expect(response.status).toBe(200);
      expect(response.body.stores['2082']).toBeDefined();
      expect(response.body.stores['2082'].spark_ytd_cpd).toBe(5.6);
    });
  });

  describe('POST /api/stores/registry/bulk', () => {
    it('should upload bulk Spark CPD data', async () => {
      const response = await request(app)
        .post('/api/stores/registry/bulk')
        .send({
          stores: [
            { storeId: '2082', sparkCpd: 5.6, targetBatchSize: 92 },
            { storeId: '2242', sparkCpd: 6.2, targetBatchSize: 87 }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.updated).toBe(2);
      expect(response.body.errors).toEqual([]);
    });

    it('should reject invalid request without stores array', async () => {
      const response = await request(app)
        .post('/api/stores/registry/bulk')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('stores array required');
    });

    it('should reject non-CA stores', async () => {
      const response = await request(app)
        .post('/api/stores/registry/bulk')
        .send({
          stores: [
            { storeId: '9999', sparkCpd: 5.6, targetBatchSize: 92 }
          ]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/stores/:storeId', () => {
    it('should get single store', async () => {
      // First, create a store
      await request(app)
        .post('/api/stores/registry/bulk')
        .send({
          stores: [
            { storeId: '2082', sparkCpd: 5.6, targetBatchSize: 92 }
          ]
        });

      const response = await request(app).get('/api/stores/2082');

      expect(response.status).toBe(200);
      expect(response.body.storeId).toBe('2082');
      expect(response.body.spark_ytd_cpd).toBe(5.6);
      expect(response.body.target_batch_size).toBe(92);
    });

    it('should return 404 for non-existent store', async () => {
      const response = await request(app).get('/api/stores/9999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/stores/:storeId', () => {
    it('should update single store', async () => {
      // First, create a store
      await request(app)
        .post('/api/stores/registry/bulk')
        .send({
          stores: [
            { storeId: '2082', sparkCpd: 5.6, targetBatchSize: 92 }
          ]
        });

      const response = await request(app)
        .put('/api/stores/2082')
        .send({
          spark_ytd_cpd: 6.5,
          target_batch_size: 95
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the update
      const getResponse = await request(app).get('/api/stores/2082');
      expect(getResponse.body.spark_ytd_cpd).toBe(6.5);
      expect(getResponse.body.target_batch_size).toBe(95);
    });

    it('should create new store if it does not exist', async () => {
      const response = await request(app)
        .put('/api/stores/2242')
        .send({
          spark_ytd_cpd: 6.2,
          target_batch_size: 87,
          status: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Rate Card API Endpoints', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_REGISTRY_FILE)) {
      fs.unlinkSync(TEST_REGISTRY_FILE);
    }
    if (fs.existsSync(TEST_RATE_CARDS_FILE)) {
      fs.unlinkSync(TEST_RATE_CARDS_FILE);
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_REGISTRY_FILE)) {
      fs.unlinkSync(TEST_REGISTRY_FILE);
    }
    if (fs.existsSync(TEST_RATE_CARDS_FILE)) {
      fs.unlinkSync(TEST_RATE_CARDS_FILE);
    }
  });

  describe('GET /api/rate-cards', () => {
    it('should return default rate cards', async () => {
      const response = await request(app).get('/api/rate-cards');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('vendors');
      expect(response.body.vendors).toHaveProperty('FOX');
      expect(response.body.vendors).toHaveProperty('NTG');
      expect(response.body.vendors).toHaveProperty('FDC');
    });

    it('should return rate cards with correct structure', async () => {
      const response = await request(app).get('/api/rate-cards');

      expect(response.status).toBe(200);
      expect(response.body.vendors.FOX).toHaveProperty('base_rate_80');
      expect(response.body.vendors.FOX).toHaveProperty('base_rate_100');
      expect(response.body.vendors.FOX).toHaveProperty('contractual_adjustment');
    });
  });

  describe('GET /api/rate-cards/:vendor', () => {
    it('should get single vendor rate card', async () => {
      const response = await request(app).get('/api/rate-cards/FOX');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('base_rate_80');
      expect(response.body).toHaveProperty('base_rate_100');
      expect(response.body).toHaveProperty('contractual_adjustment');
    });

    it('should return 404 for non-existent vendor', async () => {
      const response = await request(app).get('/api/rate-cards/INVALID');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/rate-cards/:vendor', () => {
    it('should update vendor rate card', async () => {
      const response = await request(app)
        .put('/api/rate-cards/FOX')
        .send({
          base_rate_80: 385.0,
          base_rate_100: 395.0,
          contractual_adjustment: 1.1,
          notes: 'Updated rates'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rateCard.base_rate_80).toBe(385.0);
      expect(response.body.rateCard.notes).toBe('Updated rates');
    });

    it('should reject negative base_rate_80', async () => {
      const response = await request(app)
        .put('/api/rate-cards/FOX')
        .send({
          base_rate_80: -100,
          base_rate_100: 390.0,
          contractual_adjustment: 1.0
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('base_rate_80');
    });

    it('should reject negative base_rate_100', async () => {
      const response = await request(app)
        .put('/api/rate-cards/FOX')
        .send({
          base_rate_80: 380.0,
          base_rate_100: -390.0,
          contractual_adjustment: 1.0
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('base_rate_100');
    });

    it('should reject negative contractual_adjustment', async () => {
      const response = await request(app)
        .put('/api/rate-cards/FOX')
        .send({
          base_rate_80: 380.0,
          base_rate_100: 390.0,
          contractual_adjustment: -1.0
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('contractual_adjustment');
    });

    it('should allow partial updates', async () => {
      const response = await request(app)
        .put('/api/rate-cards/FOX')
        .send({
          contractual_adjustment: 1.15,
          notes: 'Contract renewal'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rateCard.contractual_adjustment).toBe(1.15);
      expect(response.body.rateCard.notes).toBe('Contract renewal');
    });
  });
});
