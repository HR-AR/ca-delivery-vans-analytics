/**
 * CA Delivery Vans Analytics - Dashboard Handler
 * Phase 4: Interactive Chart.js Visualizations
 */

// ==========================================
// Global Variables & Chart Instances
// ==========================================

let totalOrdersChart = null;
let cpdChart = null;
let otdChart = null;
let vendorChart = null;
let batchDensityChart = null;

// API Configuration
const API_BASE_URL = '';
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;

// Chart Color Scheme
const COLORS = {
    blue: '#1e40af',
    green: '#10b981',
    red: '#ef4444',
    yellow: '#f59e0b',
    purple: '#8b5cf6',
    orange: '#f97316',
    teal: '#14b8a6',
    pink: '#ec4899',
    gray: '#6b7280'
};

// ==========================================
// API Client Functions
// ==========================================

/**
 * Fetch data from API with retry logic
 */
async function fetchWithRetry(url, retries = MAX_RETRIES) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            if (i === retries - 1) throw error;

            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

/**
 * Fetch dashboard overview data
 */
async function fetchDashboardData() {
    return await fetchWithRetry(`${API_BASE_URL}/api/analytics/dashboard`);
}

/**
 * Fetch stores analytics
 */
async function fetchStoresData() {
    return await fetchWithRetry(`${API_BASE_URL}/api/analytics/stores`);
}

/**
 * Fetch CPD comparison data
 */
async function fetchCPDComparisonData() {
    return await fetchWithRetry(`${API_BASE_URL}/api/analytics/cpd-comparison`);
}

/**
 * Fetch vendor performance data
 */
async function fetchVendorsData() {
    return await fetchWithRetry(`${API_BASE_URL}/api/analytics/vendors`);
}

/**
 * Fetch batch analysis data
 */
async function fetchBatchAnalysisData() {
    return await fetchWithRetry(`${API_BASE_URL}/api/analytics/batch-analysis`);
}

// ==========================================
// Loading & Error State Management
// ==========================================

/**
 * Show loading spinner on chart
 */
function showChartLoading(chartId) {
    const placeholder = document.getElementById(`chart${chartId}`);
    if (placeholder) {
        placeholder.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                <div class="loading-spinner-small"></div>
                <div style="margin-top: 10px; color: #6b7280; font-size: 0.875rem;">Loading data...</div>
            </div>
        `;
        placeholder.classList.remove('hidden');
    }
}

/**
 * Show error state on chart
 */
function showChartError(chartId, message) {
    const placeholder = document.getElementById(`chart${chartId}`);
    if (placeholder) {
        placeholder.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 20px;">
                <div style="font-size: 2rem; color: #ef4444; margin-bottom: 10px;">⚠️</div>
                <div style="color: #991b1b; font-weight: 600; margin-bottom: 5px;">Error Loading Chart</div>
                <div style="color: #6b7280; font-size: 0.875rem;">${message}</div>
            </div>
        `;
        placeholder.classList.remove('hidden');
    }
}

/**
 * Hide chart placeholder and show canvas
 */
function showChartCanvas(chartId) {
    const placeholder = document.getElementById(`chart${chartId}`);
    const canvas = document.getElementById(`${chartId}Chart`);

    if (placeholder) placeholder.classList.add('hidden');
    if (canvas) canvas.classList.remove('hidden');
}

// ==========================================
// Chart 1: Total Orders by Store (Line Chart)
// ==========================================

/**
 * Initialize Total Orders Over Time chart
 */
async function initTotalOrdersChart() {
    const chartId = 'TotalOrders';
    const canvasId = 'totalOrdersChart';

    try {
        showChartLoading(chartId);

        const response = await fetchStoresData();

        // Python returns raw JSON: { stores: [...] }
        if (!response || !response.stores) {
            showChartError(chartId, 'No store data available. Please upload Nash data first.');
            return;
        }

        // Ensure stores is an array
        const storesArray = Array.isArray(response.stores) ? response.stores : [];

        if (storesArray.length === 0) {
            showChartError(chartId, 'No store data available. Please upload Nash data first.');
            return;
        }

        // Get top 10 stores by total orders
        const sortedStores = storesArray
            .filter(store => store.total_trips > 0) // Has trip data
            .sort((a, b) => (b.total_orders || 0) - (a.total_orders || 0))
            .slice(0, 10);

        if (sortedStores.length === 0) {
            showChartError(chartId, 'No stores with trip data found.');
            return;
        }

        // Prepare datasets for each store
        const datasets = sortedStores.map((store, index) => ({
            label: `Store ${store.store_id}`,
            data: [store.total_orders],
            borderColor: Object.values(COLORS)[index % Object.values(COLORS).length],
            backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] + '20',
            tension: 0.4,
            fill: false
        }));

        showChartCanvas(chartId);
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');

        if (totalOrdersChart) totalOrdersChart.destroy();

        totalOrdersChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Total Orders'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            boxWidth: 15,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} orders`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Orders'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing Total Orders chart:', error);
        showChartError(chartId, error.message || 'Failed to load chart data');
    }
}

// ==========================================
// Chart 2: CPD Comparison (Bar Chart)
// ==========================================

/**
 * Initialize CPD Comparison chart
 */
async function initCPDChart() {
    const chartId = 'CPD';
    const canvasId = 'cpdChart';

    try {
        showChartLoading(chartId);

        const response = await fetchCPDComparisonData();

        // Python returns raw JSON: { stores: [...] }
        if (!response || !response.stores || response.stores.length === 0) {
            showChartError(chartId, 'No CPD data available.');
            return;
        }

        // Ensure stores is an array
        const storesArray = Array.isArray(response.stores) ? response.stores : [];

        // Get top 10 stores by order volume
        const sortedStores = storesArray
            .sort((a, b) => (b.van_orders || 0) - (a.van_orders || 0))
            .slice(0, 10);

        const labels = sortedStores.map(store => `Store ${store.store_id}`);
        const vanCPD = sortedStores.map(store => store.van_cpd || 0);
        const sparkCPD = sortedStores.map(store => store.spark_cpd || 0);

        // Color bars based on whether they exceed $5 target
        const vanColors = vanCPD.map(cpd => cpd > 5 ? COLORS.red : COLORS.blue);
        const sparkColors = sparkCPD.map(cpd => cpd > 5 ? COLORS.red : COLORS.green);

        showChartCanvas(chartId);
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');

        if (cpdChart) cpdChart.destroy();

        cpdChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Van CPD',
                        data: vanCPD,
                        backgroundColor: vanColors,
                        borderColor: vanColors,
                        borderWidth: 1
                    },
                    {
                        label: 'Spark CPD',
                        data: sparkCPD,
                        backgroundColor: sparkColors,
                        borderColor: sparkColors,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const status = value > 5 ? '⚠️ Over target' : '✓ Within target';
                                return `${context.dataset.label}: $${value.toFixed(2)} ${status}`;
                            }
                        }
                    },
                    annotation: {
                        annotations: {
                            targetLine: {
                                type: 'line',
                                yMin: 5,
                                yMax: 5,
                                borderColor: COLORS.red,
                                borderWidth: 2,
                                borderDash: [5, 5],
                                label: {
                                    content: '$5.00 Target',
                                    enabled: true,
                                    position: 'end'
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cost Per Delivery ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Store'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing CPD chart:', error);
        showChartError(chartId, error.message || 'Failed to load chart data');
    }
}

// ==========================================
// Chart 3: OTD % by Carrier (Stacked Bar Chart)
// ==========================================

/**
 * Initialize OTD % by Carrier chart
 */
async function initOTDChart() {
    const chartId = 'OTD';
    const canvasId = 'otdChart';

    try {
        showChartLoading(chartId);

        const response = await fetchVendorsData();

        // Python returns raw JSON: { FOX: {...}, NTG: {...}, FDC: {...} }
        if (!response || Object.keys(response).length === 0) {
            showChartError(chartId, 'No vendor data available.');
            return;
        }

        // Convert object to array
        const vendors = Object.keys(response).map(carrier => ({
            carrier: carrier,
            otd_percentage: response[carrier].otd_percentage || 0
        }));

        const labels = vendors.map(v => v.carrier);
        const ontimePercentages = vendors.map(v => v.otd_percentage || 0);
        const latePercentages = vendors.map(v => 100 - (v.otd_percentage || 0));

        showChartCanvas(chartId);
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');

        if (otdChart) otdChart.destroy();

        otdChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'On-Time',
                        data: ontimePercentages,
                        backgroundColor: COLORS.green,
                        borderColor: COLORS.green,
                        borderWidth: 1
                    },
                    {
                        label: 'Late',
                        data: latePercentages,
                        backgroundColor: COLORS.red,
                        borderColor: COLORS.red,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Carrier'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Percentage (%)'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing OTD chart:', error);
        showChartError(chartId, error.message || 'Failed to load chart data');
    }
}

// ==========================================
// Chart 4: Vendor Performance (Horizontal Bar Chart)
// ==========================================

/**
 * Initialize Vendor Performance chart
 */
async function initVendorChart() {
    const chartId = 'Vendor';
    const canvasId = 'vendorChart';

    try {
        showChartLoading(chartId);

        const response = await fetchVendorsData();

        // Python returns raw JSON: { FOX: {...}, NTG: {...}, FDC: {...} }
        if (!response || Object.keys(response).length === 0) {
            showChartError(chartId, 'No vendor data available.');
            return;
        }

        // Convert object to array
        const vendors = Object.keys(response).map(carrier => ({
            carrier: carrier,
            avg_cpd: response[carrier].avg_cpd || 0
        }));

        const labels = vendors.map(v => v.carrier);

        // Calculate average CPD as performance metric
        const avgCPD = vendors.map(v => v.avg_cpd || 0);

        // Color code based on performance thresholds
        const colors = avgCPD.map(cpd => {
            if (cpd < 4) return COLORS.green;
            if (cpd < 5) return COLORS.yellow;
            return COLORS.red;
        });

        showChartCanvas(chartId);
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');

        if (vendorChart) vendorChart.destroy();

        vendorChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average CPD',
                    data: avgCPD,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.x;
                                let rating = '';
                                if (value < 4) rating = '✓ Excellent';
                                else if (value < 5) rating = '~ Good';
                                else rating = '⚠️ Needs Improvement';
                                return `Average CPD: $${value.toFixed(2)} ${rating}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Average Cost Per Delivery ($)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Vendor'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing Vendor chart:', error);
        showChartError(chartId, error.message || 'Failed to load chart data');
    }
}

// ==========================================
// Chart 5: Batch Density (Scatter Plot)
// ==========================================

/**
 * Initialize Batch Density chart
 */
async function initBatchDensityChart() {
    const chartId = 'BatchDensity';
    const canvasId = 'batchDensityChart';

    try {
        showChartLoading(chartId);

        const response = await fetchBatchAnalysisData();

        // Python returns raw JSON: { batches: [...] }
        if (!response || !response.batches || response.batches.length === 0) {
            showChartError(chartId, 'No batch data available.');
            return;
        }

        const batches = response.batches;

        // Group by carrier for different colors
        const carrierData = {};
        batches.forEach(batch => {
            const carrier = batch.carrier || 'Unknown';
            if (!carrierData[carrier]) {
                carrierData[carrier] = [];
            }
            carrierData[carrier].push({
                x: batch.batch_size || 0,
                y: batch.cpd || 0
            });
        });

        const datasets = Object.entries(carrierData).map(([carrier, data], index) => ({
            label: carrier,
            data: data,
            backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length],
            borderColor: Object.values(COLORS)[index % Object.values(COLORS).length],
            pointRadius: 5,
            pointHoverRadius: 7
        }));

        showChartCanvas(chartId);
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');

        if (batchDensityChart) batchDensityChart.destroy();

        batchDensityChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: Batch Size ${context.parsed.x}, CPD $${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Batch Size (orders per batch)'
                        },
                        beginAtZero: true
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Cost Per Delivery ($)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error initializing Batch Density chart:', error);
        showChartError(chartId, error.message || 'Failed to load chart data');
    }
}

// ==========================================
// Key Highlights / KPI Updates
// ==========================================

/**
 * Update key performance indicators
 */
async function updateHighlights() {
    try {
        const response = await fetchDashboardData();

        // Python returns raw JSON with snake_case fields
        if (!response || !response.total_orders) {
            showNoDataMessage();
            return;
        }

        const data = response; // Use response directly
        const highlights = document.querySelectorAll('.highlight-card');

        // Update Total Orders (snake_case from Python)
        if (highlights[0]) {
            highlights[0].querySelector('.highlight-value').textContent =
                data.total_orders?.toLocaleString() || '--';
        }

        // Update Average CPD (use avg_van_cpd)
        if (highlights[1]) {
            const avgCpd = data.avg_van_cpd || 0;
            const cpdColor = avgCpd > 5 ? COLORS.red : avgCpd > 4 ? COLORS.yellow : COLORS.green;
            const valueEl = highlights[1].querySelector('.highlight-value');
            valueEl.textContent = `$${avgCpd.toFixed(2)}`;
            valueEl.style.color = cpdColor;
        }

        // Update OTD % (snake_case)
        if (highlights[2]) {
            const otd = data.otd_percentage || 0;
            const otdColor = otd >= 95 ? COLORS.green : otd >= 90 ? COLORS.yellow : COLORS.red;
            const valueEl = highlights[2].querySelector('.highlight-value');
            valueEl.textContent = `${otd.toFixed(1)}%`;
            valueEl.style.color = otdColor;
        }

        // Update Active Stores (active_stores from Python)
        if (highlights[3]) {
            highlights[3].querySelector('.highlight-value').textContent =
                data.active_stores?.toLocaleString() || '--';
        }

        // Update Total Batches (calculate from stores data)
        if (highlights[4]) {
            const storesResponse = await fetchStoresData();
            const totalBatches = storesResponse && storesResponse.stores
                ? storesResponse.stores.reduce((sum, store) => sum + (store.metrics?.total_batches || 0), 0)
                : 0;
            highlights[4].querySelector('.highlight-value').textContent =
                totalBatches.toLocaleString();
        }

        // Update data summary
        updateDataSummary(data);

    } catch (error) {
        console.error('Error updating highlights:', error);
        showNoDataMessage();
    }
}

/**
 * Update data summary section
 */
function updateDataSummary(data) {
    const summaryEl = document.getElementById('dataSummary');
    if (!summaryEl) return;

    const dateRange = data.dateRange || {};
    const startDate = dateRange.start || 'N/A';
    const endDate = dateRange.end || 'N/A';

    summaryEl.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
                <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Date Range</div>
                <div style="color: #6b7280; font-size: 0.875rem;">${startDate} to ${endDate}</div>
            </div>
            <div>
                <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Total Orders</div>
                <div style="color: #6b7280; font-size: 0.875rem;">${(data.totalOrders || 0).toLocaleString()} orders</div>
            </div>
            <div>
                <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Active CA Stores</div>
                <div style="color: #6b7280; font-size: 0.875rem;">${data.caStoreCount || 0} stores</div>
            </div>
            <div>
                <div style="font-weight: 600; color: #374151; margin-bottom: 0.25rem;">Last Updated</div>
                <div style="color: #6b7280; font-size: 0.875rem;">${new Date().toLocaleString()}</div>
            </div>
        </div>
    `;
}

/**
 * Show no data available message
 */
function showNoDataMessage() {
    const summaryEl = document.getElementById('dataSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <p class="text-muted text-center">
                No data available. Please upload a CSV file to view analytics.
            </p>
            <div class="text-center mt-2">
                <a href="index.html" class="btn btn-primary">Upload Data</a>
            </div>
        `;
    }
}

// ==========================================
// Dashboard Initialization & Refresh
// ==========================================

/**
 * Initialize all charts and highlights
 */
async function initDashboard() {
    console.log('Initializing dashboard...');

    try {
        // Update KPIs first
        await updateHighlights();

        // Initialize all charts in parallel
        await Promise.all([
            initTotalOrdersChart(),
            initCPDChart(),
            initOTDChart(),
            initVendorChart(),
            initBatchDensityChart()
        ]);

        console.log('Dashboard initialization complete');
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

/**
 * Refresh dashboard data
 */
async function refreshDashboard() {
    console.log('Refreshing dashboard...');

    // Destroy existing charts
    if (totalOrdersChart) totalOrdersChart.destroy();
    if (cpdChart) cpdChart.destroy();
    if (otdChart) otdChart.destroy();
    if (vendorChart) vendorChart.destroy();
    if (batchDensityChart) batchDensityChart.destroy();

    // Reinitialize
    await initDashboard();
}

/**
 * Add refresh button functionality
 */
function initRefreshButton() {
    // Create refresh button if it doesn't exist
    const header = document.querySelector('.header-content');
    if (header && !document.getElementById('refreshBtn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refreshBtn';
        refreshBtn.className = 'btn btn-secondary';
        refreshBtn.innerHTML = '🔄 Refresh Data';
        refreshBtn.style.marginLeft = 'auto';
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '🔄 Refreshing...';
            await refreshDashboard();
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Refresh Data';
        });

        // Insert before nav
        const nav = header.querySelector('.nav');
        if (nav) {
            header.insertBefore(refreshBtn, nav);
        }
    }
}

/**
 * Handle window resize for responsive charts
 */
function handleResize() {
    if (totalOrdersChart) totalOrdersChart.resize();
    if (cpdChart) cpdChart.resize();
    if (otdChart) otdChart.resize();
    if (vendorChart) vendorChart.resize();
    if (batchDensityChart) batchDensityChart.resize();
}

// ==========================================
// Event Listeners & Initialization
// ==========================================

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard page loaded');
    initRefreshButton();
    await initDashboard();
});

// Handle window resize
window.addEventListener('resize', handleResize);

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initDashboard,
        refreshDashboard,
        updateHighlights,
        initTotalOrdersChart,
        initCPDChart,
        initOTDChart,
        initVendorChart,
        initBatchDensityChart
    };
}
