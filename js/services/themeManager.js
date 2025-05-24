/**
 * Service responsible for managing theme assessments, theme migrations, and saving theme data
 */

import { getSurveyData } from './dataLoader.js';
import { saveRecordDelta } from './deltaManager.js';

/**
 * Migrate legacy theme assessments to UUID-based storage
 * @param {Object} legacyAssessments - The old format theme assessments
 * @private
 */
export function migrateThemeAssessments(legacyAssessments) {
    const surveyData = getSurveyData();
    // For each company in the legacy assessments
    for (const [companyName, assessments] of Object.entries(legacyAssessments)) {
        // Find all records for this company
        const companyRecords = surveyData.filter(record => 
            record['Jouw bedrijf'] === companyName);
        
        if (companyRecords.length > 0) {
            // Add theme assessments to the first record for this company
            const primaryRecord = companyRecords[0];
            if (!primaryRecord.themeAssessments) {
                primaryRecord.themeAssessments = {};
            }
            // Copy the assessments to the record
            Object.assign(primaryRecord.themeAssessments, assessments);
            console.log(`Migrated theme assessments for ${companyName} to record ID ${primaryRecord.Id}`);
        } else {
            console.warn(`Could not migrate theme assessments for ${companyName}: no matching records found`);
        }
    }
}

/**
 * Get theme assessments for a company
 * @param {string} companyName - The company name
 * @returns {Object} Theme assessments for the company
 */
export function getThemeAssessments(companyName) {
    const surveyData = getSurveyData();
    // Find the first record for this company
    const companyRecord = surveyData.find(record => record['Jouw bedrijf'] === companyName);
    
    if (!companyRecord || !companyRecord.themeAssessments) {
        return {};
    }
    return companyRecord.themeAssessments;
}

/**
 * Get all theme assessments
 * @returns {Object} All theme assessments indexed by company name
 */
export function getAllThemeAssessments() {
    const surveyData = getSurveyData();
    // Build a map of company name -> theme assessments
    const allAssessments = {};
    
    // Group theme assessments by company name
    for (const record of surveyData) {
        const companyName = record['Jouw bedrijf'];
        if (companyName && record.themeAssessments) {
            allAssessments[companyName] = record.themeAssessments;
        }
    }
    
    return allAssessments;
}

/**
 * Save theme assessments for a company
 * @param {string} companyName - The company name
 * @param {Object} assessments - The theme assessments to save
 * @returns {boolean} Whether the save was successful
 */
export function saveThemeAssessments(companyName, assessments) {
    if (!companyName) return false;
    
    const surveyData = getSurveyData();
    // Find all records for this company
    const companyRecords = surveyData.filter(record => 
        record['Jouw bedrijf'] === companyName);
    
    if (companyRecords.length === 0) {
        console.error(`Cannot save theme assessments: no records found for company ${companyName}`);
        return false;
    }
    
    // Save to the first record for this company
    const primaryRecord = companyRecords[0];
    if (!primaryRecord.themeAssessments) {
        primaryRecord.themeAssessments = {};
    }
    
    // Update the assessments - create a deep copy to ensure it's a new object
    primaryRecord.themeAssessments = JSON.parse(JSON.stringify(assessments));
    console.log(`Saved theme assessments for ${companyName} to record ID ${primaryRecord.Id}`);
    
    // If we're in UUID mode and deltasFolderPAR is defined, save the delta file
    const urlParams = new URLSearchParams(window.location.search);
    const deltasFolderUrl = urlParams.get('deltasFolderPAR');
    const uuid = urlParams.get('uuid');
    
    if (deltasFolderUrl && uuid && primaryRecord.Id === uuid) {
        // Log what we're saving to help with debugging
        console.log('Saving full record to delta file with updated theme assessments');
        // Save the entire record as the delta file
        saveRecordDelta(uuid, primaryRecord, deltasFolderUrl);
    }
    
    return true;
}

/**
 * Save customer themes for a company
 * @param {string} companyName - The company name
 * @param {string|Array} themes - The themes to save (string or array of strings)
 * @returns {boolean} - Whether the save was successful
 */
export function saveCustomerThemes(companyName, themes) {
    if (!companyName) return false;
    
    const surveyData = getSurveyData();
    // Ensure themes is a string
    const themesString = Array.isArray(themes) ? themes.join('; ') : themes;
    
    // Find all records for this company
    const companyRecords = surveyData.filter(record => 
        record['Jouw bedrijf'] === companyName && (!record.Rol || record.Rol.trim() === '')
    );
    
    if (companyRecords.length === 0) {
        console.error(`Cannot save customer themes: no records found for company ${companyName}`);
        return false;
    }
    
    // Save to the first record for this company
    const primaryRecord = companyRecords[0];
    primaryRecord.newCustomerThemes = themesString;
    console.log(`Saved customer themes for ${companyName} to record ID ${primaryRecord.Id}`);
    
    // If we're in UUID mode and deltasFolderPAR is defined, save the delta file
    const urlParams = new URLSearchParams(window.location.search);
    const deltasFolderUrl = urlParams.get('deltasFolderPAR');
    const uuid = urlParams.get('uuid');
    
    if (deltasFolderUrl && uuid && primaryRecord.Id === uuid) {
        // Log what we're saving to help with debugging
        console.log('Saving full record to delta file with updated customer themes');
        // Save the entire record as the delta file
        saveRecordDelta(uuid, primaryRecord, deltasFolderUrl);
    }
    
    return true;
}
