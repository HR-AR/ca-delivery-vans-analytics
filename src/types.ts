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
}

export interface ErrorResponse {
  success: boolean;
  error: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    totalRows: number;
    nonCAStores: number;
    unknownCarriers: string[];
  };
}
