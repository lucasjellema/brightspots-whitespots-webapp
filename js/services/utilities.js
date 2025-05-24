/**
 * Common utility functions used across services
 */

/**
 * Calculate weighted score for interest levels
 * @param {Object} interestCounts - Object with counts for each interest level
 * @returns {number} - Weighted score
 */
export function calculateWeightedScore(interestCounts) {
    const weights = {
        'Very interested': 3,
        'Somewhat interested': 2,
        'Not very interested': 1,
        'Not at all interested': 0
    };
    
    let totalScore = 0;
    let totalResponses = 0;
    
    for (const [level, count] of Object.entries(interestCounts)) {
        if (weights.hasOwnProperty(level)) {
            totalScore += weights[level] * count;
            totalResponses += count;
        }
    }
    
    return totalResponses > 0 ? totalScore / totalResponses : 0;
}

/**
 * Download JSON data as a file
 * @param {Object} data - The data to download
 * @param {string} filename - The name of the file (without .json extension)
 */
export function downloadJsonData(data, filename) {
    try {
        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(data, null, 2);
        
        // Create a blob with the data
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.json`;
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Release the URL object
        URL.revokeObjectURL(url);
        
        console.log(`Data download initiated: ${filename}`);
        return true;
    } catch (error) {
        console.error('Error downloading data:', error);
        alert('Failed to download data: ' + error.message);
        return false;
    }
}
