
const DELTA_FOLDER_PREFIX = 'conclusion-assets/brightspots-deltas/';


// Data Service for Brightspots & Whitespots Dashboard
let surveyData = [];
let themesData = [];
let interestDetails = {
    challenges: {},
    techConcepts: {},
    productsVendors: {}
};

/**
 * Load survey data from the JSON file or from a URL specified in the parDataFile query parameter
 * If deltasFolderPAR and uuid parameters are present, also load company-specific delta data
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
 */
export function getSurveyData() {
    return surveyData;
}

/**
 * Save interest details for a company and topic
 * @param {string} company - Company name
 * @param {string} category - 'challenges', 'techConcepts', or 'productsVendors'
 * @param {string} topic - The specific topic name
 * @param {Object} details - Object containing where, when, what, and from details
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
        
        updatedRecord.interestDetails[category][topic] = details;
        
        // Check if we need to save delta file (UUID mode and deltasFolderPAR)
        const urlParams = new URLSearchParams(window.location.search);
        const deltasFolderUrl = urlParams.get('deltasFolderPAR');
        const uuid = urlParams.get('uuid');
        
        if (deltasFolderUrl && uuid && updatedRecord.Id === uuid) {
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

/**
 * Get summary statistics for the survey data
 */
export function getSurveySummary() {
    const totalResponses = surveyData.length;
    const companies = new Set(surveyData.map(entry => entry['Jouw bedrijf'])).size;
    
    // Get date range
    const dates = surveyData.map(entry => {
        // Parse date in format DD-MM-YYYY HH:MM
        const [datePart, timePart] = entry['Start time'].split(' ');
        const [day, month, year] = datePart.split('-');
        const [hour, minute] = timePart.split(':');
        // Create date with correct format (month is 0-indexed in JS Date)
        return new Date(year, month - 1, day, hour, minute);
    });
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return {
        totalResponses,
        companies,
        startDate,
        endDate
    };
}

/**
 * Get all customer themes from the survey data
 */
export function getCustomerThemes() {
    console.log('Getting customer themes from', surveyData.length, 'entries');
    
    const themes = surveyData.map(entry => {
        // Debug the entry structure
        if (entry.Id === '1') {
            console.log('Sample entry structure:', JSON.stringify(entry, null, 2));
        }
        
        return {
            id: entry.Id,
            name: entry['Jouw naam'],
            company: entry['Jouw bedrijf'],
            themes: entry.newCustomerThemes || '',  // Ensure themes is at least an empty string
            tags: entry.newCustomerThemesTags || []
        };
    }).filter(item => item.themes && typeof item.themes === 'string' && item.themes.trim() !== '');
    
    console.log('Found', themes.length, 'customer themes');
    return themes;
}

/**
 * Get all customer theme tags with their frequencies
 */
export function getCustomerThemeTags() {
    // Create a map to count tag frequencies
    const tagFrequencyMap = new Map();
    
    // Count occurrences of each tag
    surveyData.forEach(entry => {
        if (entry.newCustomerThemesTags && Array.isArray(entry.newCustomerThemesTags)) {
            entry.newCustomerThemesTags.forEach(tag => {
                const count = tagFrequencyMap.get(tag) || 0;
                tagFrequencyMap.set(tag, count + 1);
            });
        }
    });
    
    // Convert to array of objects with tag and frequency
    const tagFrequencies = Array.from(tagFrequencyMap.entries()).map(([tag, frequency]) => ({
        tag,
        frequency
    }));
    
    // Sort by frequency (descending)
    return tagFrequencies.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get all emerging tech/vendor/product tags with their frequencies
 */
export function getEmergingTechTags() {
    // Create a map to count tag frequencies
    const tagFrequencyMap = new Map();
    
    // Count occurrences of each tag
    surveyData.forEach(entry => {
        // First check the dedicated tags array if it exists
        if (entry.emergingTechVendorProductTags && Array.isArray(entry.emergingTechVendorProductTags)) {
            entry.emergingTechVendorProductTags.forEach(tag => {
                if (tag && tag.trim()) { // Only count non-empty tags
                    const count = tagFrequencyMap.get(tag) || 0;
                    tagFrequencyMap.set(tag, count + 1);
                }
            });
        }
        
        // Also extract tags from the content field if it's comma-separated
        if (entry.emergingTechVendorProduct && entry.emergingTechVendorProduct.includes(',')) {
            const contentTags = entry.emergingTechVendorProduct.split(',').map(item => item.trim()).filter(Boolean);
            contentTags.forEach(tag => {
                if (tag && tag.trim()) { // Only count non-empty tags
                    const count = tagFrequencyMap.get(tag) || 0;
                    tagFrequencyMap.set(tag, count + 1);
                }
            });
        } else if (entry.emergingTechVendorProduct && entry.emergingTechVendorProduct.trim()) {
            // If it's a single value, count it as a tag
            const tag = entry.emergingTechVendorProduct.trim();
            const count = tagFrequencyMap.get(tag) || 0;
            tagFrequencyMap.set(tag, count + 1);
        }
    });
    
    console.log('Generated tag frequency map with', tagFrequencyMap.size, 'unique tags');
    
    // Convert to array of objects with tag and frequency
    const tagFrequencies = Array.from(tagFrequencyMap.entries()).map(([tag, frequency]) => ({
        tag,
        frequency
    }));
    
    // Sort by frequency (descending)
    return tagFrequencies.sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get companies that mentioned a specific tag
 */
export function getCompaniesByTag(tag) {
    const companies = new Set();
    
    surveyData.forEach(entry => {
        if (entry.newCustomerThemesTags && 
            Array.isArray(entry.newCustomerThemesTags) && 
            entry.newCustomerThemesTags.includes(tag) &&
            entry['Jouw bedrijf']) {
            companies.add(entry['Jouw bedrijf']);
        }
    });
    
    return Array.from(companies);
}

/**
 * Find entries by tag
 */
export function findEntriesByTag(tag, type = 'customer') {
    if (type === 'tech') {
        // Find entries with emerging tech/vendor/product tags
        return surveyData.filter(entry => {
            // First check in emergingTechVendorProductTags array if it exists
            if (entry.emergingTechVendorProductTags && Array.isArray(entry.emergingTechVendorProductTags)) {
                if (entry.emergingTechVendorProductTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
                    return true;
                }
            }
            
            // If not found in tags array, check in the content itself (comma-separated values)
            if (entry.emergingTechVendorProduct && entry.emergingTechVendorProduct.includes(',')) {
                const contentTags = entry.emergingTechVendorProduct.split(',').map(item => item.trim());
                return contentTags.some(t => t.toLowerCase() === tag.toLowerCase());
            }
            
            // If no comma-separated values, check if the whole content matches
            if (entry.emergingTechVendorProduct) {
                return entry.emergingTechVendorProduct.toLowerCase() === tag.toLowerCase();
            }
            
            return false;
        }).map(entry => {
            // Extract tags from comma-separated content if no tags are provided
            let tags = entry.emergingTechVendorProductTags || [];
            
            // If no tags but we have content with commas, use the content items as tags
            if (tags.length === 0 && entry.emergingTechVendorProduct && entry.emergingTechVendorProduct.includes(',')) {
                tags = entry.emergingTechVendorProduct.split(',').map(item => item.trim()).filter(Boolean);
            }
            
            return {
                id: entry.Id,
                name: entry['Jouw naam'] || 'Anonymous',
                company: entry['Jouw bedrijf'] || 'Unknown Company',
                content: entry.emergingTechVendorProduct,
                tags: tags
            };
        });
    } else {
        // Default to customer theme tags
        return surveyData.filter(entry => {
            if (!entry.newCustomerThemesTags || !Array.isArray(entry.newCustomerThemesTags)) {
                return false;
            }
            
            // Case-insensitive search
            return entry.newCustomerThemesTags.some(t => t.toLowerCase() === tag.toLowerCase());
        }).map(entry => ({
            id: entry.Id,
            name: entry['Jouw naam'],
            company: entry['Jouw bedrijf'],
            themes: entry.newCustomerThemes, // Changed from 'content' to 'themes' to match the expected property name
            tags: entry.newCustomerThemesTags || []
        }));
    }
}

/**
 * Get all emerging tech entries from the survey data
 */
export function getEmergingTechEntries() {
    console.log('Getting emerging tech entries from', surveyData.length, 'survey entries');
    
    // Log a sample entry to debug field names
    if (surveyData.length > 0) {
        const sampleEntry = surveyData[0];
        console.log('Sample entry fields:', Object.keys(sampleEntry));
        console.log('Sample emergingTechVendorProduct:', sampleEntry.emergingTechVendorProduct);
    }
    
    const entries = surveyData
        .filter(entry => entry.emergingTechVendorProduct) // Only include entries with tech content
        .map(entry => {
            // Extract tags from comma-separated content if no tags are provided
            let tags = entry.emergingTechVendorProductTags || [];
            
            // If no tags but we have content with commas, use the content items as tags
            if (tags.length === 0 && entry.emergingTechVendorProduct && entry.emergingTechVendorProduct.includes(',')) {
                tags = entry.emergingTechVendorProduct.split(',').map(item => item.trim()).filter(Boolean);
            }
            
            return {
                id: entry.Id,
                name: entry['Jouw naam'] || 'Anonymous',
                company: entry['Jouw bedrijf'] || 'Unknown Company',
                content: entry.emergingTechVendorProduct,
                tags: tags
            };
        })
        .filter(item => item.content && item.content.trim() !== '');
    
    console.log('Found', entries.length, 'emerging tech entries');
    return entries;
}

/**
 * Get all technology trends from the survey data
 */
export function getTechnologyTrends() {
    // Extract all unique tech concepts
    const techConcepts = new Set();
    surveyData.forEach(entry => {
        if (entry.techConcepts) {
            Object.keys(entry.techConcepts).forEach(concept => techConcepts.add(concept));
        }
    });
    
    // Count interest levels for each concept and track respondents
    const trendsData = Array.from(techConcepts).map(concept => {
        const interestCounts = {
            'Niets over gehoord': 0,
            'Vage interesse': 0,
            'Redelijke interesse': 0,
            'Sterke, concrete interesse': 0
        };
        
        // Track respondents for each interest level
        const respondents = {
            'Niets over gehoord': [],
            'Vage interesse': [],
            'Redelijke interesse': [],
            'Sterke, concrete interesse': []
        };
        
        surveyData.forEach(entry => {
            if (entry.techConcepts && entry.techConcepts[concept]) {
                const interest = entry.techConcepts[concept];
                if (interestCounts.hasOwnProperty(interest)) {
                    interestCounts[interest]++;
                    
                    // Store respondent information
                    const respondentInfo = {
                        company: entry['Jouw bedrijf'] || 'Unknown Company',
                        name: entry['Jouw naam'] || '',
                        role: entry['Rol'] || ''
                    };
                    respondents[interest].push(respondentInfo);
                }
            }
        });
        
        return {
            concept,
            interestCounts,
            respondents, // Include respondent information
            totalMentions: Object.values(interestCounts).reduce((sum, count) => sum + count, 0),
            weightedScore: calculateWeightedScore(interestCounts)
        };
    });
    
    // Sort by weighted score (highest interest first)
    return trendsData.sort((a, b) => b.weightedScore - a.weightedScore);
}

/**
 * Get all challenges from the survey data
 */
export function getChallenges() {
    // Extract all unique challenges
    const challengeSet = new Set();
    surveyData.forEach(entry => {
        if (entry.challenges) {
            Object.keys(entry.challenges).forEach(challenge => challengeSet.add(challenge));
        }
    });
    
    // Count interest levels for each challenge and track respondents
    const challengesData = Array.from(challengeSet).map(challenge => {
        const interestCounts = {
            'Niets over gehoord': 0,
            'Vage interesse': 0,
            'Redelijke interesse': 0,
            'Sterke, concrete interesse': 0
        };
        
        // Track respondents for each interest level
        const respondents = {
            'Niets over gehoord': [],
            'Vage interesse': [],
            'Redelijke interesse': [],
            'Sterke, concrete interesse': []
        };
        
        surveyData.forEach(entry => {
            if (entry.challenges && entry.challenges[challenge]) {
                const interest = entry.challenges[challenge];
                if (interestCounts.hasOwnProperty(interest)) {
                    interestCounts[interest]++;
                    
                    // Store respondent information
                    const respondentInfo = {
                        company: entry['Jouw bedrijf'] || 'Unknown Company',
                        name: entry['Jouw naam'] || '',
                        role: entry['Rol'] || ''
                    };
                    respondents[interest].push(respondentInfo);
                }
            }
        });
        
        return {
            challenge,
            interestCounts,
            respondents,  // Include respondent information
            totalMentions: Object.values(interestCounts).reduce((sum, count) => sum + count, 0),
            weightedScore: calculateWeightedScore(interestCounts)
        };
    });
    
    // Sort by weighted score (highest interest first)
    return challengesData.sort((a, b) => b.weightedScore - a.weightedScore);
}



/**
 * Get all products/vendors from the survey data
 */
export function getProductsVendors() {
    // Extract all unique products/vendors
    const vendorSet = new Set();
    surveyData.forEach(entry => {
        if (entry.productsVendors) {
            Object.keys(entry.productsVendors).forEach(vendor => vendorSet.add(vendor));
        }
    });
    
    // Count interest levels for each product/vendor
    const vendorsData = Array.from(vendorSet).map(vendor => {
        const interestCounts = {
            'Niets over gehoord': 0,
            'Vage interesse': 0,
            'Redelijke interesse': 0,
            'Sterke, concrete interesse': 0
        };
        
        // Store respondents for each interest level
        const respondents = {
            'Niets over gehoord': [],
            'Vage interesse': [],
            'Redelijke interesse': [],
            'Sterke, concrete interesse': []
        };
        
        surveyData.forEach(entry => {
            if (entry.productsVendors && entry.productsVendors[vendor]) {
                const interest = entry.productsVendors[vendor];
                if (interestCounts.hasOwnProperty(interest)) {
                    interestCounts[interest]++;
                    
                    // Add respondent information
                    respondents[interest].push({
                        name: entry['Jouw naam'] || '',
                        company: entry['Jouw bedrijf'] || '',
                        role: entry['Rol'] || ''
                    });
                }
            }
        });
        
        return {
            vendor,
            interestCounts,
            respondents, // Include respondent information
            totalMentions: Object.values(interestCounts).reduce((sum, count) => sum + count, 0),
            weightedScore: calculateWeightedScore(interestCounts)
        };
    });
    
    // Sort by weighted score (highest interest first)
    return vendorsData.sort((a, b) => b.weightedScore - a.weightedScore);
}

/**
 * Get all companies from the survey data
 */
export function getCompanies() {
    const companyMap = new Map();
    
    surveyData.forEach(entry => {
        const company = entry['Jouw bedrijf'];
        if (company && company.trim() !== '') {
            if (!companyMap.has(company)) {
                companyMap.set(company, {
                    name: company,
                    count: 0,
                    respondents: []
                });
            }
            
            const companyData = companyMap.get(company);
            companyData.count++;
            companyData.respondents.push({
                id: entry.Id,
                name: entry['Jouw naam'],
                themes: entry.newCustomerThemes || '',
                emergingTech: entry.emergingTechVendorProduct || ''
            });
        }
    });
    
    return Array.from(companyMap.values())
        .sort((a, b) => b.count - a.count);
}

/**
 * Find a record by its Id and return the record data
 * @param {string} id - The Id of the record to find
 * @returns {Object|null} - The record object or null if not found
 */
export function getRecordById(id) {
    if (!id) return null;
    
    // Find the record with the matching Id
    const record = surveyData.find(entry => entry.Id === id);
    return record || null;
}

/**
 * Load main themes data from JSON file
 */
export async function loadThemesData() {
    try {
        console.log('Fetching themes data from data/main-themes.json');
        const response = await fetch('data/main-themes.json');
        if (!response.ok) {
            throw new Error(`Failed to load themes data: ${response.status}`);
        }
        
        const data = await response.json();
        themesData = data; // Store in the module variable
        console.log(`Loaded ${themesData.length} themes successfully:`, themesData);
        return themesData;
    } catch (error) {
        console.error('Error loading themes data:', error);
        // If there's an error, create some default themes for testing
        themesData = [
            {"Id":"1","Name":"AI", "Description":""},
            {"Id":"2","Name":"Cyber Security", "Description":""},
            {"Id":"3","Name":"IT Regulations", "Description":""}
        ];
        console.log('Using fallback themes data');
        return themesData;
    }
}

/**
 * Get all main themes
 */
export function getThemesData() {
    return themesData;
}

/**
 * Migrate legacy theme assessments to UUID-based storage
 * @param {Object} legacyAssessments - The old format theme assessments
 */
function migrateThemeAssessments(legacyAssessments) {
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
 */
export function getThemeAssessments(companyName) {
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
 */
export function saveThemeAssessments(companyName, assessments) {
    if (!companyName) return false;
    
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
    
    // Update the assessments
    primaryRecord.themeAssessments = assessments;
    console.log(`Saved theme assessments for ${companyName} to record ID ${primaryRecord.Id}`);
    
    // If we're in UUID mode and deltasFolderPAR is defined, save the delta file
    const urlParams = new URLSearchParams(window.location.search);
    const deltasFolderUrl = urlParams.get('deltasFolderPAR');
    const uuid = urlParams.get('uuid');
    
    if (deltasFolderUrl && uuid && primaryRecord.Id === uuid) {
        // Save the entire record as the delta file
        saveRecordDelta(uuid, primaryRecord, deltasFolderUrl);
    }
    
    return true;
}

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
 * Save customer themes for a company
 * @param {string} companyName - The company name
 * @param {string|Array} themes - The themes to save (string or array of strings)
 * @returns {boolean} - Whether the save was successful
 */
export function saveCustomerThemes(companyName, themes) {
    if (!companyName) return false;
    
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
        // Save the entire record as the delta file
        saveRecordDelta(uuid, primaryRecord, deltasFolderUrl);
    }
    
    return true;
}

/**
 * Calculate weighted score for interest levels
 */
function calculateWeightedScore(interestCounts) {
    const weights = {
        'Niets over gehoord': 0,
        'Vage interesse': 1,
        'Redelijke interesse': 2,
        'Sterke, concrete interesse': 3
    };
    
    let score = 0;
    let total = 0;
    
    for (const [interest, count] of Object.entries(interestCounts)) {
        score += weights[interest] * count;
        total += count;
    }
    
    return total > 0 ? score / total : 0;
}
