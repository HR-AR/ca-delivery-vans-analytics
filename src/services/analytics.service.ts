import { runPythonScript } from '../utils/python-bridge';
import { loadStoreRegistry, loadRateCards } from '../utils/data-store';
import path from 'path';
import fs from 'fs';

/**
 * Analytics Service
 * Bridges Node.js backend with Python analysis scripts
 */
export class AnalyticsService {
  private static tempDir = path.join(__dirname, '../../temp');

  /**
   * Ensure temp directory exists
   */
  private static ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Create temp JSON files for Python scripts
   */
  private static async createTempFiles(): Promise<{
    registryPath: string;
    rateCardsPath: string;
  }> {
    this.ensureTempDir();

    const storeRegistry = await loadStoreRegistry();
    const rateCards = await loadRateCards();

    const registryPath = path.join(this.tempDir, `registry_${Date.now()}.json`);
    const rateCardsPath = path.join(this.tempDir, `rate_cards_${Date.now()}.json`);

    fs.writeFileSync(registryPath, JSON.stringify(storeRegistry));
    fs.writeFileSync(rateCardsPath, JSON.stringify(rateCards));

    return { registryPath, rateCardsPath };
  }

  /**
   * Clean up temp files
   */
  private static cleanupTempFiles(...files: string[]): void {
    for (const file of files) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      } catch (error) {
        console.error(`Failed to cleanup temp file ${file}:`, error);
      }
    }
  }

  /**
   * Calculate dashboard metrics from uploaded Nash CSV
   */
  static async calculateDashboard(csvFilePath: string): Promise<Record<string, unknown>> {
    const { registryPath, rateCardsPath } = await this.createTempFiles();

    try {
      const result = await runPythonScript('dashboard.py', [
        csvFilePath,
        registryPath,
        rateCardsPath
      ]);
      return result;
    } finally {
      this.cleanupTempFiles(registryPath, rateCardsPath);
    }
  }

  /**
   * Analyze a specific store
   */
  static async analyzeStore(csvFilePath: string, storeId: string): Promise<Record<string, unknown>> {
    const { registryPath, rateCardsPath } = await this.createTempFiles();

    try {
      const result = await runPythonScript('store_analysis.py', [
        csvFilePath,
        storeId,
        registryPath,
        rateCardsPath
      ]);
      return result;
    } finally {
      this.cleanupTempFiles(registryPath, rateCardsPath);
    }
  }

  /**
   * Compare vendor performance
   */
  static async compareVendors(csvFilePath: string): Promise<Record<string, unknown>> {
    this.ensureTempDir();

    const rateCards = await loadRateCards();
    const rateCardsPath = path.join(this.tempDir, `rate_cards_${Date.now()}.json`);
    fs.writeFileSync(rateCardsPath, JSON.stringify(rateCards));

    try {
      const result = await runPythonScript('vendor_analysis.py', [
        csvFilePath,
        rateCardsPath
      ]);
      return result;
    } finally {
      this.cleanupTempFiles(rateCardsPath);
    }
  }

  /**
   * Analyze CPD comparison (Van vs Spark)
   */
  static async analyzeCpd(csvFilePath: string): Promise<Record<string, unknown>> {
    const { registryPath, rateCardsPath } = await this.createTempFiles();

    try {
      const result = await runPythonScript('cpd_analysis.py', [
        csvFilePath,
        registryPath,
        rateCardsPath
      ]);
      return result;
    } finally {
      this.cleanupTempFiles(registryPath, rateCardsPath);
    }
  }

  /**
   * Analyze batch performance (trip-level data for scatter plot)
   */
  static async analyzeBatches(csvFilePath: string): Promise<Record<string, unknown>> {
    const { registryPath, rateCardsPath } = await this.createTempFiles();

    try {
      const result = await runPythonScript('batch_analysis.py', [
        csvFilePath,
        registryPath,
        rateCardsPath
      ]);
      return result;
    } finally {
      this.cleanupTempFiles(registryPath, rateCardsPath);
    }
  }

  /**
   * Calculate performance metrics
   */
  static async calculatePerformance(csvFilePath: string): Promise<Record<string, unknown>> {
    const result = await runPythonScript('performance.py', [csvFilePath]);
    return result;
  }

  /**
   * Analyze all stores in Nash CSV (returns array of store metrics)
   */
  static async analyzeAllStores(csvFilePath: string): Promise<Record<string, unknown>> {
    const { registryPath, rateCardsPath } = await this.createTempFiles();

    try {
      const result = await runPythonScript('all_stores.py', [
        csvFilePath,
        registryPath,
        rateCardsPath
      ]);
      return result;
    } finally {
      this.cleanupTempFiles(registryPath, rateCardsPath);
    }
  }

  /**
   * Analyze week-over-week metrics with anomaly exclusion
   */
  static async analyzeWeeklyMetrics(csvFilePath: string): Promise<Record<string, unknown>> {
    const { registryPath, rateCardsPath } = await this.createTempFiles();

    try {
      const result = await runPythonScript('weekly_metrics.py', [
        csvFilePath,
        rateCardsPath
      ]);
      return result;
    } finally {
      this.cleanupTempFiles(registryPath, rateCardsPath);
    }
  }
}
