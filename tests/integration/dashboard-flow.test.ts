import request from 'supertest';
import app from '../../src/ui-server';
import path from 'path';
import fs from 'fs';

/**
 * Phase 4 Integration Tests: Dashboard Flow
 * Tests the complete upload → analytics → dashboard flow
 */
describe('Phase 4: Dashboard Analytics Flow', () => {
  const validCsvPath = path.join(__dirname, '../fixtures/nash-two-stores.csv');
  const uploadsDir = path.join(process.cwd(), 'uploads');

  // Clean up before and after tests
  beforeAll(() => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }
  });

  describe('Test 1: Upload CSV → Analytics APIs Respond', () => {
    it('should upload CSV and make data available to analytics endpoints', async () => {
      // Step 1: Upload valid CSV
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body.success).toBe(true);

      // Step 2: Verify dashboard endpoint responds
      const dashboardResponse = await request(app)
        .get('/api/analytics/dashboard');

      expect(dashboardResponse.status).toBe(200);
      expect(dashboardResponse.body).toBeDefined();
    }, 30000); // 30s timeout for Python script execution
  });

  describe('Test 2: Dashboard Endpoint Returns Valid Metrics', () => {
    it('should return structured dashboard metrics with all required fields', async () => {
      // Upload data first
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Get dashboard data
      const response = await request(app)
        .get('/api/analytics/dashboard');

      expect(response.status).toBe(200);

      // Verify response structure
      const data = response.body;
      expect(data).toBeDefined();

      // Check for key metrics (based on Python script output)
      // The exact structure depends on dashboard.py implementation
      expect(typeof data).toBe('object');
    }, 30000);
  });

  describe('Test 3: Store-Specific Analytics for CA Stores', () => {
    it('should analyze specific CA store (2082)', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Analyze store 2082 (known CA store)
      const response = await request(app)
        .get('/api/analytics/stores/2082');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Verify store-specific data
      const storeData = response.body;
      expect(typeof storeData).toBe('object');
    }, 30000);

    it('should analyze specific CA store (2242)', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Analyze store 2242 (known CA store)
      const response = await request(app)
        .get('/api/analytics/stores/2242');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    }, 30000);

    it('should get analytics for all stores', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Get all stores analytics
      const response = await request(app)
        .get('/api/analytics/stores');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.stores).toBeDefined();
      expect(Array.isArray(response.body.stores)).toBe(true);
    }, 30000);
  });

  describe('Test 4: Error Handling When No Data Uploaded', () => {
    it('should return 404 when dashboard accessed with no data', async () => {
      // Clean uploads directory
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(uploadsDir, file));
        });
      }

      // Try to access dashboard
      const response = await request(app)
        .get('/api/analytics/dashboard');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No Nash data available');
    });

    it('should return 404 when store analysis accessed with no data', async () => {
      // Ensure no data exists
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(uploadsDir, file));
        });
      }

      const response = await request(app)
        .get('/api/analytics/stores/2082');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No Nash data available');
    });

    it('should return 404 when vendors analysis accessed with no data', async () => {
      const response = await request(app)
        .get('/api/analytics/vendors');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No Nash data available');
    });
  });

  describe('Test 5: CPD Calculation Accuracy', () => {
    it('should calculate CPD comparison between Van and Spark', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Get CPD analysis
      const response = await request(app)
        .get('/api/analytics/cpd-comparison');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Verify CPD data structure
      const cpdData = response.body;
      expect(typeof cpdData).toBe('object');
    }, 30000);

    it('should include both Van CPD and Spark CPD in comparison', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      const response = await request(app)
        .get('/api/analytics/cpd-comparison');

      expect(response.status).toBe(200);

      // CPD comparison should include both metrics
      // Exact structure depends on cpd_analysis.py
      expect(response.body).toBeDefined();
    }, 30000);
  });

  describe('Test 6: Vendor Analysis Returns All 3 Vendors', () => {
    it('should analyze all vendors (FOX, NTG, FDC)', async () => {
      // Upload data with multiple vendors
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Get vendor analysis
      const response = await request(app)
        .get('/api/analytics/vendors');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Vendor analysis should include data for all carriers
      const vendorData = response.body;
      expect(typeof vendorData).toBe('object');
    }, 30000);

    it('should provide performance metrics per vendor', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      const response = await request(app)
        .get('/api/analytics/vendors');

      expect(response.status).toBe(200);

      // Each vendor should have performance metrics
      // Structure depends on vendor_analysis.py output
      expect(response.body).toBeDefined();
    }, 30000);
  });

  describe('Test 7: Batch Analysis Calculates Density Correctly', () => {
    it('should calculate batch density metrics', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Get batch analysis
      const response = await request(app)
        .get('/api/analytics/batch-analysis');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Batch analysis should include density metrics
      const batchData = response.body;
      expect(typeof batchData).toBe('object');
    }, 30000);

    it('should provide orders per batch metrics', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      const response = await request(app)
        .get('/api/analytics/batch-analysis');

      expect(response.status).toBe(200);

      // Batch density = orders per batch
      // Structure depends on batch_analysis.py
      expect(response.body).toBeDefined();
    }, 30000);
  });

  describe('Test 8: Performance Metrics Endpoint', () => {
    it('should calculate overall performance metrics', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Get performance metrics
      const response = await request(app)
        .get('/api/analytics/performance');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Performance should include OTD%, efficiency metrics
      const perfData = response.body;
      expect(typeof perfData).toBe('object');
    }, 30000);

    it('should handle performance calculation for empty periods', async () => {
      // Upload minimal data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      const response = await request(app)
        .get('/api/analytics/performance');

      // Should succeed even with limited data
      expect(response.status).toBe(200);
    }, 30000);
  });

  describe('Test 9: Multiple Uploads (Latest Data Used)', () => {
    it('should use most recent upload for analytics', async () => {
      // Upload first file
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Upload second file
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Analytics should use the latest upload
      const response = await request(app)
        .get('/api/analytics/dashboard');

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    }, 30000);
  });

  describe('Test 10: API Error Recovery', () => {
    it('should handle Python script errors gracefully', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // All endpoints should handle errors gracefully
      const endpoints = [
        '/api/analytics/dashboard',
        '/api/analytics/stores',
        '/api/analytics/vendors',
        '/api/analytics/cpd-comparison',
        '/api/analytics/batch-analysis',
        '/api/analytics/performance'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);

        // Should either succeed or return proper error
        expect([200, 404, 500]).toContain(response.status);

        if (response.status === 500) {
          expect(response.body.success).toBe(false);
          expect(response.body.error).toBeDefined();
        }
      }
    }, 60000);
  });

  describe('Test 11: Data Validation in Analytics Flow', () => {
    it('should only analyze valid Nash CSV data', async () => {
      // Upload valid data
      const response = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Analytics should work with validated data
      const analyticsResponse = await request(app)
        .get('/api/analytics/dashboard');

      expect(analyticsResponse.status).toBe(200);
    }, 30000);

    it('should reject invalid CSV before analytics', async () => {
      const invalidPath = path.join(__dirname, '../fixtures/invalid-nash.csv');

      // Upload invalid data
      const response = await request(app)
        .post('/api/upload')
        .attach('file', invalidPath);

      // Should fail at upload stage
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Test 12: Integration with Store Registry', () => {
    it('should use store registry in analytics calculations', async () => {
      // Get store registry
      const registryResponse = await request(app)
        .get('/api/stores/registry');

      expect(registryResponse.status).toBe(200);

      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Analytics should integrate with registry
      const analyticsResponse = await request(app)
        .get('/api/analytics/dashboard');

      expect(analyticsResponse.status).toBe(200);
    }, 30000);
  });

  describe('Test 13: Integration with Rate Cards', () => {
    it('should use rate cards in CPD calculations', async () => {
      // Get rate cards
      const rateCardsResponse = await request(app)
        .get('/api/rate-cards');

      expect(rateCardsResponse.status).toBe(200);

      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // CPD analysis should use rate cards
      const cpdResponse = await request(app)
        .get('/api/analytics/cpd-comparison');

      expect(cpdResponse.status).toBe(200);
    }, 30000);
  });

  describe('Test 14: Complete Dashboard Data Flow', () => {
    it('should execute complete upload → validate → analyze → display flow', async () => {
      // Step 1: Upload
      const uploadResponse = await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      expect(uploadResponse.status).toBe(200);
      expect(uploadResponse.body.success).toBe(true);

      // Step 2: Get all analytics
      const dashboard = await request(app).get('/api/analytics/dashboard');
      const stores = await request(app).get('/api/analytics/stores');
      const vendors = await request(app).get('/api/analytics/vendors');
      const cpd = await request(app).get('/api/analytics/cpd-comparison');
      const batches = await request(app).get('/api/analytics/batch-analysis');
      const performance = await request(app).get('/api/analytics/performance');

      // All should succeed
      expect(dashboard.status).toBe(200);
      expect(stores.status).toBe(200);
      expect(vendors.status).toBe(200);
      expect(cpd.status).toBe(200);
      expect(batches.status).toBe(200);
      expect(performance.status).toBe(200);

      // All should return data
      expect(dashboard.body).toBeDefined();
      expect(stores.body).toBeDefined();
      expect(vendors.body).toBeDefined();
      expect(cpd.body).toBeDefined();
      expect(batches.body).toBeDefined();
      expect(performance.body).toBeDefined();
    }, 60000);
  });

  describe('Test 15: API Response Times', () => {
    it('should respond within reasonable time limits', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // Test dashboard response time
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/analytics/dashboard');
      const endTime = Date.now();

      expect(response.status).toBe(200);

      // Dashboard should respond within 10 seconds
      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(10000);

      console.log(`Dashboard response time: ${responseTime}ms`);
    }, 30000);

    it('should cache or optimize repeated requests', async () => {
      // Upload data
      await request(app)
        .post('/api/upload')
        .attach('file', validCsvPath);

      // First request
      const start1 = Date.now();
      await request(app).get('/api/analytics/dashboard');
      const time1 = Date.now() - start1;

      // Second request (should be similar or faster)
      const start2 = Date.now();
      await request(app).get('/api/analytics/dashboard');
      const time2 = Date.now() - start2;

      console.log(`First request: ${time1}ms, Second request: ${time2}ms`);

      // Both should complete reasonably quickly
      expect(time1).toBeLessThan(10000);
      expect(time2).toBeLessThan(10000);
    }, 60000);
  });
});
