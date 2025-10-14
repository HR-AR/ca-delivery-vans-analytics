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

// Phase 2: Store Registry Types
export interface StoreRegistry {
  stores: {
    [storeId: string]: {
      spark_ytd_cpd: number;
      target_batch_size: number;
      last_seen_in_upload?: string;
      status: 'active' | 'inactive';
      metadata?: {
        city?: string;
        state?: string;
        store_name?: string;
      };
    };
  };
  last_updated: string;
  version: string;
}

export interface StoreRegistryResponse {
  success: boolean;
  registry?: StoreRegistry;
  error?: string;
}

export interface StoreBulkUploadRequest {
  stores: Array<{
    storeId: string;
    sparkCpd: number;
    targetBatchSize: number;
  }>;
}

export interface StoreBulkUploadResponse {
  success: boolean;
  updated: number;
  errors: string[];
  registry?: StoreRegistry;
}

export interface StoreDetailResponse {
  success: boolean;
  store?: {
    storeId: string;
    spark_ytd_cpd: number;
    target_batch_size: number;
    last_seen_in_upload?: string;
    status: 'active' | 'inactive';
    metadata?: {
      city?: string;
      state?: string;
      store_name?: string;
    };
  };
  error?: string;
}

// Phase 2: Rate Card Types
export interface RateCards {
  vendors: {
    [vendor: string]: {
      base_rate_80: number;
      base_rate_100: number;
      contractual_adjustment: number;
      notes?: string;
      last_updated: string;
    };
  };
  version: string;
  currency: string;
}

export interface RateCardsResponse {
  success: boolean;
  rateCards?: RateCards;
  error?: string;
}

export interface VendorRateCardResponse {
  success: boolean;
  vendor?: string;
  rateCard?: {
    base_rate_80: number;
    base_rate_100: number;
    contractual_adjustment: number;
    notes?: string;
    last_updated: string;
  };
  error?: string;
}

export interface UpdateRateCardRequest {
  base_rate_80: number;
  base_rate_100: number;
  contractual_adjustment: number;
  notes?: string;
}

// Nash Data for store merging
export interface NashData {
  stores: {
    [storeId: string]: {
      totalOrders?: number;
      deliveredOrders?: number;
    };
  };
}
