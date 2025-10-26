/**
 * speedportal/src/utils.js
 * Helper functions used across the application
 */

/**
 * Format seconds into HH:MM:SS or MM:SS
 * @param {number} totalSeconds - Total seconds to format
 * @returns {string} Formatted time string
 */
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } else {
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
}

/**
 * Calculate score based on submitted weight vs reference
 * @param {number} submitted - Submitted weight value
 * @param {number} reference - Reference (correct) weight value
 * @param {number} tolerance - Tolerance percentage (default 5%)
 * @returns {number} Score from 0-100
 */
function calculateScore(submitted, reference, tolerance = 5) {
    if (!submitted || !reference) return 0;
    
    const deviation = Math.abs(submitted - reference);
    const percentDeviation = (deviation / reference) * 100;
    
    // Score calculation: 100 points minus deviation percentage scaled by tolerance
    const score = Math.max(0, 100 - (percentDeviation / tolerance) * 100);
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
}

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file to download
 */
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        alert("No data to export");
        return;
    }

    // Create CSV content
    const headers = ["Rank", "Name", "College", "Score", "Submission Time", "Submitted Weight"];
    const rows = data.map((item, index) => [
        index + 1,
        item.name || "",
        item.college || "",
        item.score || "0",
        item.time_submitted ? new Date(item.time_submitted).toLocaleString() : "N/A",
        item.submitted_weight || "N/A"
    ]);

    // Combine headers and rows
    const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

/**
 * File picker for CAD model uploads
 * @returns {Promise<File|null>} Selected file or null if cancelled
 */
async function pickFile() {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".zip,.rar,.step,.iges,.sldprt,.stl,.obj,.ipt,.iam,.dwg,.dxf";
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                // Check file size (max 50MB)
                const maxSize = 50 * 1024 * 1024; // 50MB in bytes
                if (file.size > maxSize) {
                    alert("File is too large. Maximum size is 50MB.");
                    resolve(null);
                    return;
                }
                resolve(file);
            } else {
                resolve(null);
            }
        };
        
        input.oncancel = () => resolve(null);
        
        input.click();
    });
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info)
 */
function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "slideOut 0.3s ease";
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}