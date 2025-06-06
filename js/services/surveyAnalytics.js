/**
 * Service responsible for data analysis and retrieval
 */

import { getSurveyData } from './dataLoader.js';
import { calculateWeightedScore } from './utilities.js';

/**
 * Get summary statistics for the survey data
 * @returns {Object} Object with totalResponses, companies, startDate, endDate
 */
export function getSurveySummary() {
    const surveyData = getSurveyData();
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
 * @returns {Array} Array of objects with theme information
 */
export function getCustomerThemes() {
    const surveyData = getSurveyData();
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
 * @returns {Array} Array of objects with tag and frequency
 */
export function getCustomerThemeTags() {
    const surveyData = getSurveyData();
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
 * @returns {Array} Array of objects with tag and frequency
 */
export function getEmergingTechTags() {
    const surveyData = getSurveyData();
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
 * @param {string} tag - The tag to search for
 * @returns {Array} Array of company names
 */
export function getCompaniesByTag(tag) {
    const surveyData = getSurveyData();
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
 * @param {string} tag - The tag to search for
 * @param {string} type - 'customer' or 'tech'
 * @returns {Array} Array of entries matching the tag
 */
export function findEntriesByTag(tag, type = 'customer') {
    const surveyData = getSurveyData();
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
 * @returns {Array} Array of emerging tech entries
 */
export function getEmergingTechEntries() {
    const surveyData = getSurveyData();
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
 * @returns {Array} Array of technology trends with interest levels
 */
export function getTechnologyTrends() {
    const surveyData = getSurveyData();
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
 * @returns {Array} Array of challenges with interest levels
 */
export function getChallenges() {
    const surveyData = getSurveyData();
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
 * @returns {Array} Array of products/vendors with interest levels
 */
export function getProductsVendors() {
    const surveyData = getSurveyData();
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
        
        // Track respondents for each interest level
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
            vendor,
            interestCounts,
            respondents,  // Include respondent information
            totalMentions: Object.values(interestCounts).reduce((sum, count) => sum + count, 0),
            weightedScore: calculateWeightedScore(interestCounts)
        };
    });
    
    // Sort by weighted score (highest interest first)
    return vendorsData.sort((a, b) => b.weightedScore - a.weightedScore);
}

/**
 * Get all companies from the survey data
 * @returns {Array} Array of companies with respondent information
 */
export function getCompanies() {
    const surveyData = getSurveyData();
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
