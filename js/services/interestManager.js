/**
 * Service responsible for managing interest details for companies
 * Handles interest for challenges, tech concepts, and products/vendors
 */

import { getSurveyData } from './dataLoader.js';
import { saveRecordDelta } from './deltaManager.js';

// Store for interest details
let interestDetails = {
    challenges: {},
    techConcepts: {},
    productsVendors: {}
};

/**
 * Initialize interest details storage
 */
export function initializeInterestDetails() {
    // Extract interest details from survey data
    const surveyData = getSurveyData();
    
    surveyData.forEach(record => {
        if (record.interestDetails) {
            const company = record['Jouw bedrijf'];
            if (company) {
                // Process each category
                ['challenges', 'techConcepts', 'productsVendors'].forEach(category => {
                    if (record.interestDetails[category]) {
                        if (!interestDetails[category]) {
                            interestDetails[category] = {};
                        }
                        if (!interestDetails[category][company]) {
                            interestDetails[category][company] = {};
                        }
                        
                        // Merge the interest details for this category and company
                        Object.assign(
                            interestDetails[category][company],
                            record.interestDetails[category]
                        );
                    }
                });
            }
        }
    });
    
    console.log('Interest details initialized', Object.keys(interestDetails).map(
        cat => `${cat}: ${Object.keys(interestDetails[cat]).length} companies`
    ));
}

/**
 * Save interest details for a company and topic
 * @param {string} company - Company name
 * @param {string} category - 'challenges', 'techConcepts', or 'productsVendors'
 * @param {string} topic - The specific topic name
 * @param {Object} details - Object containing where, when, what, and from details
 * @returns {boolean} - Whether the save was successful
 */
export function saveInterestDetails(company, category, topic, details) {
    if (!interestDetails[category]) {
        interestDetails[category] = {};
    }
    
    if (!interestDetails[category][company]) {
        interestDetails[category][company] = {};
    }
    
    interestDetails[category][company][topic] = details;
    
    // Also update the first entry for this company in the survey data
    // This ensures the data persists when saved
    const surveyData = getSurveyData();
    const companyEntries = surveyData.filter(entry => 
        entry['Jouw bedrijf'] === company && (!entry.Rol || entry.Rol.trim() === '')
    );
    
    let updatedRecord = null;
    if (companyEntries.length > 0) {
        updatedRecord = companyEntries[0];
        
        // Create the interestDetails property if it doesn't exist
        if (!updatedRecord.interestDetails) {
            updatedRecord.interestDetails = {
                challenges: {},
                techConcepts: {},
                productsVendors: {}
            };
        }
        
        // Update the specific category and topic
        if (!updatedRecord.interestDetails[category]) {
            updatedRecord.interestDetails[category] = {};
        }
        
        // Create a deep copy of the details to ensure it's a new object
        updatedRecord.interestDetails[category][topic] = JSON.parse(JSON.stringify(details));
        
        // Check if we need to save delta file (UUID mode and deltasFolderPAR)
        const urlParams = new URLSearchParams(window.location.search);
        const deltasFolderUrl = urlParams.get('deltasFolderPAR');
        const uuid = urlParams.get('uuid');
        
        if (deltasFolderUrl && uuid && updatedRecord.Id === uuid) {
            // Log what we're saving to help with debugging
            console.log(`Saving full record to delta file with updated interest details for ${company}, ${category}, ${topic}`);
            // Save the entire record as the delta file
            saveRecordDelta(uuid, updatedRecord, deltasFolderUrl);
        }
    }
    
    return true;
}

/**
 * Get interest details for a company and topic
 * @param {string} company - Company name
 * @param {string} category - 'challenges', 'techConcepts', or 'productsVendors'
 * @param {string} topic - The specific topic name
 * @returns {Object|null} - The details object or null if not found
 */
export function getInterestDetails(company, category, topic) {
    if (!interestDetails[category] || 
        !interestDetails[category][company] || 
        !interestDetails[category][company][topic]) {
        return null;
    }
    
    return interestDetails[category][company][topic];
}
