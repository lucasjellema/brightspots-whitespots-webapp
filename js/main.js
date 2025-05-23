// Import modules
import { loadSurveyData, getSurveyData, getAllThemeAssessments } from './dataService.js';
import { loadOverviewContent } from './modules/tabs/overviewTab.js';
import { loadCustomerThemesContent } from './modules/tabs/customerThemesTab.js';
import { loadEmergingTechContent } from './modules/tabs/emergingTechTab.js';
import { loadTechnologyTrendsContent } from './modules/tabs/technologyTrendsTab.js';
import { loadCompaniesContent } from './modules/tabs/companiesTab.js';
import { loadRolesContent } from './modules/tabs/rolesTab.js';

// Main JavaScript file for Brightspots & Whitespots Dashboard

// Add a variable to track if charts have been initialized
let chartsInitialized = {
    'customer-themes': false,
    'emerging-tech': false,
    'technology-trends': false,
    'companies': false,
    'roles': false
};

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        // Load survey data first
        await loadSurveyData();
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const uuid = urlParams.get('uuid');
        
        if (uuid) {
            console.log('UUID parameter detected:', uuid);
            // Store the UUID in sessionStorage for the companies tab to use
            sessionStorage.setItem('selectedUuid', uuid);
            
            // Navigate to the companies tab
            const companiesTab = document.getElementById('companies-tab');
            if (companiesTab) {
                // Use Bootstrap's tab method to switch tabs
                const tab = new bootstrap.Tab(companiesTab);
                tab.show();
                
                // Explicitly load the companies tab content
                // This is needed because tab.show() doesn't automatically trigger the 'shown.bs.tab' event
                console.log('Explicitly loading companies tab content for UUID mode');
                await loadCompaniesContent();
            } else {
                console.error('Companies tab element not found');
                // Fall back to loading the overview tab
                await loadOverviewContent();
            }
        } else {
            // Load initial tab content (overview is active by default)
            await loadOverviewContent();
        }
        
        // Set up tab event listeners
        initializeTabEventListeners();
        
        // Check if admin mode is enabled
        checkAdminMode();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

/**
 * Check if admin mode is enabled via URL parameter and add download button if it is
 */
function checkAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminMode = urlParams.get('adminMode');
    
    if (adminMode === 'yes') {
        console.log('Admin mode enabled');
        
        // Create download button and add to header
        const header = document.querySelector('header .container');
        if (header) {
            const downloadButton = document.createElement('button');
            downloadButton.className = 'btn btn-sm btn-light mt-2';
            downloadButton.innerHTML = '<i class="bi bi-download"></i> Download Data';
            downloadButton.addEventListener('click', downloadDataset);
            header.appendChild(downloadButton);
        }
    }
}

/**
 * Download the current dataset as a JSON file
 */
function downloadDataset() {
    try {
        // Get the current survey data
        const surveyData = getSurveyData();
        
        // Get all theme assessments
        const themeAssessments = getAllThemeAssessments();
        
        // Create a complete data object that includes both survey data and theme assessments
        const completeData = {
            surveyData: surveyData,
            themeAssessments: themeAssessments
        };
        
        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(completeData, null, 2);
        
        // Create a blob with the data
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor to trigger the download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'brightspots_data_' + new Date().toISOString().split('T')[0] + '.json';
        
        // Append to body, click, and remove
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Release the URL object
        URL.revokeObjectURL(url);
        
        console.log('Data download initiated with theme assessments included');
    } catch (error) {
        console.error('Error downloading dataset:', error);
        alert('Failed to download data: ' + error.message);
    }
}

function initializeTabEventListeners() {
    // Add event listeners for tab switching
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetTabId = event.target.getAttribute('id');
            console.log('Tab switched to:', targetTabId);
            
            // Load content based on which tab was clicked
            switch (targetTabId) {
                case 'overview-tab':
                    loadOverviewContent();
                    break;
                case 'customer-themes-tab':
                    // Check if we're navigating from a tag click
                    const selectedTag = sessionStorage.getItem('selectedTag');
                    console.log('Loading customer themes with selected tag:', selectedTag);
                    loadCustomerThemesContent();
                    
                    // Ensure charts are initialized after content is loaded
                    setTimeout(() => {
                        const topChallengesChart = document.getElementById('topChallengesChart');
                        if (topChallengesChart && !chartsInitialized['customer-themes']) {
                            console.log('Forcing chart initialization for customer themes tab');
                            // Force chart creation
                            const event = new Event('chartinit');
                            topChallengesChart.dispatchEvent(event);
                            chartsInitialized['customer-themes'] = true;
                        }
                    }, 500);
                    break;
                case 'emerging-tech-tab':
                    // Check if we're navigating from a tech tag click
                    const selectedTechTag = sessionStorage.getItem('selectedTechTag');
                    console.log('Loading emerging tech with selected tag:', selectedTechTag);
                    loadEmergingTechContent();
                    break;
                case 'technology-trends-tab':
                    loadTechnologyTrendsContent();
                    break;
                case 'companies-tab':
                    loadCompaniesContent();
                    break;
                case 'roles-tab':
                    loadRolesContent();
                    break;
                default:
                    console.error('Unknown tab ID:', targetTabId);
            }
            
            // Trigger resize event to ensure charts render properly
            window.dispatchEvent(new Event('resize'));
        });
    });
}
