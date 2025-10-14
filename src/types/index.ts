export interface HealthCheckResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  filename: string;
  size: number;
  validationResult?: {
    totalRows: number;
    caStores: number;
    nonCAStoresExcluded: number;
    carriers: string[];
    warnings: string[];
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  validationErrors?: string[];
  warnings?: string[];
}
