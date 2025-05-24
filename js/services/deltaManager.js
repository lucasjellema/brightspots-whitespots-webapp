/**
 * Service responsible for saving and loading delta files
 * Handles URL parameters related to deltas
 */

import { getSurveyData } from './dataLoader.js';

// Constants
const DELTA_FOLDER_PREFIX = 'conclusion-assets/brightspots-deltas/';

/**
 * Save a delta file for a specific record to the remote location
 * @param {string} uuid - The UUID of the record
 * @param {Object} deltaData - The delta data to save
 * @param {string} deltasFolderUrl - Base URL for the delta files folder
 * @returns {Promise<boolean>} - Whether the save was successful
 */
export async function saveRecordDelta(uuid, deltaData, deltasFolderUrl) {
    try {
        // Ensure the folder URL ends with a slash
        const folderUrl = (deltasFolderUrl.endsWith('/') ? deltasFolderUrl : `${deltasFolderUrl}/`)+DELTA_FOLDER_PREFIX;
        
        // Construct the delta file URL
        const deltaFileUrl = `${folderUrl}delta${uuid}.json`;
        console.log('Saving delta file to:', deltaFileUrl);
        
        // Convert the delta data to JSON
        const jsonData = JSON.stringify(deltaData, null, 2);
        
        // Use fetch with PUT method to save the file
        const response = await fetch(deltaFileUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error saving delta file: ${response.status}`);
        }
        
        console.log(`Successfully saved delta file for record ${uuid}`);
        return true;
    } catch (error) {
        console.error('Error saving delta file:', error);
        // Show a user-friendly error message
        alert('Could not save changes to the remote location. Your changes are saved locally but will not persist after page reload.');
        return false;
    }
}

/**
 * Load company-specific delta data from a remote folder
 * @param {string} deltasFolderUrl - Base URL for the delta files folder
 * @param {string} uuid - UUID of the record to update
 * @returns {Promise<void>}
 */
export async function loadCompanyDeltaData(deltasFolderUrl, uuid) {
    const surveyData = getSurveyData();
    try {
        // Ensure the folder URL ends with a slash
        const folderUrl = (deltasFolderUrl.endsWith('/') ? deltasFolderUrl : `${deltasFolderUrl}/`)+DELTA_FOLDER_PREFIX;
        
        // Construct the delta file URL
        const deltaFileUrl = `${folderUrl}delta${uuid}.json`;
        console.log('Attempting to load company delta data from:', deltaFileUrl);
        
        // Fetch the delta file
        const response = await fetch(deltaFileUrl);
        
        // If the file doesn't exist, just return (not an error)
        if (response.status === 404) {
            console.log(`No delta file found for record ${uuid}`);
            return;
        }
        
        // Handle other HTTP errors
        if (!response.ok) {
            throw new Error(`HTTP error loading delta file: ${response.status}`);
        }
        
        // Parse the delta data
        const deltaData = await response.json();
        console.log('Delta data loaded successfully for record:', uuid);
        
        // Find the record to update
        const recordToUpdate = surveyData.find(record => record.Id === uuid);
        
        if (!recordToUpdate) {
            console.warn(`Cannot apply delta data: No record found with ID ${uuid}`);
            return;
        }
        
        // Apply the delta data by deep merging it with the existing record
        Object.keys(deltaData).forEach(key => {
            // For complex objects like themeAssessments, we want to merge rather than replace
            if (typeof deltaData[key] === 'object' && deltaData[key] !== null && !Array.isArray(deltaData[key])) {
                // If the property doesn't exist in the record, initialize it
                if (!recordToUpdate[key] || typeof recordToUpdate[key] !== 'object') {
                    recordToUpdate[key] = {};
                }
                
                // Deep merge the objects
                Object.keys(deltaData[key]).forEach(subKey => {
                    recordToUpdate[key][subKey] = deltaData[key][subKey];
                });
            } else {
                // For primitive values or arrays, just replace
                recordToUpdate[key] = deltaData[key];
            }
        });
        
        console.log(`Applied delta data to record ${uuid}`);
    } catch (error) {
        console.error('Error loading company delta data:', error);
        // Don't throw the error - we want the application to continue even if delta loading fails
    }
}
