/**
 * Weekly Metrics Page - Week-over-Week Analysis
 * Displays all metrics grouped by week with CSV export functionality
 */

const API_BASE = window.location.origin;
let weeklyData = null; // Store data for CSV export

/**
 * Initialize page on load
 */
document.addEventListener('DOMContentLoaded', () => {
    loadWeeklyMetrics();

    // Set up CSV export button
    const exportBtn = document.getElementById('exportCsvBtn');
    exportBtn.addEventListener('click', exportToCSV);
});

/**
 * Load weekly metrics from API
 */
async function loadWeeklyMetrics() {
    try {
        const response = await fetch(`${API_BASE}/api/analytics/weekly-metrics`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load weekly metrics');
        }

        const data = await response.json();
        weeklyData = data; // Store for CSV export

        renderSummary(data.summary);
        renderOverallMetrics(data.weeks);
        renderStoreMetrics(data.weeks);
        renderCarrierMetrics(data.weeks);
        renderExclusions(data.weeks);

    } catch (error) {
        console.error('Error loading weekly metrics:', error);
        showError(`Failed to load weekly metrics: ${error.message}`);
    }
}

/**
 * Render summary section
 */
function renderSummary(summary) {
    document.getElementById('totalWeeks').textContent = summary.total_weeks || 0;

    const dateRange = summary.date_range;
    if (dateRange && dateRange.start && dateRange.end) {
        document.getElementById('dateRange').textContent =
            `${dateRange.start} to ${dateRange.end}`;
    } else {
        document.getElementById('dateRange').textContent = 'N/A';
    }

    document.getElementById('minBatchSize').textContent =
        `${summary.min_batch_size || 10} orders`;
}

/**
 * Render overall metrics table
 */
function renderOverallMetrics(weeks) {
    const tbody = document.getElementById('overallMetricsBody');

    if (!weeks || weeks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #6b7280;">No data available</td></tr>';
        return;
    }

    tbody.innerHTML = weeks.map(week => `
        <tr>
            <td>${week.week_start}</td>
            <td>${week.week_end}</td>
            <td>${week.total_orders.toLocaleString()}</td>
            <td>${week.total_trips.toLocaleString()}</td>
            <td>${week.total_batches.toLocaleString()}</td>
            <td>$${week.avg_cpd.toFixed(2)}</td>
            <td>${week.active_stores}</td>
            <td>${week.excluded_trips}</td>
        </tr>
    `).join('');
}

/**
 * Render store-level metrics table (flattened by week)
 */
function renderStoreMetrics(weeks) {
    const tbody = document.getElementById('storeMetricsBody');

    if (!weeks || weeks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">No data available</td></tr>';
        return;
    }

    const rows = [];

    weeks.forEach(week => {
        if (week.stores && week.stores.length > 0) {
            week.stores.forEach(store => {
                rows.push(`
                    <tr>
                        <td>${week.week_start}</td>
                        <td>${store.store_id}</td>
                        <td>${store.orders.toLocaleString()}</td>
                        <td>${store.trips}</td>
                        <td>$${store.cpd.toFixed(2)}</td>
                    </tr>
                `);
            });
        }
    });

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">No store data available</td></tr>';
    } else {
        tbody.innerHTML = rows.join('');
    }
}

/**
 * Render carrier-level metrics table (flattened by week)
 */
function renderCarrierMetrics(weeks) {
    const tbody = document.getElementById('carrierMetricsBody');

    if (!weeks || weeks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">No data available</td></tr>';
        return;
    }

    const rows = [];

    weeks.forEach(week => {
        if (week.carriers && week.carriers.length > 0) {
            week.carriers.forEach(carrier => {
                rows.push(`
                    <tr>
                        <td>${week.week_start}</td>
                        <td>${carrier.carrier}</td>
                        <td>${carrier.orders.toLocaleString()}</td>
                        <td>${carrier.trips}</td>
                        <td>$${carrier.cpd.toFixed(2)}</td>
                    </tr>
                `);
            });
        }
    });

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">No carrier data available</td></tr>';
    } else {
        tbody.innerHTML = rows.join('');
    }
}

/**
 * Render exclusions table
 * Note: weekly_metrics.py doesn't track individual exclusions yet,
 * so we'll show excluded trip counts per week for now
 */
function renderExclusions(weeks) {
    const tbody = document.getElementById('exclusionsBody');

    if (!weeks || weeks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #6b7280;">No data available</td></tr>';
        return;
    }

    const rows = weeks.map(week => {
        if (week.excluded_trips > 0) {
            return `
                <tr>
                    <td>${week.week_start}</td>
                    <td colspan="3" style="text-align: center;">Multiple stores</td>
                    <td>${week.excluded_trips} trips</td>
                    <td>Batch size < minimum threshold</td>
                </tr>
            `;
        }
        return '';
    }).filter(row => row !== '').join('');

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #10b981;">No exclusions - all trips included</td></tr>';
    } else {
        tbody.innerHTML = rows;
    }
}

/**
 * Export data to CSV
 */
function exportToCSV() {
    if (!weeklyData || !weeklyData.weeks || weeklyData.weeks.length === 0) {
        showError('No data available to export');
        return;
    }

    const csvParts = [];

    // 1. Overall Metrics
    csvParts.push('Overall Metrics by Week');
    csvParts.push('Week Start,Week End,Total Orders,Total Trips,Total Batches,Avg CPD,Active Stores,Excluded Trips');

    weeklyData.weeks.forEach(week => {
        csvParts.push(
            `${week.week_start},${week.week_end},${week.total_orders},${week.total_trips},` +
            `${week.total_batches},${week.avg_cpd.toFixed(2)},${week.active_stores},${week.excluded_trips}`
        );
    });

    csvParts.push(''); // Blank line

    // 2. Store-Level Metrics
    csvParts.push('Store Performance by Week');
    csvParts.push('Week Start,Store ID,Orders,Trips,CPD');

    weeklyData.weeks.forEach(week => {
        if (week.stores && week.stores.length > 0) {
            week.stores.forEach(store => {
                csvParts.push(
                    `${week.week_start},${store.store_id},${store.orders},${store.trips},${store.cpd.toFixed(2)}`
                );
            });
        }
    });

    csvParts.push(''); // Blank line

    // 3. Carrier-Level Metrics
    csvParts.push('Carrier Performance by Week');
    csvParts.push('Week Start,Carrier,Orders,Trips,CPD');

    weeklyData.weeks.forEach(week => {
        if (week.carriers && week.carriers.length > 0) {
            week.carriers.forEach(carrier => {
                csvParts.push(
                    `${week.week_start},${carrier.carrier},${carrier.orders},${carrier.trips},${carrier.cpd.toFixed(2)}`
                );
            });
        }
    });

    csvParts.push(''); // Blank line

    // 4. Summary
    csvParts.push('Summary');
    csvParts.push(`Total Weeks,${weeklyData.summary.total_weeks}`);
    csvParts.push(`Date Range,${weeklyData.summary.date_range.start} to ${weeklyData.summary.date_range.end}`);
    csvParts.push(`Min Batch Size (Anomaly Threshold),${weeklyData.summary.min_batch_size} orders`);

    // Create CSV content
    const csvContent = csvParts.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `weekly_metrics_${dateStr}.csv`);

    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Show error modal
 */
function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').classList.remove('hidden');
}

/**
 * Close error modal
 */
function closeErrorModal() {
    document.getElementById('errorModal').classList.add('hidden');
}
