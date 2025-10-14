import fs from 'fs';
import path from 'path';

// Type definitions
export interface StoreInfo {
  spark_ytd_cpd?: number;
  target_batch_size?: number;
  last_seen_in_upload?: string;
  status: 'active' | 'inactive';
}

export interface StoreRegistry {
  stores: Record<string, StoreInfo>;
  last_updated: string;
  version: string;
}

export interface RateCard {
  base_rate_80: number;
  base_rate_100: number;
  contractual_adjustment: number;
  notes?: string;
}

export interface RateCards {
  vendors: Record<string, RateCard>;
  last_updated: string;
  version: string;
}

// Constants
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_REGISTRY_FILE = path.join(DATA_DIR, 'store-registry.json');
const RATE_CARDS_FILE = path.join(DATA_DIR, 'rate-cards.json');

// Ensure data directory exists
function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Load Store Registry from disk
 */
export async function loadStoreRegistry(): Promise<StoreRegistry> {
  ensureDataDirectory();

  if (!fs.existsSync(STORE_REGISTRY_FILE)) {
    // Return default empty registry
    return {
      stores: {},
      last_updated: new Date().toISOString(),
      version: '1.0'
    };
  }

  const content = fs.readFileSync(STORE_REGISTRY_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save Store Registry to disk
 */
export async function saveStoreRegistry(registry: StoreRegistry): Promise<void> {
  ensureDataDirectory();

  // Create backup before saving
  if (fs.existsSync(STORE_REGISTRY_FILE)) {
    const backupFile = `${STORE_REGISTRY_FILE}.bak`;
    fs.copyFileSync(STORE_REGISTRY_FILE, backupFile);
  }

  // Update last_updated timestamp
  registry.last_updated = new Date().toISOString();

  // Write to file
  fs.writeFileSync(STORE_REGISTRY_FILE, JSON.stringify(registry, null, 2));
}

/**
 * Merge store data from new upload into existing registry
 */
export async function mergeStoreData(
  existing: StoreRegistry,
  newUpload: { stores: Array<{ storeId: string; orders?: number }>; uploadDate: string }
): Promise<StoreRegistry> {
  const merged: StoreRegistry = {
    ...existing,
    last_updated: new Date().toISOString()
  };

  // Update stores that are in the new upload
  for (const store of newUpload.stores) {
    if (merged.stores[store.storeId]) {
      // Update existing store - keep Spark data but update last_seen
      merged.stores[store.storeId].last_seen_in_upload = newUpload.uploadDate;
      merged.stores[store.storeId].status = 'active';
    } else {
      // New store in upload - create with minimal data
      merged.stores[store.storeId] = {
        last_seen_in_upload: newUpload.uploadDate,
        status: 'active'
      };
    }
  }

  // Stores not in the upload keep their old last_seen date
  // (They are NOT marked inactive, just remain with old timestamp)

  return merged;
}

/**
 * Load Rate Cards from disk
 */
export async function loadRateCards(): Promise<RateCards> {
  ensureDataDirectory();

  if (!fs.existsSync(RATE_CARDS_FILE)) {
    // Return default rate cards
    return {
      vendors: {
        FOX: {
          base_rate_80: 380.00,
          base_rate_100: 390.00,
          contractual_adjustment: 1.00,
          notes: 'Default FOX rates'
        },
        NTG: {
          base_rate_80: 380.00,
          base_rate_100: 390.00,
          contractual_adjustment: 1.00,
          notes: 'Default NTG rates'
        },
        FDC: {
          base_rate_80: 380.00,
          base_rate_100: 390.00,
          contractual_adjustment: 1.00,
          notes: 'Default FDC rates'
        }
      },
      last_updated: new Date().toISOString(),
      version: '1.0'
    };
  }

  const content = fs.readFileSync(RATE_CARDS_FILE, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save Rate Cards to disk
 */
export async function saveRateCards(rateCards: RateCards): Promise<void> {
  ensureDataDirectory();

  // Validate rate card data
  for (const [vendor, card] of Object.entries(rateCards.vendors)) {
    if (typeof card.base_rate_80 !== 'number' || card.base_rate_80 < 0) {
      throw new Error(`Invalid base_rate_80 for vendor ${vendor}`);
    }
    if (typeof card.base_rate_100 !== 'number' || card.base_rate_100 < 0) {
      throw new Error(`Invalid base_rate_100 for vendor ${vendor}`);
    }
    if (typeof card.contractual_adjustment !== 'number' || card.contractual_adjustment < 0) {
      throw new Error(`Invalid contractual_adjustment for vendor ${vendor}`);
    }
  }

  // Update last_updated timestamp
  rateCards.last_updated = new Date().toISOString();

  // Write to file
  fs.writeFileSync(RATE_CARDS_FILE, JSON.stringify(rateCards, null, 2));
}

/**
 * Update a single store in the registry
 */
export async function updateStore(
  storeId: string,
  updates: Partial<StoreInfo>
): Promise<void> {
  const registry = await loadStoreRegistry();

  if (!registry.stores[storeId]) {
    registry.stores[storeId] = { status: 'active' };
  }

  registry.stores[storeId] = {
    ...registry.stores[storeId],
    ...updates
  };

  await saveStoreRegistry(registry);
}

/**
 * Get a single store from registry
 */
export async function getStore(storeId: string): Promise<StoreInfo | null> {
  const registry = await loadStoreRegistry();
  return registry.stores[storeId] || null;
}

/**
 * Update a single vendor's rate card
 */
export async function updateRateCard(
  vendor: string,
  updates: Partial<RateCard>
): Promise<void> {
  const rateCards = await loadRateCards();

  if (!rateCards.vendors[vendor]) {
    throw new Error(`Vendor ${vendor} not found`);
  }

  rateCards.vendors[vendor] = {
    ...rateCards.vendors[vendor],
    ...updates
  };

  await saveRateCards(rateCards);
}

/**
 * Get a single vendor's rate card
 */
export async function getRateCard(vendor: string): Promise<RateCard | null> {
  const rateCards = await loadRateCards();
  return rateCards.vendors[vendor] || null;
}

/**
 * Bulk upload Spark CPD data for stores
 */
export async function bulkUploadSparkCPD(
  stores: Array<{ storeId: string; sparkCpd: number; targetBatchSize: number }>
): Promise<{ success: boolean; updated: number; errors: string[] }> {
  const registry = await loadStoreRegistry();
  const CA_STORES = ['2082', '2242', '5930'];
  const errors: string[] = [];
  let updated = 0;

  for (const store of stores) {
    if (!CA_STORES.includes(store.storeId)) {
      errors.push(`Store ${store.storeId} is not a CA store`);
      continue;
    }

    if (!registry.stores[store.storeId]) {
      registry.stores[store.storeId] = { status: 'active' };
    }

    registry.stores[store.storeId].spark_ytd_cpd = store.sparkCpd;
    registry.stores[store.storeId].target_batch_size = store.targetBatchSize;
    updated++;
  }

  // Save the registry even if there were errors (valid stores should be saved)
  await saveStoreRegistry(registry);

  if (errors.length > 0) {
    return { success: false, updated, errors };
  }

  return { success: true, updated, errors: [] };
}
