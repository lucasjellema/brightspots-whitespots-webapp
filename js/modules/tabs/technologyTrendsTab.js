// Technology Trends Tab Module
import { getProductsVendors } from '../../dataService.js';
import { formatRespondentsForTooltip } from '../../utils.js';

// Store chart instance to allow proper cleanup
let productsVendorsChartInstance = null;

/**
 * Load the technology trends tab content
 */
export async function loadTechnologyTrendsContent() {
    try {
        // Get the container element
        const container = document.getElementById('technology-trends-content');
        
        // Fetch the HTML template
        const response = await fetch('js/modules/tabs/templates/technology-trends.html');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status}`);
        }
        
        // Load the HTML template into the container
        const templateHtml = await response.text();
        container.innerHTML = templateHtml;
        
        // Get products/vendors data
        const productsVendors = getProductsVendors();
        
        // Create the products/vendors chart
        createProductsVendorsChart(productsVendors);
        
        // Initialize collapsible panel
        initializeCollapsePanel('productsVendorsCollapse', 'productsVendorsCollapseIcon');
        
    } catch (error) {
        console.error('Error loading technology trends content:', error);
    }
}

/**
 * Create a chart showing products and vendors by interest level
 */
function createProductsVendorsChart(productsVendors) {
    const ctx = document.getElementById('productsVendorsChart');
    
    if (!ctx) return;
    
    // Destroy existing chart if it exists to prevent duplicates
    if (productsVendorsChartInstance) {
        productsVendorsChartInstance.destroy();
        productsVendorsChartInstance = null;
    }
    
    // Sort products/vendors by weighted score (highest first)
    const sortedVendors = [...productsVendors].sort((a, b) => b.weightedScore - a.weightedScore);
    
    // Create datasets for the stacked bar chart
    const strongInterest = sortedVendors.map(vendor => vendor.interestCounts['Sterke, concrete interesse'] || 0);
    const reasonableInterest = sortedVendors.map(vendor => vendor.interestCounts['Redelijke interesse'] || 0);
    const vagueInterest = sortedVendors.map(vendor => vendor.interestCounts['Vage interesse'] || 0);
    const nothingHeard = sortedVendors.map(vendor => vendor.interestCounts['Niets over gehoord'] || 0);
    
    // Store respondent data for tooltips
    const respondentData = sortedVendors.reduce((acc, item) => {
        acc[item.vendor] = item.respondents || {};
        return acc;
    }, {});
    
    // Get vendor names for labels
    const vendorNames = sortedVendors.map(vendor => vendor.vendor);
    
    productsVendorsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: vendorNames,
            datasets: [
                {
                    label: 'Strong Interest',
                    data: strongInterest,
                    backgroundColor: 'rgba(235, 83, 83, 0.8)',
                    borderColor: 'rgba(235, 83, 83, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Reasonable Interest',
                    data: reasonableInterest,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Vague Interest',
                    data: vagueInterest,
                    backgroundColor: 'rgba(255, 159, 64, 0.8)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Nothing Heard',
                    data: nothingHeard,
                    backgroundColor: 'rgba(201, 203, 207, 0.8)',
                    borderColor: 'rgba(201, 203, 207, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // Basic label showing the count
                            return `${context.dataset.label}: ${context.raw}`;
                        },
                        afterLabel: function(context) {
                            // Get the vendor name and interest level
                            const vendor = vendorNames[context.dataIndex];
                            let interestLevel = '';
                            
                            // Determine which interest level this is
                            switch(context.dataset.label) {
                                case 'Strong Interest':
                                    interestLevel = 'Sterke, concrete interesse';
                                    break;
                                case 'Reasonable Interest':
                                    interestLevel = 'Redelijke interesse';
                                    break;
                                case 'Vague Interest':
                                    interestLevel = 'Vage interesse';
                                    break;
                                case 'Nothing Heard':
                                    interestLevel = 'Niets over gehoord';
                                    break;
                            }
                            
                            // Get respondents for this vendor and interest level
                            const respondents = respondentData[vendor] && respondentData[vendor][interestLevel];
                            
                            // Use the utility function to format respondents for tooltip
                            return formatRespondentsForTooltip(respondents);
                        }
                    },
                    titleFont: {
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    boxPadding: 3,
                    multiKeyBackground: 'transparent'
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Number of Responses'
                    }
                },
                y: {
                    stacked: true
                }
            }
        }
    });
}

/**
 * Helper function to initialize a collapsible panel
 */
function initializeCollapsePanel(collapseId, iconId) {
    const collapseElement = document.getElementById(collapseId);
    const iconElement = document.getElementById(iconId);
    
    if (!collapseElement || !iconElement) return;
    
    // Add event listener for bootstrap collapse events
    collapseElement.addEventListener('hidden.bs.collapse', function () {
        iconElement.classList.remove('bi-chevron-up');
        iconElement.classList.add('bi-chevron-down');
    });
    
    collapseElement.addEventListener('shown.bs.collapse', function () {
        iconElement.classList.remove('bi-chevron-down');
        iconElement.classList.add('bi-chevron-up');
    });
}