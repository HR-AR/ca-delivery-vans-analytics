import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { upload } from './middleware/upload';
import { HealthCheckResponse, UploadResponse, ErrorResponse } from './types';
import { NashValidator } from './utils/nash-validator';

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

    // Clean up uploaded file after validation
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('File cleanup error:', cleanupError);
    }

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: validationResult.errors.join(', '),
        validationErrors: validationResult.errors,
        warnings: validationResult.warnings
      } as ErrorResponse);
    }

    res.status(200).json({
      success: true,
      message: 'File uploaded and validated successfully',
      filename: req.file.originalname,
      size: req.file.size,
      validationResult: {
        totalRows: validationResult.stats?.totalRows || 0,
        caStores: 0, // Will be populated in Phase 2 with CA store registry
        nonCAStoresExcluded: validationResult.stats?.nonCAStores || 0,
        carriers: validationResult.stats?.unknownCarriers || [],
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
