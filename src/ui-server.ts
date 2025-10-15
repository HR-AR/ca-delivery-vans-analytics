import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { upload } from './middleware/upload';
import { HealthCheckResponse, UploadResponse, ErrorResponse } from './types';
import { NashValidator } from './utils/nash-validator';
import {
  loadStoreRegistry,
  loadRateCards,
  updateStore,
  getStore,
  updateRateCard,
  getRateCard,
  bulkUploadSparkCPD
} from './utils/data-store';
import { AnalyticsService } from './services/analytics.service';

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (_req: Request, res: Response<HealthCheckResponse>) => {
  res.status(200).json({
    status: 'ok',
    service: 'CA Delivery Vans Analytics',
    timestamp: new Date().toISOString()
  });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response<UploadResponse | ErrorResponse>) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Validate Nash CSV file
    const validationResult = await NashValidator.validate(req.file.path);

    if (!validationResult.valid) {
      // Clean up uploaded file if validation fails
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('File cleanup error:', cleanupError);
      }

      return res.status(400).json({
        success: false,
        error: validationResult.errors.join(', '),
        validationErrors: validationResult.errors,
        warnings: validationResult.warnings
      } as ErrorResponse);
    }

    // Keep the file for analytics (rename with timestamp)
    const timestamp = Date.now();
    const newPath = path.join(
      path.dirname(req.file.path),
      `nash_${timestamp}.csv`
    );
    fs.renameSync(req.file.path, newPath);

    // Calculate CA stores (total - non-CA)
    const totalRows = validationResult.stats?.totalRows || 0;
    const nonCAStores = validationResult.stats?.nonCAStores || 0;
    const caStores = totalRows - nonCAStores;

    res.status(200).json({
      success: true,
      message: 'File uploaded and validated successfully',
      filename: req.file.originalname,
      savedAs: `nash_${timestamp}.csv`,
      size: req.file.size,
      validationResult: {
        totalRows: totalRows,
        caStores: caStores,
        nonCAStoresExcluded: nonCAStores,
        carriers: validationResult.stats?.discoveredCarriers || [], // Show normalized carriers
        warnings: validationResult.warnings
      }
    } as UploadResponse);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Store Registry Endpoints

// GET /api/stores/registry - Get all stores
app.get('/api/stores/registry', async (_req: Request, res: Response) => {
  try {
    const registry = await loadStoreRegistry();
    res.status(200).json(registry);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load store registry'
    });
  }
});

// POST /api/stores/registry/bulk - Bulk upload Spark CPD data
app.post('/api/stores/registry/bulk', async (req: Request, res: Response) => {
  try {
    const { stores } = req.body;

    if (!stores || !Array.isArray(stores)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: stores array required'
      });
    }

    const result = await bulkUploadSparkCPD(stores);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Bulk upload failed'
    });
  }
});

// GET /api/stores/:storeId - Get single store
app.get('/api/stores/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const store = await getStore(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: `Store ${storeId} not found`
      });
    }

    res.status(200).json({ storeId, ...store });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get store'
    });
  }
});

// PUT /api/stores/:storeId - Update single store
app.put('/api/stores/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const updates = req.body;

    await updateStore(storeId, updates);

    res.status(200).json({
      success: true,
      message: `Store ${storeId} updated successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update store'
    });
  }
});

// Rate Card Endpoints

// GET /api/rate-cards - Get all rate cards
app.get('/api/rate-cards', async (_req: Request, res: Response) => {
  try {
    const rateCards = await loadRateCards();
    res.status(200).json(rateCards);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load rate cards'
    });
  }
});

// GET /api/rate-cards/:vendor - Get single vendor rate card
app.get('/api/rate-cards/:vendor', async (req: Request, res: Response) => {
  try {
    const { vendor } = req.params;
    const rateCard = await getRateCard(vendor);

    if (!rateCard) {
      return res.status(404).json({
        success: false,
        error: `Rate card for vendor ${vendor} not found`
      });
    }

    res.status(200).json(rateCard);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rate card'
    });
  }
});

// PUT /api/rate-cards/:vendor - Update vendor rate card
app.put('/api/rate-cards/:vendor', async (req: Request, res: Response) => {
  try {
    const { vendor } = req.params;
    const updates = req.body;

    // Validate numeric values
    if (updates.base_rate_80 !== undefined && (typeof updates.base_rate_80 !== 'number' || updates.base_rate_80 < 0)) {
      return res.status(400).json({
        success: false,
        error: 'base_rate_80 must be a non-negative number'
      });
    }

    if (updates.base_rate_100 !== undefined && (typeof updates.base_rate_100 !== 'number' || updates.base_rate_100 < 0)) {
      return res.status(400).json({
        success: false,
        error: 'base_rate_100 must be a non-negative number'
      });
    }

    if (updates.contractual_adjustment !== undefined && (typeof updates.contractual_adjustment !== 'number' || updates.contractual_adjustment < 0)) {
      return res.status(400).json({
        success: false,
        error: 'contractual_adjustment must be a non-negative number'
      });
    }

    await updateRateCard(vendor, updates);

    const updatedCard = await getRateCard(vendor);

    res.status(200).json({
      success: true,
      message: `Rate card for ${vendor} updated successfully`,
      rateCard: updatedCard
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update rate card'
    });
  }
});

// Helper function to get latest Nash CSV file
function getLatestNashFile(): string | null {
  if (!fs.existsSync(uploadsDir)) {
    return null;
  }

  const files = fs.readdirSync(uploadsDir)
    .filter(f => f.endsWith('.csv'))
    .map(f => ({
      name: f,
      path: path.join(uploadsDir, f),
      time: fs.statSync(path.join(uploadsDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  return files.length > 0 ? files[0].path : null;
}

// Analytics Endpoints

// GET /api/analytics/dashboard - Calculate dashboard metrics
app.get('/api/analytics/dashboard', async (_req: Request, res: Response) => {
  try {
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available. Please upload a CSV file first.'
      });
    }

    const result = await AnalyticsService.calculateDashboard(latestFile);
    res.json(result);
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analytics calculation failed'
    });
  }
});

// GET /api/analytics/stores - Analyze all stores
app.get('/api/analytics/stores', async (_req: Request, res: Response) => {
  try {
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available'
      });
    }

    // Get all stores from Nash data (let Python filter CA stores)
    // The Python analysis scripts handle CA filtering automatically
    const result = await AnalyticsService.analyzeAllStores(latestFile);

    res.json(result);
  } catch (error) {
    console.error('Store analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Store analysis failed'
    });
  }
});

// GET /api/analytics/stores/:storeId - Analyze specific store
app.get('/api/analytics/stores/:storeId', async (req: Request, res: Response) => {
  try {
    const { storeId } = req.params;
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available'
      });
    }

    const result = await AnalyticsService.analyzeStore(latestFile, storeId);
    res.json(result);
  } catch (error) {
    console.error('Store analysis error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed'
    });
  }
});

// GET /api/analytics/vendors - Compare vendor performance
app.get('/api/analytics/vendors', async (_req: Request, res: Response) => {
  try {
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available'
      });
    }

    const result = await AnalyticsService.compareVendors(latestFile);
    res.json(result);
  } catch (error) {
    console.error('Vendor analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Vendor analysis failed'
    });
  }
});

// GET /api/analytics/cpd-comparison - Compare Van CPD vs Spark CPD
app.get('/api/analytics/cpd-comparison', async (_req: Request, res: Response) => {
  try {
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available'
      });
    }

    const result = await AnalyticsService.analyzeCpd(latestFile);
    res.json(result);
  } catch (error) {
    console.error('CPD analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'CPD analysis failed'
    });
  }
});

// GET /api/analytics/batch-analysis - Analyze batch performance
app.get('/api/analytics/batch-analysis', async (_req: Request, res: Response) => {
  try {
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available'
      });
    }

    const result = await AnalyticsService.analyzeBatches(latestFile);
    res.json(result);
  } catch (error) {
    console.error('Batch analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch analysis failed'
    });
  }
});

// GET /api/analytics/performance - Calculate performance metrics
app.get('/api/analytics/performance', async (_req: Request, res: Response) => {
  try {
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available'
      });
    }

    const result = await AnalyticsService.calculatePerformance(latestFile);
    res.json(result);
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Performance calculation failed'
    });
  }
});

// GET /api/analytics/weekly-metrics - Week-over-week metrics analysis
app.get('/api/analytics/weekly-metrics', async (_req: Request, res: Response) => {
  try {
    const latestFile = getLatestNashFile();

    if (!latestFile) {
      return res.status(404).json({
        success: false,
        error: 'No Nash data available. Please upload a CSV file first.'
      });
    }

    const result = await AnalyticsService.analyzeWeeklyMetrics(latestFile);
    res.json(result);
  } catch (error) {
    console.error('Weekly metrics error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Weekly metrics calculation failed'
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Upload endpoint: http://localhost:${PORT}/api/upload`);
  });
}

export default app;
