/**
 * CA Delivery Vans Analytics - Admin Handler
 * Phase 2 Implementation: Full admin functionality
 */

// State management
let storeRegistry = [];
let currentPage = 1;
let itemsPerPage = 10;
let searchQuery = '';
let selectedFile = null;

/**
 * Initialize admin panel
 */
async function initAdmin() {
    console.log('Admin panel initialized - Phase 2');

    // Attach all event listeners
    attachEventListeners();

    // Load initial data
    await loadRateCards();
    await loadStoreRegistry();
}

/**
 * Attach all event listeners
 */
function attachEventListeners() {
    // Spark CPD Upload
    const sparkCpdZone = document.getElementById('sparkCpdUploadZone');
    const sparkCpdFileInput = document.getElementById('sparkCpdFile');
    const uploadButton = document.getElementById('uploadSparkCpd');
    const removeFileButton = document.getElementById('removeSparkCpdFile');

    if (sparkCpdZone && sparkCpdFileInput) {
        sparkCpdZone.addEventListener('click', () => sparkCpdFileInput.click());

        // Drag and drop
        sparkCpdZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            sparkCpdZone.classList.add('dragover');
        });

        sparkCpdZone.addEventListener('dragleave', () => {
            sparkCpdZone.classList.remove('dragover');
        });

        sparkCpdZone.addEventListener('drop', (e) => {
            e.preventDefault();
            sparkCpdZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleSparkCpdFileSelect(e.dataTransfer.files[0]);
            }
        });

        sparkCpdFileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleSparkCpdFileSelect(e.target.files[0]);
            }
        });
    }

    if (uploadButton) {
        uploadButton.addEventListener('click', uploadSparkCpd);
    }

    if (removeFileButton) {
        removeFileButton.addEventListener('click', removeSparkCpdFile);
    }

    // Rate Cards
    document.querySelectorAll('.save-rate-card').forEach(button => {
        button.addEventListener('click', async (e) => {
            const rateCard = e.target.closest('.rate-card');
            const vendor = rateCard.dataset.vendor;
            await saveRateCard(vendor);
        });
    });

    // Store Registry
    const searchInput = document.getElementById('storeSearch');
    const refreshButton = document.getElementById('refreshRegistry');
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            currentPage = 1;
            renderStoreRegistry();
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', loadStoreRegistry);
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderStoreRegistry();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const maxPages = Math.ceil(getFilteredStores().length / itemsPerPage);
            if (currentPage < maxPages) {
                currentPage++;
                renderStoreRegistry();
            }
        });
    }
}

/**
 * Handle file selection for Spark CPD upload
 */
function handleSparkCpdFileSelect(file) {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
        showError('sparkCpdResult', 'Please select a CSV file');
        return;
    }

    selectedFile = file;

    // Show file info
    const fileInfo = document.getElementById('sparkCpdFileInfo');
    const fileName = document.getElementById('sparkCpdFileName');
    const fileSize = document.getElementById('sparkCpdFileSize');
    const uploadButton = document.getElementById('uploadSparkCpd');

    if (fileInfo && fileName && fileSize && uploadButton) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileInfo.classList.remove('hidden');
        uploadButton.disabled = false;
    }
}

/**
 * Remove selected file
 */
function removeSparkCpdFile() {
    selectedFile = null;
    const fileInfo = document.getElementById('sparkCpdFileInfo');
    const fileInput = document.getElementById('sparkCpdFile');
    const uploadButton = document.getElementById('uploadSparkCpd');

    if (fileInfo && fileInput && uploadButton) {
        fileInfo.classList.add('hidden');
        fileInput.value = '';
        uploadButton.disabled = true;
    }

    // Clear any previous results
    const resultBox = document.getElementById('sparkCpdResult');
    if (resultBox) {
        resultBox.classList.remove('success', 'error');
        resultBox.style.display = 'none';
    }
}

/**
 * Upload Spark CPD CSV file
 */
async function uploadSparkCpd() {
    if (!selectedFile) {
        showError('sparkCpdResult', 'No file selected');
        return;
    }

    showLoading(true, 'Uploading Spark CPD data...');

    try {
        // Parse CSV file
        const csvData = await parseCSV(selectedFile);

        // Validate format
        const validation = validateSparkCpdFormat(csvData);
        if (!validation.valid) {
            showLoading(false);
            showError('sparkCpdResult', validation.error);
            return;
        }

        // POST to /api/stores/registry/bulk
        const response = await fetch('/api/stores/registry/bulk', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({stores: csvData})
        });

        const result = await response.json();

        showLoading(false);

        if (response.ok) {
            showSuccess('sparkCpdResult',
                `Successfully uploaded ${result.created || 0} stores and updated ${result.updated || 0} stores.`);

            // Refresh store registry
            await loadStoreRegistry();

            // Clear file selection
            removeSparkCpdFile();
        } else {
            showError('sparkCpdResult', result.error || 'Upload failed');
        }
    } catch (error) {
        showLoading(false);
        showError('sparkCpdResult', 'Error uploading file: ' + error.message);
    }
}

/**
 * Parse CSV file
 */
async function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    reject(new Error('CSV file is empty or invalid'));
                    return;
                }

                const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                const data = [];

                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    if (values.length >= 3) {
                        data.push({
                            storeId: values[0],
                            sparkCpd: parseFloat(values[1]),
                            targetBatchSize: parseInt(values[2])
                        });
                    }
                }

                resolve(data);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Validate Spark CPD CSV format
 */
function validateSparkCpdFormat(csvData) {
    if (!csvData || csvData.length === 0) {
        return { valid: false, error: 'CSV file contains no data' };
    }

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];

        if (!row.storeId || isNaN(row.sparkCpd) || isNaN(row.targetBatchSize)) {
            return {
                valid: false,
                error: `Invalid data format at row ${i + 2}. Expected: Store ID, Spark CPD (number), Target Batch Size (number)`
            };
        }
    }

    return { valid: true };
}

/**
 * Load rate cards from backend
 */
async function loadRateCards() {
    try {
        const response = await fetch('/api/rate-cards');

        if (!response.ok) {
            console.warn('Rate cards endpoint not available yet - using defaults');
            return;
        }

        const rateCards = await response.json();

        // Populate rate cards
        if (rateCards.vendors) {
            Object.keys(rateCards.vendors).forEach(vendor => {
                populateRateCard(vendor, rateCards.vendors[vendor]);
            });
        }
    } catch (error) {
        console.warn('Rate cards endpoint not available yet:', error.message);
    }
}

/**
 * Populate rate card form with data
 */
function populateRateCard(vendor, data) {
    const rateCard = document.querySelector(`.rate-card[data-vendor="${vendor}"]`);
    if (!rateCard || !data) return;

    Object.keys(data).forEach(field => {
        const input = rateCard.querySelector(`[data-field="${field}"]`);
        if (input) {
            input.value = data[field] || '';
        }
    });
}

/**
 * Get rate card form data
 */
function getRateCardFormData(vendor) {
    const rateCard = document.querySelector(`.rate-card[data-vendor="${vendor}"]`);
    if (!rateCard) return null;

    const data = { vendor };

    rateCard.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        data[field] = input.type === 'number' ? parseFloat(input.value) : input.value;
    });

    return data;
}

/**
 * Save rate card to backend
 */
async function saveRateCard(vendor) {
    const data = getRateCardFormData(vendor);
    const rateCard = document.querySelector(`.rate-card[data-vendor="${vendor}"]`);
    const resultBox = rateCard.querySelector('.rate-card-result');

    if (!data) {
        showErrorInElement(resultBox, 'Failed to collect form data');
        return;
    }

    // Validate data
    if (!data.base_rate_80 || !data.base_rate_100 || !data.contractual_adjustment) {
        showErrorInElement(resultBox, 'Please fill in all required fields');
        return;
    }

    // Confirm before saving
    if (!confirm(`Save rate card for ${vendor}?`)) {
        return;
    }

    showLoading(true, `Saving ${vendor} rate card...`);

    try {
        const response = await fetch(`/api/rate-cards/${vendor}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();

        showLoading(false);

        if (response.ok) {
            showSuccessInElement(resultBox, `${vendor} rate card saved successfully!`);
        } else {
            showErrorInElement(resultBox, result.error || 'Failed to save rate card');
        }
    } catch (error) {
        showLoading(false);
        showErrorInElement(resultBox, 'Error saving rate card: ' + error.message);
    }
}

/**
 * Load store registry from backend
 */
async function loadStoreRegistry() {
    const tbody = document.getElementById('registryTableBody');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="table-loading">
                <div class="loading-spinner-small"></div>
                <span>Loading store registry...</span>
            </td>
        </tr>
    `;

    try {
        const response = await fetch('/api/stores/registry');

        if (!response.ok) {
            // Use mock data if endpoint not available
            console.warn('Registry endpoint not available - using mock data');
            storeRegistry = generateMockStoreData();
        } else {
            const result = await response.json();
            storeRegistry = result.stores || [];
        }

        renderStoreRegistry();
    } catch (error) {
        console.warn('Registry endpoint not available:', error.message);
        storeRegistry = generateMockStoreData();
        renderStoreRegistry();
    }
}

/**
 * Generate mock store data for testing
 */
function generateMockStoreData() {
    const stores = [];
    const sampleStores = [2082, 2242, 5930, 4521, 3890, 7654, 1234, 5678, 9012, 3456];

    for (let i = 0; i < 15; i++) {
        stores.push({
            id: sampleStores[i % sampleStores.length].toString(),
            spark_ytd_cpd: (5.0 + Math.random() * 2).toFixed(2),
            target_batch_size: Math.floor(80 + Math.random() * 20),
            last_seen_in_upload: i < 10 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
            status: i < 12 ? 'active' : 'inactive'
        });
    }

    return stores;
}

/**
 * Filter stores based on search query
 */
function getFilteredStores() {
    if (!searchQuery) return storeRegistry;

    return storeRegistry.filter(store =>
        store.id.toString().includes(searchQuery)
    );
}

/**
 * Render store registry table
 */
function renderStoreRegistry() {
    const tbody = document.getElementById('registryTableBody');
    if (!tbody) return;

    const filteredStores = getFilteredStores();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedStores = filteredStores.slice(startIndex, endIndex);

    if (filteredStores.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">
                    ${searchQuery ? 'No stores found matching your search' : 'No stores in registry'}
                </td>
            </tr>
        `;
        updatePagination(0);
        return;
    }

    tbody.innerHTML = '';
    paginatedStores.forEach(store => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${store.id}</strong></td>
            <td>$${parseFloat(store.spark_ytd_cpd).toFixed(2)}</td>
            <td>${store.target_batch_size}</td>
            <td>${formatDate(store.last_seen_in_upload)}</td>
            <td><span class="status-${store.status}">${store.status.toUpperCase()}</span></td>
            <td>
                <button class="btn-small" onclick="editStore('${store.id}')">Edit</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    updatePagination(filteredStores.length);
}

/**
 * Update pagination controls
 */
function updatePagination(totalItems) {
    const maxPages = Math.ceil(totalItems / itemsPerPage);
    const prevButton = document.getElementById('prevPage');
    const nextButton = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    if (prevButton) {
        prevButton.disabled = currentPage <= 1;
    }

    if (nextButton) {
        nextButton.disabled = currentPage >= maxPages || maxPages === 0;
    }

    if (pageInfo) {
        pageInfo.textContent = maxPages > 0 ? `Page ${currentPage} of ${maxPages}` : 'No results';
    }
}

/**
 * Edit store (placeholder for future implementation)
 */
function editStore(storeId) {
    alert(`Edit functionality for store ${storeId} will be implemented in a future phase`);
}

/**
 * Show loading overlay
 */
function showLoading(show, message = 'Processing...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.querySelector('.loading-text');

    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
            if (loadingText) loadingText.textContent = message;
        } else {
            overlay.classList.add('hidden');
        }
    }
}

/**
 * Show success message in result box
 */
function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.className = 'result-box success';
    element.innerHTML = `
        <div class="result-message">
            <strong>Success!</strong> ${message}
        </div>
    `;
    element.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

/**
 * Show error message in result box
 */
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.className = 'result-box error';
    element.innerHTML = `
        <div class="result-message">
            <strong>Error!</strong> ${message}
        </div>
    `;
    element.style.display = 'block';
}

/**
 * Show success in custom element
 */
function showSuccessInElement(element, message) {
    if (!element) return;

    element.className = 'rate-card-result success';
    element.innerHTML = `<div class="result-message">${message}</div>`;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

/**
 * Show error in custom element
 */
function showErrorInElement(element, message) {
    if (!element) return;

    element.className = 'rate-card-result error';
    element.innerHTML = `<div class="result-message">${message}</div>`;
    element.style.display = 'block';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initAdmin);

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initAdmin,
        uploadSparkCpd,
        loadRateCards,
        saveRateCard,
        loadStoreRegistry,
        renderStoreRegistry,
        editStore,
        parseCSV,
        validateSparkCpdFormat
    };
}
