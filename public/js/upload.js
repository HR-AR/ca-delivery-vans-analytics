/**
 * CA Delivery Vans Analytics - Upload Handler
 * Handles file selection, validation, and upload to backend
 */

// DOM Elements
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const fileSelectedContainer = document.getElementById('fileSelectedContainer');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const uploadBtn = document.getElementById('uploadBtn');
const resultsContainer = document.getElementById('resultsContainer');
const loadingOverlay = document.getElementById('loadingOverlay');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// State
let selectedFile = null;

// Initialize event listeners
function init() {
    // Click to upload
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // File selection
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('dragleave', handleDragLeave);
    uploadZone.addEventListener('drop', handleDrop);

    // Remove file
    removeFileBtn.addEventListener('click', clearFileSelection);

    // Upload button
    uploadBtn.addEventListener('click', uploadFile);
}

/**
 * Handle file selection from input
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndDisplayFile(file);
    }
}

/**
 * Handle drag over event
 */
function handleDragOver(event) {
    event.preventDefault();
    uploadZone.classList.add('dragover');
}

/**
 * Handle drag leave event
 */
function handleDragLeave(event) {
    event.preventDefault();
    uploadZone.classList.remove('dragover');
}

/**
 * Handle file drop
 */
function handleDrop(event) {
    event.preventDefault();
    uploadZone.classList.remove('dragover');

    const file = event.dataTransfer.files[0];
    if (file) {
        validateAndDisplayFile(file);
    }
}

/**
 * Validate file and display if valid
 */
function validateAndDisplayFile(file) {
    // Clear previous results
    resultsContainer.innerHTML = '';

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showError('Invalid File Type', 'Please select a CSV file. Only .csv files are accepted.');
        return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
        showError('File Too Large', `File size is ${formatFileSize(file.size)}. Maximum allowed size is 50MB.`);
        return;
    }

    // Store selected file
    selectedFile = file;

    // Display file info
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);

    // Show file selected UI
    uploadZone.style.display = 'none';
    fileSelectedContainer.classList.remove('hidden');
}

/**
 * Clear file selection
 */
function clearFileSelection(event) {
    if (event) {
        event.stopPropagation();
    }

    selectedFile = null;
    fileInput.value = '';
    uploadZone.style.display = 'block';
    fileSelectedContainer.classList.add('hidden');
    resultsContainer.innerHTML = '';
}

/**
 * Upload file to backend
 */
async function uploadFile() {
    if (!selectedFile) {
        showError('No File Selected', 'Please select a CSV file to upload.');
        return;
    }

    // Disable upload button
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<div class="spinner"></div><span>Uploading...</span>';

    // Show progress
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '30%';
    progressText.textContent = 'Uploading file...';

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Create form data
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        // Upload file
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        // Update progress
        progressFill.style.width = '70%';
        progressText.textContent = 'Processing...';

        // Parse response
        const result = await response.json();

        // Update progress
        progressFill.style.width = '100%';

        if (response.ok) {
            // Success
            progressText.textContent = 'Complete!';
            showSuccess(result);

            // Clear file selection after successful upload
            setTimeout(() => {
                clearFileSelection();
                progressContainer.classList.add('hidden');
                progressFill.style.width = '0%';
            }, 2000);
        } else {
            // Validation error
            progressText.textContent = 'Validation failed';
            showValidationError(result);

            // Reset progress
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                progressFill.style.width = '0%';
            }, 2000);
        }
    } catch (error) {
        console.error('Upload error:', error);
        progressText.textContent = 'Upload failed';
        showError('Upload Failed', `An error occurred while uploading the file: ${error.message}`);

        // Reset progress
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            progressFill.style.width = '0%';
        }, 2000);
    } finally {
        // Re-enable upload button
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<span>Upload File</span>';
    }
}

/**
 * Show success message with upload stats
 */
function showSuccess(data) {
    // Backend sends validationResult, not summary
    const validation = data.validationResult || {};
    const totalRows = validation.totalRows || 0;
    const caStores = validation.caStores || 0;
    const nonCARows = validation.nonCAStoresExcluded || 0;
    const carriers = validation.carriers || [];
    const warnings = validation.warnings || [];

    const html = `
        <div class="alert alert-success">
            <div class="alert-title">✅ UPLOAD SUCCESSFUL</div>
            <div class="alert-content">
                <strong>File processed successfully!</strong>
                <div class="alert-list" style="margin-top: 0.75rem;">
                    • Total rows processed: <strong>${totalRows}</strong><br>
                    • CA stores found: <strong>${caStores}</strong><br>
                    ${nonCARows > 0 ? `• Non-CA rows excluded: <strong>${nonCARows}</strong><br>` : ''}
                    • Carriers: <strong>${carriers.join(', ') || 'N/A'}</strong>
                </div>
                ${warnings.length > 0 ? `
                <div class="alert alert-warning" style="margin-top: 1rem; padding: 1rem; background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 4px;">
                    <strong style="color: #856404; font-size: 1.1em;">⚠️ Warnings:</strong>
                    <ul style="margin: 0.75rem 0 0 1.5rem; color: #856404; line-height: 1.6;">
                        ${warnings.map(w => `<li style="margin-bottom: 0.5rem;"><strong>${w}</strong></li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="card">
            <div class="card-body text-center">
                <p class="text-muted mb-2">Your data has been successfully uploaded and validated.</p>
                <a href="dashboard.html" class="btn btn-success">→ View Dashboard</a>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

/**
 * Show validation error with detailed diagnosis
 */
function showValidationError(data) {
    const error = data.error || 'Validation failed';
    const details = data.details || {};
    const diagnosis = data.diagnosis || '';
    const solution = data.solution || '';

    let detailsHtml = '';
    if (details.required) {
        detailsHtml += `<strong>Required:</strong> "${details.required}"<br>`;
    }
    if (details.found && details.found.length > 0) {
        detailsHtml += `<strong>Found:</strong> ${details.found.map(col => `"${col}"`).join(', ')}<br>`;
    }
    if (details.missing && details.missing.length > 0) {
        detailsHtml += `<strong>Missing:</strong> ${details.missing.map(col => `"${col}"`).join(', ')}<br>`;
    }

    const html = `
        <div class="alert alert-error">
            <div class="alert-title">❌ UPLOAD FAILED: ${error}</div>
            <div class="alert-content">
                ${detailsHtml ? `<div class="mb-2">${detailsHtml}</div>` : ''}
                ${diagnosis ? `<div class="mb-2"><strong>🔍 Diagnosis:</strong> ${diagnosis}</div>` : ''}
                ${solution ? `<div><strong>✅ Solution:</strong> ${solution}</div>` : ''}
            </div>
        </div>
        <div class="card">
            <div class="card-header">Need Help?</div>
            <div class="card-body">
                <p class="text-muted mb-2">
                    Common issues and solutions:
                </p>
                <ul style="padding-left: 1.5rem; color: var(--secondary-gray);">
                    <li><strong>Column Name Mismatch:</strong> Check that column names match exactly (case-sensitive). For example, "Store Id" not "Store ID".</li>
                    <li><strong>Missing Columns:</strong> Ensure all required columns are present in your CSV file.</li>
                    <li><strong>Invalid Data Format:</strong> Check that dates are in YYYY-MM-DD format and numbers don't contain special characters.</li>
                    <li><strong>Non-CA Stores:</strong> Only CA stores (2082, 2242, 5930) are processed. Other stores are automatically filtered.</li>
                </ul>
                <div class="mt-2">
                    <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
                </div>
            </div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

/**
 * Show generic error message
 */
function showError(title, message) {
    const html = `
        <div class="alert alert-error">
            <div class="alert-title">❌ ${title}</div>
            <div class="alert-content">${message}</div>
        </div>
    `;

    resultsContainer.innerHTML = html;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);
