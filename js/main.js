// Import modules
import { loadSurveyData } from './dataService.js';
import { loadOverviewContent } from './modules/tabs/overviewTab.js';
import { loadCustomerThemesContent } from './modules/tabs/customerThemesTab.js';
import { loadEmergingTechContent } from './modules/tabs/emergingTechTab.js';
import { loadTechnologyTrendsContent } from './modules/tabs/technologyTrendsTab.js';
import { loadCompaniesContent } from './modules/tabs/companiesTab.js';

// Main JavaScript file for Brightspots & Whitespots Dashboard

// Add a variable to track if charts have been initialized
let chartsInitialized = {
    'customer-themes': false,
    'emerging-tech': false,
    'technology-trends': false,
    'companies': false
};

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        // Load survey data first
        await loadSurveyData();
        
        // Load initial tab content (overview is active by default)
        await loadOverviewContent();
        
        // Set up tab event listeners
        initializeTabEventListeners();
    } catch (error) {
        console.error('Error initializing application:', error);
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
                default:
                    console.error('Unknown tab ID:', targetTabId);
            }
            
            // Trigger resize event to ensure charts render properly
            window.dispatchEvent(new Event('resize'));
        });
    });
}
