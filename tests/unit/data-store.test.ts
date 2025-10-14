import fs from 'fs';
import path from 'path';
import {
  loadStoreRegistry,
  saveStoreRegistry,
  loadRateCards,
  saveRateCards,
  mergeStoreData,
  bulkUploadSparkCPD,
  getStore,
  updateStore,
  getRateCard,
  updateRateCard
} from '../../src/utils/data-store';

const TEST_DATA_DIR = path.join(process.cwd(), 'data');
const TEST_REGISTRY_FILE = path.join(TEST_DATA_DIR, 'store-registry.json');
const TEST_RATE_CARDS_FILE = path.join(TEST_DATA_DIR, 'rate-cards.json');

describe('Data Store', () => {
  // Clean up test data files before each test
  beforeEach(() => {
    if (fs.existsSync(TEST_REGISTRY_FILE)) {
      fs.unlinkSync(TEST_REGISTRY_FILE);
    }
    if (fs.existsSync(TEST_RATE_CARDS_FILE)) {
      fs.unlinkSync(TEST_RATE_CARDS_FILE);
    }
    // Clean up backup files
    if (fs.existsSync(TEST_DATA_DIR)) {
      const files = fs.readdirSync(TEST_DATA_DIR);
      files.forEach(file => {
        if (file.includes('.bak') || file.includes('.backup')) {
          fs.unlinkSync(path.join(TEST_DATA_DIR, file));
        }
      });
    }
  });

  // Clean up after all tests
  afterAll(() => {
    if (fs.existsSync(TEST_REGISTRY_FILE)) {
      fs.unlinkSync(TEST_REGISTRY_FILE);
    }
    if (fs.existsSync(TEST_RATE_CARDS_FILE)) {
      fs.unlinkSync(TEST_RATE_CARDS_FILE);
    }
  });

  describe('Store Registry', () => {
    it('should create default empty registry if file does not exist', async () => {
      const registry = await loadStoreRegistry();

      expect(registry).toHaveProperty('stores');
      expect(registry).toHaveProperty('last_updated');
      expect(registry).toHaveProperty('version');
      expect(registry.stores).toEqual({});
      expect(registry.version).toBe('1.0');
    });

    it('should save and load store registry', async () => {
      const testRegistry = {
        stores: {
          '2082': {
            spark_ytd_cpd: 5.6,
            target_batch_size: 92,
            status: 'active' as const
          }
        },
        last_updated: new Date().toISOString(),
        version: '1.0'
      };

      await saveStoreRegistry(testRegistry);
      const loaded = await loadStoreRegistry();

      expect(loaded.stores['2082']).toBeDefined();
      expect(loaded.stores['2082'].spark_ytd_cpd).toBe(5.6);
      expect(loaded.stores['2082'].target_batch_size).toBe(92);
    });

    it('should create backup before saving', async () => {
      const registry1 = {
        stores: { '2082': { spark_ytd_cpd: 5.6, target_batch_size: 92, status: 'active' as const } },
        last_updated: new Date().toISOString(),
        version: '1.0'
      };

      await saveStoreRegistry(registry1);

      const registry2 = {
        stores: { '2242': { spark_ytd_cpd: 6.2, target_batch_size: 87, status: 'active' as const } },
        last_updated: new Date().toISOString(),
        version: '1.0'
      };

      await saveStoreRegistry(registry2);

      // Check that backup file was created
      const files = fs.readdirSync(TEST_DATA_DIR);
      const backupFiles = files.filter(f => f.includes('store-registry') && f.includes('.bak'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });

    it('should merge store data from new upload', async () => {
      const existing = {
        stores: {
          '2082': {
            spark_ytd_cpd: 5.6,
            target_batch_size: 92,
            status: 'active' as const
          }
        },
        last_updated: '2025-10-01T00:00:00Z',
        version: '1.0'
      };

      const newUpload = {
        stores: [
          { storeId: '2082', orders: 100 },
          { storeId: '2242', orders: 150 }
        ],
        uploadDate: '2025-10-13T00:00:00Z'
      };

      const merged = await mergeStoreData(existing, newUpload);

      expect(merged.stores['2082']).toBeDefined();
      expect(merged.stores['2082'].last_seen_in_upload).toBe('2025-10-13T00:00:00Z');
      expect(merged.stores['2242']).toBeDefined();
      expect(merged.stores['2242'].last_seen_in_upload).toBe('2025-10-13T00:00:00Z');
    });

    it('should get single store', async () => {
      const registry = {
        stores: {
          '2082': {
            spark_ytd_cpd: 5.6,
            target_batch_size: 92,
            status: 'active' as const
          }
        },
        last_updated: new Date().toISOString(),
        version: '1.0'
      };

      await saveStoreRegistry(registry);
      const store = await getStore('2082');

      expect(store).toBeDefined();
      expect(store?.spark_ytd_cpd).toBe(5.6);
    });

    it('should return null for non-existent store', async () => {
      const store = await getStore('9999');
      expect(store).toBeNull();
    });

    it('should update single store', async () => {
      await updateStore('2082', {
        spark_ytd_cpd: 6.5,
        target_batch_size: 95,
        status: 'active'
      });

      const store = await getStore('2082');
      expect(store?.spark_ytd_cpd).toBe(6.5);
      expect(store?.target_batch_size).toBe(95);
    });

    it('should bulk upload Spark CPD data', async () => {
      const stores = [
        { storeId: '2082', sparkCpd: 5.6, targetBatchSize: 92 },
        { storeId: '2242', sparkCpd: 6.2, targetBatchSize: 87 }
      ];

      const result = await bulkUploadSparkCPD(stores);

      expect(result.success).toBe(true);
      expect(result.updated).toBe(2);
      expect(result.errors).toEqual([]);

      const store1 = await getStore('2082');
      expect(store1?.spark_ytd_cpd).toBe(5.6);

      const store2 = await getStore('2242');
      expect(store2?.spark_ytd_cpd).toBe(6.2);
    });

    it('should reject non-CA stores in bulk upload', async () => {
      const stores = [
        { storeId: '2082', sparkCpd: 5.6, targetBatchSize: 92 },
        { storeId: '9999', sparkCpd: 6.0, targetBatchSize: 90 }
      ];

      const result = await bulkUploadSparkCPD(stores);

      expect(result.success).toBe(false);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('9999');
    });
  });

  describe('Rate Cards', () => {
    it('should create default rate cards if file does not exist', async () => {
      const rateCards = await loadRateCards();

      expect(rateCards).toHaveProperty('vendors');
      expect(rateCards).toHaveProperty('version');
      expect(rateCards.vendors).toHaveProperty('FOX');
      expect(rateCards.vendors).toHaveProperty('NTG');
      expect(rateCards.vendors).toHaveProperty('FDC');
    });

    it('should save and load rate cards', async () => {
      const testRateCards = {
        vendors: {
          FOX: {
            base_rate_80: 380.0,
            base_rate_100: 390.0,
            contractual_adjustment: 1.05,
            notes: 'Updated rates'
          }
        },
        last_updated: new Date().toISOString(),
        version: '1.0'
      };

      await saveRateCards(testRateCards);
      const loaded = await loadRateCards();

      expect(loaded.vendors.FOX.base_rate_80).toBe(380.0);
      expect(loaded.vendors.FOX.contractual_adjustment).toBe(1.05);
    });

    it('should get single vendor rate card', async () => {
      const rateCard = await getRateCard('FOX');

      expect(rateCard).toBeDefined();
      expect(rateCard?.base_rate_80).toBeDefined();
      expect(rateCard?.base_rate_100).toBeDefined();
    });

    it('should return null for non-existent vendor', async () => {
      const rateCard = await getRateCard('INVALID');
      expect(rateCard).toBeNull();
    });

    it('should update single vendor rate card', async () => {
      await updateRateCard('FOX', {
        base_rate_80: 385.0,
        contractual_adjustment: 1.1,
        notes: 'New contract rates'
      });

      const rateCard = await getRateCard('FOX');
      expect(rateCard?.base_rate_80).toBe(385.0);
      expect(rateCard?.contractual_adjustment).toBe(1.1);
      expect(rateCard?.notes).toBe('New contract rates');
    });

    it('should reject invalid rate card data', async () => {
      const invalidRateCards = {
        vendors: {
          FOX: {
            base_rate_80: -100, // Invalid: negative
            base_rate_100: 390.0,
            contractual_adjustment: 1.0
          }
        },
        last_updated: new Date().toISOString(),
        version: '1.0'
      };

      await expect(saveRateCards(invalidRateCards)).rejects.toThrow();
    });

    it('should reject update to non-existent vendor', async () => {
      await expect(updateRateCard('INVALID', { base_rate_80: 400 })).rejects.toThrow();
    });
  });
});
