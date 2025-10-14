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
  success: false;
  error: string;
}
