/**
 * Main entry point for the Brightspots & Whitespots Dashboard data services
 * 
 * This file imports from specialized modules and re-exports their functionality
 * to maintain backward compatibility with existing code while providing a more
 * modular and maintainable structure.
 */

// Import from specialized modules
import { 
    loadSurveyData, 
    getSurveyData, 
    loadThemesData, 
    getThemesData, 
    getRecordById 
} from './dataLoader.js';

import { 
    getSurveySummary,
    getCustomerThemes,
    getCustomerThemeTags,
    getEmergingTechTags,
    getCompaniesByTag,
    findEntriesByTag,
    getEmergingTechEntries,
    getTechnologyTrends,
    getChallenges,
    getProductsVendors,
    getCompanies
} from './surveyAnalytics.js';

import {
    getThemeAssessments,
    getAllThemeAssessments,
    saveThemeAssessments,
    saveCustomerThemes,
    migrateThemeAssessments
} from './themeManager.js';

import {
    saveInterestDetails,
    getInterestDetails,
    initializeInterestDetails
} from './interestManager.js';

import {
    saveRecordDelta,
    loadCompanyDeltaData
} from './deltaManager.js';

// Constants
const APP_INITIALIZATION_COMPLETE = 'app-init-complete';

/**
 * Initialize the application data
 * This handles loading all necessary data and initializing the services
 */
export async function initializeData() {
    try {
        console.log('Initializing data services...');
        
        // Load survey data first (may contain theme assessments)
        await loadSurveyData();
        
        // Load themes data
        await loadThemesData();
        
        // Initialize interest details
        initializeInterestDetails();
        
        // Dispatch an event to signal initialization is complete
        window.dispatchEvent(new CustomEvent(APP_INITIALIZATION_COMPLETE));
        
        console.log('Data services initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize data services:', error);
        return false;
    }
}

// Re-export all functionality from specialized modules to maintain backward compatibility
export {
    // From dataLoader.js
    loadSurveyData,
    getSurveyData,
    loadThemesData,
    getThemesData,
    getRecordById,
    
    // From surveyAnalytics.js
    getSurveySummary,
    getCustomerThemes,
    getCustomerThemeTags,
    getEmergingTechTags,
    getCompaniesByTag,
    findEntriesByTag,
    getEmergingTechEntries,
    getTechnologyTrends,
    getChallenges,
    getProductsVendors,
    getCompanies,
    
    // From themeManager.js
    getThemeAssessments,
    getAllThemeAssessments,
    saveThemeAssessments,
    saveCustomerThemes,
    
    // From interestManager.js
    saveInterestDetails,
    getInterestDetails,
    
    // From deltaManager.js
    saveRecordDelta
};
