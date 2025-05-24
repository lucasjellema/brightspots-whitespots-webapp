/**
 * Data Service for Brightspots & Whitespots Dashboard
 * 
 * This main file now imports from specialized service modules to maintain
 * a more modular and maintainable architecture while preserving backward compatibility.
 */

// Import all functionality from the new modular services
import { 
    // Core data loading and access
    loadSurveyData,
    getSurveyData,
    loadThemesData, 
    getThemesData, 
    getRecordById,
    
    // Data analysis and retrieval
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
    
    // Theme management
    getThemeAssessments,
    getAllThemeAssessments,
    saveThemeAssessments,
    saveCustomerThemes,
    
    // Interest management
    saveInterestDetails,
    getInterestDetails,
    
    // Delta management
    saveRecordDelta,
    
    // Application initialization
    initializeData
} from './services/dataService.js';

// Re-export all imported functionality
export {
    // Core data loading and access
    loadSurveyData,
    getSurveyData,
    loadThemesData, 
    getThemesData, 
    getRecordById,
    
    // Data analysis and retrieval
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
    
    // Theme management
    getThemeAssessments,
    getAllThemeAssessments,
    saveThemeAssessments,
    saveCustomerThemes,
    
    // Interest management
    saveInterestDetails,
    getInterestDetails,
    
    // Delta management
    saveRecordDelta,
    
    // Application initialization
    initializeData
};
    