/**
 * Service responsible for loading and providing access to survey and themes data
 */

const DELTA_FOLDER_PREFIX = 'conclusion-assets/brightspots-deltas/';

// Data storage
let surveyData = [];
let themesData = [];

/**
 * Load survey data from the JSON file or from a URL specified in the parDataFile query parameter
 * If deltasFolderPAR and uuid parameters are present, also load company-specific delta data
 * @returns {Promise<Array>} The loaded survey data
 */
export async function loadSurveyData() {
    try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const dataFileUrl = urlParams.get('parDataFile');
        const deltasFolderUrl = urlParams.get('deltasFolderPAR');
        const uuid = urlParams.get('uuid');
        
        // Use the provided URL or fall back to the default local file
        const dataSource = dataFileUrl || 'data/brightspots.json';
        console.log('Loading data from source:', dataSource);
        
        const response = await fetch(dataSource);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON response
        const loadedData = await response.json();
        
        // Check if the data is in the new format (with surveyData property)
        if (loadedData.surveyData && Array.isArray(loadedData.surveyData)) {
            // Set the survey data
            surveyData = loadedData.surveyData;
            console.log('Survey data loaded successfully:', surveyData.length, 'entries');
            
            // Handle legacy theme assessments format (if present)
            if (loadedData.themeAssessments) {
                console.log('Legacy theme assessments found, migrating to UUID-based storage...');
                // Migrate theme assessments to be stored with each record
                migrateThemeAssessments(loadedData.themeAssessments);
            }
        } else if (Array.isArray(loadedData)) {
            // Handle the legacy format (just an array of survey data)
            surveyData = loadedData;
            console.log('Survey data loaded successfully (legacy format):', surveyData.length, 'entries');
        } else {
            throw new Error('Invalid data format: Expected an array or an object with surveyData property');
        }
        
        // Check if we should load a delta file for a specific company
        if (deltasFolderUrl && uuid) {
            await loadCompanyDeltaData(deltasFolderUrl, uuid);
        }
        
        return surveyData;
    } catch (error) {
        console.error('Error loading survey data:', error);
        throw error;
    }
}

/**
 * Load company-specific delta data from a remote folder
 * @param {string} deltasFolderUrl - Base URL for the delta files folder
 * @param {string} uuid - UUID of the record to update
 * @private
 */
async function loadCompanyDeltaData(deltasFolderUrl, uuid) {
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

/**
 * Get all survey data
 * @returns {Array} The survey data
 */
export function getSurveyData() {
    return surveyData;
}

/**
 * Find a record by its Id and return the record data
 * @param {string} id - The Id of the record to find
 * @returns {Object|null} - The record object or null if not found
 */
export function getRecordById(id) {
    if (!id || !surveyData || surveyData.length === 0) {
        return null;
    }
    
    return surveyData.find(record => record.Id === id) || null;
}

const MAIN_THEMES_FILE = 'data/main-themes.json';
/**
 * Load main themes data from JSON file
 * @returns {Promise<Array>} The loaded themes data
 */
export async function loadThemesData() {
    try {
        const response = await fetch(MAIN_THEMES_FILE);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        themesData = await response.json();
        console.log('Themes data loaded successfully:', themesData.length, 'themes');
        return themesData;
    } catch (error) {
        console.error('Error loading themes data:', error);
        throw error;
    }
}

/**
 * Get all main themes
 * @returns {Array} The themes data
 */
export function getThemesData() {
    return themesData;
}

/**
 * Migrate legacy theme assessments to UUID-based storage
 * @param {Object} legacyAssessments - The old format theme assessments
 * @private
 */
function migrateThemeAssessments(legacyAssessments) {
    // Process each company in the legacy assessments
    Object.keys(legacyAssessments).forEach(companyName => {
        const companyAssessments = legacyAssessments[companyName];
        
        // Find all records for this company in the survey data
        const companyRecords = surveyData.filter(record => 
            record['Jouw bedrijf'] === companyName && (!record.Rol || record.Rol.trim() === '')
        );
        
        if (companyRecords.length > 0) {
            // Add the theme assessments to each record
            companyRecords.forEach(record => {
                if (!record.themeAssessments) {
                    record.themeAssessments = {};
                }
                
                // Copy the assessments
                Object.keys(companyAssessments).forEach(themeId => {
                    record.themeAssessments[themeId] = companyAssessments[themeId];
                });
            });
        }
    });
}
