import request from 'supertest';
import app from '../../src/ui-server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_REGISTRY_FILE = path.join(DATA_DIR, 'store-registry.json');
const RATE_CARDS_FILE = path.join(DATA_DIR, 'rate-cards.json');

describe('Phase 2 Integration', () => {
  beforeEach(() => {
    // Clean up test data files
    if (fs.existsSync(STORE_REGISTRY_FILE)) {
      fs.unlinkSync(STORE_REGISTRY_FILE);
    }
    if (fs.existsSync(`${STORE_REGISTRY_FILE}.bak`)) {
      fs.unlinkSync(`${STORE_REGISTRY_FILE}.bak`);
    }
    if (fs.existsSync(RATE_CARDS_FILE)) {
      fs.unlinkSync(RATE_CARDS_FILE);
    }
  });

  afterAll(() => {
    // Clean up test data files
    if (fs.existsSync(STORE_REGISTRY_FILE)) {
      fs.unlinkSync(STORE_REGISTRY_FILE);
    }
    if (fs.existsSync(`${STORE_REGISTRY_FILE}.bak`)) {
      fs.unlinkSync(`${STORE_REGISTRY_FILE}.bak`);
    }
    if (fs.existsSync(RATE_CARDS_FILE)) {
      fs.unlinkSync(RATE_CARDS_FILE);
    }
  });

  test('Complete Spark CPD upload and persistence flow', async () => {
    // Step 1: Upload Spark CPD bulk data for all 3 stores
    const sparkData = [
      { storeId: '2082', sparkCpd: 5.60, targetBatchSize: 92 },
      { storeId: '2242', sparkCpd: 6.20, targetBatchSize: 87 },
      { storeId: '5930', sparkCpd: 5.80, targetBatchSize: 95 }
    ];

    const sparkUploadResponse = await request(app)
      .post('/api/stores/registry/bulk')
      .send({ stores: sparkData })
      .expect(200);

    expect(sparkUploadResponse.body.success).toBe(true);
    expect(sparkUploadResponse.body.updated).toBe(3);

    // Step 2: Upload Nash CSV with only stores 2082 and 2242
    const nashFile = path.join(__dirname, '../fixtures/nash-two-stores.csv');
    const nashUploadResponse = await request(app)
      .post('/api/upload')
      .attach('file', nashFile)
      .expect(200);

    expect(nashUploadResponse.body.success).toBe(true);

    // Step 3: Verify all stores persist in registry
    const registryResponse = await request(app)
      .get('/api/stores/registry')
      .expect(200);

    // All 3 stores should exist
    expect(registryResponse.body.stores['2082']).toBeDefined();
    expect(registryResponse.body.stores['2242']).toBeDefined();
    expect(registryResponse.body.stores['5930']).toBeDefined();

    // Store 5930 should have Spark data persisted
    expect(registryResponse.body.stores['5930'].spark_ytd_cpd).toBe(5.80);
    expect(registryResponse.body.stores['5930'].target_batch_size).toBe(95);

    // Step 4: Upload Nash CSV with all 3 stores
    const nashFile2 = path.join(__dirname, '../fixtures/nash-three-stores.csv');
    const nashUploadResponse2 = await request(app)
      .post('/api/upload')
      .attach('file', nashFile2)
      .expect(200);

    expect(nashUploadResponse2.body.success).toBe(true);

    // Step 5: Verify store 5930 now shows in upload again
    const registryResponse2 = await request(app)
      .get('/api/stores/registry')
      .expect(200);

    expect(registryResponse2.body.stores['5930']).toBeDefined();
    expect(registryResponse2.body.stores['5930'].spark_ytd_cpd).toBe(5.80);
  });

  test('Rate card changes affect CPD calculations', async () => {
    // Step 1: Get current FOX rates
    const currentRatesResponse = await request(app)
      .get('/api/rate-cards/FOX')
      .expect(200);

    expect(currentRatesResponse.body.contractual_adjustment).toBe(1.00);
    const originalBaseRate80 = currentRatesResponse.body.base_rate_80;
    const originalBaseRate100 = currentRatesResponse.body.base_rate_100;

    // Step 2: Update FOX contractual adjustment to 1.05
    const updateResponse = await request(app)
      .put('/api/rate-cards/FOX')
      .send({ contractual_adjustment: 1.05 })
      .expect(200);

    expect(updateResponse.body.success).toBe(true);
    expect(updateResponse.body.rateCard.contractual_adjustment).toBe(1.05);

    // Step 3: Verify rates were updated
    const updatedRatesResponse = await request(app)
      .get('/api/rate-cards/FOX')
      .expect(200);

    expect(updatedRatesResponse.body.contractual_adjustment).toBe(1.05);

    // Verify base rates unchanged (only adjustment changed)
    expect(updatedRatesResponse.body.base_rate_80).toBe(originalBaseRate80);
    expect(updatedRatesResponse.body.base_rate_100).toBe(originalBaseRate100);

    // Step 4: Reset to 1.00
    const resetResponse = await request(app)
      .put('/api/rate-cards/FOX')
      .send({ contractual_adjustment: 1.00 })
      .expect(200);

    expect(resetResponse.body.success).toBe(true);
    expect(resetResponse.body.rateCard.contractual_adjustment).toBe(1.00);
  });

  test('Multiple rate card updates persist correctly', async () => {
    // Update FOX
    await request(app)
      .put('/api/rate-cards/FOX')
      .send({
        base_rate_80: 385.00,
        base_rate_100: 395.00,
        contractual_adjustment: 1.05
      })
      .expect(200);

    // Update NTG
    await request(app)
      .put('/api/rate-cards/NTG')
      .send({
        base_rate_80: 375.00,
        base_rate_100: 385.00,
        contractual_adjustment: 1.03
      })
      .expect(200);

    // Verify all rate cards
    const allRatesResponse = await request(app)
      .get('/api/rate-cards')
      .expect(200);

    expect(allRatesResponse.body.vendors.FOX.base_rate_80).toBe(385.00);
    expect(allRatesResponse.body.vendors.FOX.contractual_adjustment).toBe(1.05);
    expect(allRatesResponse.body.vendors.NTG.base_rate_80).toBe(375.00);
    expect(allRatesResponse.body.vendors.NTG.contractual_adjustment).toBe(1.03);

    // FDC should remain unchanged
    expect(allRatesResponse.body.vendors.FDC.base_rate_80).toBe(380.00);
    expect(allRatesResponse.body.vendors.FDC.contractual_adjustment).toBe(1.00);
  });

  test('Store updates and Nash upload integration', async () => {
    // Step 1: Manually update a store via API
    await request(app)
      .put('/api/stores/2082')
      .send({
        spark_ytd_cpd: 5.60,
        target_batch_size: 92
      })
      .expect(200);

    // Step 2: Upload Nash CSV with same store
    const nashFile = path.join(__dirname, '../fixtures/nash-two-stores.csv');
    await request(app)
      .post('/api/upload')
      .attach('file', nashFile)
      .expect(200);

    // Step 3: Verify store data persisted
    const storeResponse = await request(app)
      .get('/api/stores/2082')
      .expect(200);

    expect(storeResponse.body.spark_ytd_cpd).toBe(5.60);
    expect(storeResponse.body.target_batch_size).toBe(92);
  });

  test('Bulk upload validation and individual store queries', async () => {
    // Step 1: Attempt bulk upload with mix of valid and invalid stores
    const mixedStores = [
      { storeId: '2082', sparkCpd: 5.60, targetBatchSize: 92 },
      { storeId: '9999', sparkCpd: 6.00, targetBatchSize: 90 }, // Invalid
      { storeId: '2242', sparkCpd: 6.20, targetBatchSize: 87 }
    ];

    const bulkResponse = await request(app)
      .post('/api/stores/registry/bulk')
      .send({ stores: mixedStores })
      .expect(400);

    expect(bulkResponse.body.success).toBe(false);
    expect(bulkResponse.body.errors).toContain('Store 9999 is not a CA store');
    expect(bulkResponse.body.updated).toBe(2); // 2082 and 2242 should be updated

    // Step 2: Query individual stores
    const store2082Response = await request(app)
      .get('/api/stores/2082')
      .expect(200);

    expect(store2082Response.body.spark_ytd_cpd).toBe(5.60);

    const store2242Response = await request(app)
      .get('/api/stores/2242')
      .expect(200);

    expect(store2242Response.body.spark_ytd_cpd).toBe(6.20);

    // Step 3: Query invalid store should return 404
    await request(app)
      .get('/api/stores/9999')
      .expect(404);
  });

  test('End-to-end workflow: Spark upload, Rate card update, Nash upload', async () => {
    // Step 1: Upload Spark CPD data
    const sparkData = [
      { storeId: '2082', sparkCpd: 5.60, targetBatchSize: 92 },
      { storeId: '2242', sparkCpd: 6.20, targetBatchSize: 87 },
      { storeId: '5930', sparkCpd: 5.80, targetBatchSize: 95 }
    ];

    await request(app)
      .post('/api/stores/registry/bulk')
      .send({ stores: sparkData })
      .expect(200);

    // Step 2: Update rate cards
    await request(app)
      .put('/api/rate-cards/FOX')
      .send({
        base_rate_80: 385.00,
        contractual_adjustment: 1.05,
        notes: 'Q4 2025 rates'
      })
      .expect(200);

    // Step 3: Upload Nash CSV
    const nashFile = path.join(__dirname, '../fixtures/nash-three-stores.csv');
    const nashResponse = await request(app)
      .post('/api/upload')
      .attach('file', nashFile)
      .expect(200);

    expect(nashResponse.body.success).toBe(true);
    expect(nashResponse.body.validationResult.totalRows).toBeGreaterThan(0);

    // Step 4: Verify complete state
    const registryResponse = await request(app)
      .get('/api/stores/registry')
      .expect(200);

    expect(Object.keys(registryResponse.body.stores).length).toBe(3);

    const rateCardResponse = await request(app)
      .get('/api/rate-cards/FOX')
      .expect(200);

    expect(rateCardResponse.body.base_rate_80).toBe(385.00);
    expect(rateCardResponse.body.contractual_adjustment).toBe(1.05);
    expect(rateCardResponse.body.notes).toBe('Q4 2025 rates');
  });
});
