// Emerging Tech Tab Module
import { getEmergingTechTags, getEmergingTechEntries, getCompaniesByTag, findEntriesByTag, getTechnologyTrends } from '../../dataService.js';
import { formatRespondentsForTooltip } from '../../utils.js';

// Store tech tags marked for removal
let techTagsMarkedForRemoval = new Set();

/**
 * Load the emerging tech tab content
 */
export async function loadEmergingTechContent() {
    try {
        // Check if admin mode is enabled via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminMode = urlParams.get('admin') === 'yes';
        
        // Set global admin mode flag
        window.isAdminMode = isAdminMode;
        // Get the container element
        const container = document.getElementById('emerging-tech-content');
        
        // Fetch the HTML template
        const response = await fetch('js/modules/tabs/templates/emerging-tech.html');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status}`);
        }
        
        // Load the HTML template into the container
        const templateHtml = await response.text();
        container.innerHTML = templateHtml;
        
        // Check if there's a selected tag from the tag cloud
        const selectedTag = sessionStorage.getItem('selectedTechTag');
        console.log('Loading emerging tech tab with selected tag:', selectedTag);
        
        // Get emerging tech entries - filtered by tag if one is selected
        let techEntries = [];
        
        console.log('Loading emerging tech entries...');
        
        if (selectedTag && selectedTag.trim() !== '') {
            console.log('Filtering by tag:', selectedTag);
            techEntries = findEntriesByTag(selectedTag, 'tech');
            console.log('Found', techEntries.length, 'entries with tag:', selectedTag);
            
            // Show the clear filter button
            const clearFilterBtn = document.getElementById('clearTagFilter');
            if (clearFilterBtn) {
                clearFilterBtn.style.display = 'inline-block';
                clearFilterBtn.addEventListener('click', () => {
                    sessionStorage.removeItem('selectedTechTag');
                    loadEmergingTechContent();
                });
            }
            
            // Show filter info in the combined alert
            const filterInfo = document.getElementById('filter-info');
            const filterTag = document.getElementById('filter-tag');
            if (filterInfo && filterTag) {
                filterTag.textContent = selectedTag;
                filterInfo.style.display = 'block';
            }
            
            // Update the view status badge
            const viewStatus = document.getElementById('view-status');
            if (viewStatus) {
                viewStatus.textContent = `Filtered by tag: ${selectedTag}`;
                viewStatus.className = 'badge bg-primary';
            }
            
            // Add event listener to the inline clear filter button
            const inlineClearFilter = document.getElementById('inline-clear-filter');
            if (inlineClearFilter) {
                inlineClearFilter.addEventListener('click', () => {
                    sessionStorage.removeItem('selectedTechTag');
                    loadEmergingTechContent();
                });
            }
        } else {
            console.log('Loading all tech entries');
            techEntries = getEmergingTechEntries();
            console.log('Loaded', techEntries.length, 'total tech entries');
            
            // Hide the clear filter button
            const clearFilterBtn = document.getElementById('clearTagFilter');
            if (clearFilterBtn) {
                clearFilterBtn.style.display = 'none';
            }
            
            // Hide filter info in the combined alert
            const filterInfo = document.getElementById('filter-info');
            if (filterInfo) {
                filterInfo.style.display = 'none';
            }
            
            // Reset the view status badge
            const viewStatus = document.getElementById('view-status');
            if (viewStatus) {
                viewStatus.textContent = 'Showing all entries';
                viewStatus.className = 'badge bg-success';
            }
        }
        
        // Update the response count
        document.getElementById('tech-response-count').textContent = techEntries.length;
        
        // Populate tech entries container
        const techEntriesContainer = document.getElementById('techEntriesContainer');
        console.log('Tech entries container element:', techEntriesContainer);
        
        if (!techEntriesContainer) {
            console.error('Could not find tech entries container element!');
            return;
        }
        
        // Check if tech entries array is valid
        if (!Array.isArray(techEntries) || techEntries.length === 0) {
            console.warn('No tech entries to display or invalid tech entries array:', techEntries);
            techEntriesContainer.innerHTML = '<div class="col-12"><div class="alert alert-warning">No matching entries found.</div></div>';
            return;
        }
        
        // Generate HTML for tech entry cards
        const entriesHtml = techEntries.map(entry => {
            console.log('Processing tech entry:', entry);
            
            // Create tags display if available
            const tagsHtml = entry.tags && entry.tags.length > 0 
                ? `<div class="mt-2">
                    ${entry.tags.map(tag => {
                        // Highlight the selected tag with a different style
                        const isSelected = selectedTag && tag.toLowerCase() === selectedTag.toLowerCase();
                        const badgeClass = isSelected ? 'badge bg-warning text-dark me-1' : 'badge bg-info text-dark me-1';
                        return `<span class="${badgeClass}">${tag}</span>`;
                    }).join('')}
                </div>`
                : '';
            
            // Format the content with proper line breaks and highlighting
            const formattedContent = formatTechContent(entry.content, selectedTag);
            
            // Create the card HTML
            return `
                <div class="col-md-6 mb-4 tech-card">
                    <div class="card h-100">
                        <div class="card-header">
                            <h5 class="mb-0">${entry.name}</h5>
                            <span class="badge bg-secondary">${entry.company}</span>
                        </div>
                        <div class="card-body">
                            <div class="tech-content">${formattedContent}</div>
                            ${tagsHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Update the container with the generated HTML
        techEntriesContainer.innerHTML = entriesHtml;
        
        // Initialize search functionality
        initializeSearch();
        
        // Create the tag cloud
        createTagCloud();
        
        // Create top trends chart
        createTopTrendsChart();
        
        // Create all trends chart
        createAllTrendsChart();
        
        // Initialize collapsible panels
        initializeAllCollapsiblePanels();
        
        // Initialize the View All Trends button
        initializeViewAllTrendsButton();
        
        // Create tech keywords chart
        createTechKeywordsChart();
        
        // Add event listener for chart initialization events
        const topTrendsChart = document.getElementById('topTrendsChart');
        if (topTrendsChart) {
            topTrendsChart.addEventListener('chartinit', function() {
                console.log('Top trends chart initialization event received');
                createTopTrendsChart();
            });
        }
        
        const allTrendsChart = document.getElementById('allTrendsChart');
        if (allTrendsChart) {
            allTrendsChart.addEventListener('chartinit', function() {
                console.log('All trends chart initialization event received');
                createAllTrendsChart();
            });
        }
        
        // If in admin mode, initialize tag removal feature
        if (isAdminMode) {
            initializeTechTagRemovalFeature();
        } else {
            hideAdminFeatures();
        }
        
    } catch (error) {
        console.error('Error loading emerging tech content:', error);
    }
}

/**
 * Format tech content with proper line breaks and highlighting
 */
function formatTechContent(content, selectedTag = null) {
    if (!content) return '<em>No content provided</em>';
    
    // Replace line breaks with HTML line breaks
    let formatted = content.replace(/\n/g, '<br>');
    
    // For comma-separated values, show both original text and badges
    if (formatted.includes(',')) {
        const items = formatted.split(',').map(item => item.trim()).filter(item => item);
        
        // Filter out items that are too long (more than 15 characters)
        const filteredItems = items.filter(item => item.length <= 15);
        
        // Create badges for the items
        const badgesHtml = filteredItems.map(item => {
            // If this is the selected tag, use a different highlight style
            if (selectedTag && item.toLowerCase() === selectedTag.toLowerCase()) {
                return `<span class="badge bg-warning text-dark me-1 mb-1">${item}</span>`;
            } else {
                return `<span class="badge bg-info text-dark me-1 mb-1">${item}</span>`;
            }
        }).join(' ');
        
        // Return both the original text and the badges
        return `
            <div class="mb-3">
                 ${formatted}
            </div>
            <div>
                <strong>Technologies:</strong><br>
                ${badgesHtml}
            </div>
        `;
    }
    
    // For non-comma-separated content, highlight key terms
    const keyTerms = getEmergingTechTags()
        .map(tag => tag.tag)
        .filter(tag => tag.length <= 15); // Filter out tags longer than 15 characters
    
    keyTerms.forEach(term => {
        // Escape special regex characters
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        // If this is the selected tag, use a different highlight style
        if (selectedTag && term.toLowerCase() === selectedTag.toLowerCase()) {
            formatted = formatted.replace(regex, '<span class="text-danger fw-bold bg-warning bg-opacity-25 px-1 rounded">$1</span>');
        } else {
            formatted = formatted.replace(regex, '<span class="text-primary fw-bold">$1</span>');
        }
    });
    
    return formatted;
}

/**
 * Initialize search functionality for tech entries
 */
function initializeSearch() {
    const searchInput = document.getElementById('techSearch');
    const searchBtn = document.getElementById('techSearchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const techEntriesContainer = document.getElementById('techEntriesContainer');
    const techCards = techEntriesContainer.querySelectorAll('.tech-card');
    
    // Original search elements
    const searchResultsAlert = document.getElementById('search-results-alert');
    const searchResultsCount = document.getElementById('search-results-count');
    const searchTermDisplay = document.getElementById('search-term');
    
    // New inline search elements
    const searchInfo = document.getElementById('search-info');
    const inlineSearchTerm = document.getElementById('inline-search-term');
    const inlineSearchCount = document.getElementById('inline-search-count');
    const inlineClearSearch = document.getElementById('inline-clear-search');
    
    const performSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // If search term is empty, show all cards and hide search results alert
        if (!searchTerm) {
            techCards.forEach(card => card.style.display = '');
            searchInfo.style.display = 'none';
            searchResultsAlert.style.display = 'none';
            return;
        }
        
        let matchCount = 0;
        
        techCards.forEach(card => {
            const content = card.querySelector('.tech-content').textContent.toLowerCase();
            const name = card.querySelector('.card-header h5').textContent.toLowerCase();
            const company = card.querySelector('.badge').textContent.toLowerCase();
            
            // Get tags if they exist
            const tagElements = card.querySelectorAll('.badge.bg-info');
            const tags = Array.from(tagElements).map(tag => tag.textContent.toLowerCase());
            
            // Check if search term is in content, name, company or any of the tags
            if (content.includes(searchTerm) || 
                name.includes(searchTerm) || 
                company.includes(searchTerm) ||
                tags.some(tag => tag.includes(searchTerm))) {
                card.style.display = '';
                matchCount++;
            } else {
                card.style.display = 'none';
            }
        });
        
        // Update search results in both places
        // 1. Original search results alert (now hidden by default)
        searchResultsCount.textContent = matchCount;
        searchTermDisplay.textContent = searchInput.value;
        searchResultsAlert.style.display = 'none'; // Hide the original alert
        
        // 2. New inline search info
        inlineSearchTerm.textContent = searchInput.value;
        inlineSearchCount.textContent = matchCount;
        searchInfo.style.display = 'inline-block';
        
        // 3. Update the view status badge
        const viewStatus = document.getElementById('view-status');
        if (viewStatus) {
            viewStatus.textContent = `Search: "${searchInput.value}" (${matchCount} results)`;
            viewStatus.className = 'badge bg-secondary';
        }
    };
    
    const clearSearch = () => {
        searchInput.value = '';
        techCards.forEach(card => card.style.display = '');
        searchInfo.style.display = 'none';
        searchResultsAlert.style.display = 'none';
        
        // Reset the view status badge
        const viewStatus = document.getElementById('view-status');
        if (viewStatus) {
            // Check if we have a tag filter active
            const filterInfo = document.getElementById('filter-info');
            if (filterInfo && filterInfo.style.display === 'block') {
                const filterTag = document.getElementById('filter-tag');
                viewStatus.textContent = `Filtered by tag: ${filterTag.textContent}`;
                viewStatus.className = 'badge bg-primary';
            } else {
                viewStatus.textContent = 'Showing all entries';
                viewStatus.className = 'badge bg-success';
            }
        }
    };
    
    // Add event listener for the new inline clear search button
    if (inlineClearSearch) {
        inlineClearSearch.addEventListener('click', clearSearch);
    }
    
    searchBtn.addEventListener('click', performSearch);
    
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    clearSearchBtn.addEventListener('click', clearSearch);
}

/**
 * Create a tag cloud for tech tags
 */
function createTagCloud() {
    const tagCloudContainer = document.getElementById('emerging-tech-tag-cloud');
    const tagCompaniesContainer = document.getElementById('tech-tag-companies');
    const selectedTagElement = document.getElementById('selected-tech-tag');
    const companiesListElement = document.getElementById('tech-companies-list');
    
    if (!tagCloudContainer) return;
    
    // Clear existing content
    tagCloudContainer.innerHTML = '';
    
    // Get tag data
    const tagData = getEmergingTechTags();
    console.log('Tag data for cloud:', tagData);
    
    // Check if we have any tags
    if (!tagData || tagData.length === 0) {
        tagCloudContainer.innerHTML = '<div class="alert alert-info">No tech tags found in the data. Tags will appear here when available.</div>';
        return;
    }
    
    // Filter out tags that are too long (more than 15 characters)
    const filteredTags = tagData.filter(tag => tag.tag.length <= 15);
    
    // Filter to top 50 tags to avoid overcrowding
    const topTags = filteredTags.slice(0, 50);
    
    // Find min and max frequencies for scaling
    const minFrequency = Math.min(...topTags.map(t => t.frequency));
    const maxFrequency = Math.max(...topTags.map(t => t.frequency));
    
    // Scale font size between 10px and 32px based on frequency
    const scaleFontSize = (frequency) => {
        if (maxFrequency === minFrequency) return 18; // If all tags have same frequency
        return 10 + ((frequency - minFrequency) / (maxFrequency - minFrequency)) * 22;
    };
    
    // Generate random pastel colors
    const getRandomPastelColor = () => {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 70%, 80%)`;
    };
    
    // Create tag elements
    topTags.forEach(({ tag, frequency }) => {
        // Create tag element
        const tagElement = document.createElement('span');
        tagElement.className = 'tag-item';
        tagElement.style.fontSize = `${scaleFontSize(frequency)}px`;
        tagElement.style.backgroundColor = getRandomPastelColor();
        tagElement.style.padding = '6px 12px';
        tagElement.style.margin = '5px';
        tagElement.style.display = 'inline-block';
        tagElement.style.borderRadius = '20px';
        tagElement.style.cursor = 'pointer';
        tagElement.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        // Create tag text
        const tagText = document.createTextNode(tag);
        tagElement.appendChild(tagText);
        
        // Add hover effect
        tagElement.addEventListener('mouseover', () => {
            tagElement.style.transform = 'scale(1.05)';
            tagElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            tagElement.style.color = '#0d6efd';
        });
        
        tagElement.addEventListener('mouseout', () => {
            tagElement.style.transform = '';
            tagElement.style.boxShadow = '';
            tagElement.style.color = '';
        });
        
        // Add click handler to filter entries by tag
        tagElement.addEventListener('click', () => {
            // Store the selected tag in sessionStorage
            sessionStorage.setItem('selectedTechTag', tag);
            
            // Reload the content with the filter applied
            // This will use the existing filtering mechanism in loadEmergingTechContent
            loadEmergingTechContent();
            
            // Add event listener to the mark for removal button
            const markForRemovalBtn = document.getElementById('mark-tech-tag-for-removal');
            if (markForRemovalBtn) {
                // Remove any existing event listeners
                const newMarkForRemovalBtn = markForRemovalBtn.cloneNode(true);
                markForRemovalBtn.parentNode.replaceChild(newMarkForRemovalBtn, markForRemovalBtn);
                
                // Add new event listener
                newMarkForRemovalBtn.addEventListener('click', () => {
                    techTagsMarkedForRemoval.add(tag);
                    updateTechRemovalTagList();
                });
            }
        });
        
        tagCloudContainer.appendChild(tagElement);
    });
}

/**
 * Initialize the collapsible panel functionality for the tag cloud
 */
function initializeCollapsiblePanel() {
    const collapseElement = document.getElementById('tagCloudCollapse');
    const collapseIcon = document.getElementById('tagCloudCollapseIcon');
    
    if (!collapseElement || !collapseIcon) {
        console.error('Could not find collapse elements');
        return;
    }
    
    console.log('Initializing collapsible panel with elements:', { collapseElement, collapseIcon });
    
    // Initialize the collapse component explicitly
    const bsCollapse = new bootstrap.Collapse(collapseElement, {
        toggle: false
    });
    
    // Add event listeners to update the icon
    collapseElement.addEventListener('show.bs.collapse', () => {
        collapseIcon.classList.remove('bi-chevron-down');
        collapseIcon.classList.add('bi-chevron-up');
    });
    
    collapseElement.addEventListener('hide.bs.collapse', () => {
        collapseIcon.classList.remove('bi-chevron-up');
        collapseIcon.classList.add('bi-chevron-down');
    });
}

// Store chart instances to allow proper cleanup
let topTrendsChartInstance = null;
let allTrendsChartInstance = null;
let techKeywordsChartInstance = null;

/**
 * Create a chart showing the top 10 technology trends by interest level
 */
function createTopTrendsChart() {
    try {
        console.log('Starting to create top trends chart');
        const ctx = document.getElementById('topTrendsChart');
        
        if (!ctx) {
            console.error('Could not find topTrendsChart canvas element');
            return;
        }
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            // Try to load Chart.js dynamically if it's not available
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = function() {
                console.log('Chart.js loaded dynamically');
                // Try creating the chart again after Chart.js is loaded
                setTimeout(createTopTrendsChart, 100);
            };
            document.head.appendChild(script);
            return;
        }
        
        console.log('Canvas element found, Chart.js is available');
        
        // Destroy existing chart if it exists to prevent duplicates
        if (topTrendsChartInstance) {
            console.log('Destroying existing chart instance');
            topTrendsChartInstance.destroy();
            topTrendsChartInstance = null;
        }
        
        // Make sure the canvas is visible and has proper dimensions
        ctx.style.display = 'block';
        ctx.height = 400; // Set explicit height
        
        // Get trends data from the data service and sort by weighted score
        let trendsData = getTechnologyTrends();
        console.log('Trends data from service:', trendsData);
        
        // Declare variables at the top level so they're accessible throughout the function
        let trends = [];
        let strongInterest = [];
        let reasonableInterest = [];
        let vagueInterest = [];
        let nothingHeard = [];
        let respondentData = {}; // Store respondent information for tooltips
        
        if (trendsData && trendsData.length > 0) {
            // Sort trends by weighted score (highest first)
            trendsData.sort((a, b) => b.weightedScore - a.weightedScore);
            console.log('Sorted trends data:', trendsData);
            
            // Get top 10 trends
            const top10Trends = trendsData.slice(0, 10);
            
            // Store respondent data for tooltips
            respondentData = top10Trends.reduce((acc, item) => {
                acc[item.concept] = item.respondents || {};
                return acc;
            }, {});
            
            // Extract trend names and interest level counts
            trends = top10Trends.map(item => item.concept);
            strongInterest = top10Trends.map(item => item.interestCounts['Sterke, concrete interesse'] || 0);
            reasonableInterest = top10Trends.map(item => item.interestCounts['Redelijke interesse'] || 0);
            vagueInterest = top10Trends.map(item => item.interestCounts['Vage interesse'] || 0);
            nothingHeard = top10Trends.map(item => item.interestCounts['Niets over gehoord'] || 0);
        } else {
            // If we couldn't get data from the service, use calculated fallback data
            console.warn('No trends data available, using fallback data');
            
            // Create fallback data with interest counts and sample respondent data
            const fallbackData = [
                { concept: 'AI / Machine Learning', interestCounts: { 'Sterke, concrete interesse': 15, 'Redelijke interesse': 10, 'Vage interesse': 5, 'Niets over gehoord': 2 } },
                { concept: 'Cloud Computing', interestCounts: { 'Sterke, concrete interesse': 14, 'Redelijke interesse': 12, 'Vage interesse': 4, 'Niets over gehoord': 1 } },
                { concept: 'Cybersecurity', interestCounts: { 'Sterke, concrete interesse': 13, 'Redelijke interesse': 11, 'Vage interesse': 6, 'Niets over gehoord': 2 } },
                { concept: 'Data Analytics', interestCounts: { 'Sterke, concrete interesse': 12, 'Redelijke interesse': 13, 'Vage interesse': 5, 'Niets over gehoord': 1 } },
                { concept: 'Automation', interestCounts: { 'Sterke, concrete interesse': 11, 'Redelijke interesse': 12, 'Vage interesse': 7, 'Niets over gehoord': 2 } },
                { concept: 'IoT', interestCounts: { 'Sterke, concrete interesse': 10, 'Redelijke interesse': 11, 'Vage interesse': 8, 'Niets over gehoord': 3 } },
                { concept: 'Blockchain', interestCounts: { 'Sterke, concrete interesse': 9, 'Redelijke interesse': 10, 'Vage interesse': 9, 'Niets over gehoord': 4 } },
                { concept: 'DevOps', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 14, 'Vage interesse': 7, 'Niets over gehoord': 3 } },
                { concept: 'Microservices', interestCounts: { 'Sterke, concrete interesse': 7, 'Redelijke interesse': 13, 'Vage interesse': 8, 'Niets over gehoord': 4 } },
                { concept: 'Serverless', interestCounts: { 'Sterke, concrete interesse': 6, 'Redelijke interesse': 12, 'Vage interesse': 10, 'Niets over gehoord': 4 } }
            ];
            
            // Add sample respondent data for fallback
            fallbackData.forEach(item => {
                item.respondents = {
                    'Sterke, concrete interesse': Array(item.interestCounts['Sterke, concrete interesse']).fill().map((_, i) => ({
                        company: `Company ${i+1}`,
                        name: i % 2 === 0 ? `Person ${i+1}` : '',
                        role: i % 3 === 0 ? `Role ${i+1}` : '' // Add role for some entries
                    })),
                    'Redelijke interesse': Array(item.interestCounts['Redelijke interesse']).fill().map((_, i) => ({
                        company: `Company ${i+10}`,
                        name: i % 2 === 0 ? `Person ${i+10}` : '',
                        role: i % 3 === 0 ? `Role ${i+10}` : '' // Add role for some entries
                    })),
                    'Vage interesse': Array(item.interestCounts['Vage interesse']).fill().map((_, i) => ({
                        company: `Company ${i+20}`,
                        name: i % 2 === 0 ? `Person ${i+20}` : '',
                        role: i % 3 === 0 ? `Role ${i+20}` : '' // Add role for some entries
                    })),
                    'Niets over gehoord': Array(item.interestCounts['Niets over gehoord']).fill().map((_, i) => ({
                        company: `Company ${i+30}`,
                        name: i % 2 === 0 ? `Person ${i+30}` : '',
                        role: i % 3 === 0 ? `Role ${i+30}` : '' // Add role for some entries
                    }))
                };
            });
            
            // Calculate weighted score for each trend
            fallbackData.forEach(item => {
                // Same weighted score calculation as in dataService.js
                const counts = item.interestCounts;
                item.weightedScore = (
                    counts['Sterke, concrete interesse'] * 3 +
                    counts['Redelijke interesse'] * 2 +
                    counts['Vage interesse'] * 1
                ) / (counts['Sterke, concrete interesse'] + counts['Redelijke interesse'] + counts['Vage interesse'] + counts['Niets over gehoord']);
            });
            
            // Sort by weighted score
            fallbackData.sort((a, b) => b.weightedScore - a.weightedScore);
            console.log('Sorted fallback data:', fallbackData);
            
            // Extract data for chart
            trends = fallbackData.map(item => item.concept);
            strongInterest = fallbackData.map(item => item.interestCounts['Sterke, concrete interesse']);
            reasonableInterest = fallbackData.map(item => item.interestCounts['Redelijke interesse']);
            vagueInterest = fallbackData.map(item => item.interestCounts['Vage interesse']);
            nothingHeard = fallbackData.map(item => item.interestCounts['Niets over gehoord']);
            
            // Store respondent data for tooltips
            respondentData = fallbackData.reduce((acc, item) => {
                acc[item.concept] = item.respondents || {};
                return acc;
            }, {});
        }
        
        console.log('Using trends data for chart');
        console.log('Trends:', trends);
        console.log('Data arrays:', { strongInterest, reasonableInterest, vagueInterest, nothingHeard });
        
        // Create chart and store the instance
        topTrendsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trends,
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
                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Responses'
                        },
                        grid: {
                            display: true
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Technology Trends'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                // Basic label showing the count
                                return `${context.dataset.label}: ${context.raw}`;
                            },
                            afterLabel: function(context) {
                                // Get the trend name and interest level
                                const trend = trends[context.dataIndex];
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
                                
                                // Get respondents for this trend and interest level
                                const respondents = respondentData[trend] && respondentData[trend][interestLevel];
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
                }
            }
        });
    } catch (error) {
        console.error('Error creating top trends chart:', error);
    }
}

/**
 * Create a chart showing all technology trends by interest level
 */
function createAllTrendsChart() {
    try {
        console.log('Starting to create all trends chart');
        const ctx = document.getElementById('allTrendsChart');
        
        if (!ctx) {
            console.error('Could not find allTrendsChart canvas element');
            return;
        }
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            // Try to load Chart.js dynamically if it's not available
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = function() {
                console.log('Chart.js loaded dynamically');
                // Try creating the chart again after Chart.js is loaded
                setTimeout(createAllTrendsChart, 100);
            };
            document.head.appendChild(script);
            return;
        }
        
        console.log('Canvas element found, Chart.js is available');
        
        // Destroy existing chart if it exists to prevent duplicates
        if (allTrendsChartInstance) {
            console.log('Destroying existing all trends chart instance');
            allTrendsChartInstance.destroy();
            allTrendsChartInstance = null;
        }
        
        // Make sure the canvas is visible and has proper dimensions
        ctx.style.display = 'block';
        ctx.height = 600; // Set explicit height for all trends (larger than top 10)
        
        // Get trends data from the data service and sort by weighted score
        let trendsData = getTechnologyTrends();
        console.log('All trends data from service:', trendsData);
        
        // Declare variables for chart data
        let trends = [];
        let strongInterest = [];
        let reasonableInterest = [];
        let vagueInterest = [];
        let nothingHeard = [];
        let respondentData = {}; // Store respondent information for tooltips
        
        if (trendsData && trendsData.length > 0) {
            // Sort trends by weighted score (highest first)
            trendsData.sort((a, b) => b.weightedScore - a.weightedScore);
            console.log('Sorted all trends data:', trendsData);
            
            // Use all trends, not just top 10
            // Store respondent data for tooltips
            respondentData = trendsData.reduce((acc, item) => {
                acc[item.concept] = item.respondents || {};
                return acc;
            }, {});
            
            // Extract trend names and interest level counts
            trends = trendsData.map(item => item.concept);
            strongInterest = trendsData.map(item => item.interestCounts['Sterke, concrete interesse'] || 0);
            reasonableInterest = trendsData.map(item => item.interestCounts['Redelijke interesse'] || 0);
            vagueInterest = trendsData.map(item => item.interestCounts['Vage interesse'] || 0);
            nothingHeard = trendsData.map(item => item.interestCounts['Niets over gehoord'] || 0);
        } else {
            // If we couldn't get data from the service, use calculated fallback data
            console.warn('No trends data available, using fallback data');
            
            // Create fallback data with interest counts and sample respondent data
            // This is the same as in createTopTrendsChart but we'll use more items
            const fallbackData = [
                { concept: 'AI / Machine Learning', interestCounts: { 'Sterke, concrete interesse': 15, 'Redelijke interesse': 10, 'Vage interesse': 5, 'Niets over gehoord': 2 } },
                { concept: 'Cloud Computing', interestCounts: { 'Sterke, concrete interesse': 14, 'Redelijke interesse': 12, 'Vage interesse': 4, 'Niets over gehoord': 1 } },
                { concept: 'Cybersecurity', interestCounts: { 'Sterke, concrete interesse': 13, 'Redelijke interesse': 11, 'Vage interesse': 6, 'Niets over gehoord': 2 } },
                { concept: 'Data Analytics', interestCounts: { 'Sterke, concrete interesse': 12, 'Redelijke interesse': 13, 'Vage interesse': 5, 'Niets over gehoord': 1 } },
                { concept: 'Automation', interestCounts: { 'Sterke, concrete interesse': 11, 'Redelijke interesse': 12, 'Vage interesse': 7, 'Niets over gehoord': 2 } },
                { concept: 'IoT', interestCounts: { 'Sterke, concrete interesse': 10, 'Redelijke interesse': 11, 'Vage interesse': 8, 'Niets over gehoord': 3 } },
                { concept: 'Blockchain', interestCounts: { 'Sterke, concrete interesse': 9, 'Redelijke interesse': 10, 'Vage interesse': 9, 'Niets over gehoord': 4 } },
                { concept: 'DevOps', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 14, 'Vage interesse': 7, 'Niets over gehoord': 3 } },
                { concept: 'Microservices', interestCounts: { 'Sterke, concrete interesse': 7, 'Redelijke interesse': 13, 'Vage interesse': 8, 'Niets over gehoord': 4 } },
                { concept: 'Serverless', interestCounts: { 'Sterke, concrete interesse': 6, 'Redelijke interesse': 12, 'Vage interesse': 10, 'Niets over gehoord': 4 } },
                // Additional fallback items for the all trends chart
                { concept: 'Kubernetes', interestCounts: { 'Sterke, concrete interesse': 5, 'Redelijke interesse': 11, 'Vage interesse': 9, 'Niets over gehoord': 5 } },
                { concept: 'Edge Computing', interestCounts: { 'Sterke, concrete interesse': 4, 'Redelijke interesse': 10, 'Vage interesse': 11, 'Niets over gehoord': 6 } },
                { concept: 'Quantum Computing', interestCounts: { 'Sterke, concrete interesse': 3, 'Redelijke interesse': 9, 'Vage interesse': 12, 'Niets over gehoord': 7 } },
                { concept: '5G Technology', interestCounts: { 'Sterke, concrete interesse': 5, 'Redelijke interesse': 8, 'Vage interesse': 10, 'Niets over gehoord': 8 } },
                { concept: 'Digital Twins', interestCounts: { 'Sterke, concrete interesse': 4, 'Redelijke interesse': 7, 'Vage interesse': 13, 'Niets over gehoord': 9 } }
            ];
            
            // Add sample respondent data for fallback
            fallbackData.forEach(item => {
                item.respondents = {
                    'Sterke, concrete interesse': Array(item.interestCounts['Sterke, concrete interesse']).fill().map((_, i) => ({
                        company: `Company ${i+1}`,
                        name: i % 2 === 0 ? `Person ${i+1}` : '',
                        role: i % 3 === 0 ? `Role ${i+1}` : '' // Add role for some entries
                    })),
                    'Redelijke interesse': Array(item.interestCounts['Redelijke interesse']).fill().map((_, i) => ({
                        company: `Company ${i+10}`,
                        name: i % 2 === 0 ? `Person ${i+10}` : '',
                        role: i % 3 === 0 ? `Role ${i+10}` : '' // Add role for some entries
                    })),
                    'Vage interesse': Array(item.interestCounts['Vage interesse']).fill().map((_, i) => ({
                        company: `Company ${i+20}`,
                        name: i % 2 === 0 ? `Person ${i+20}` : '',
                        role: i % 3 === 0 ? `Role ${i+20}` : '' // Add role for some entries
                    })),
                    'Niets over gehoord': Array(item.interestCounts['Niets over gehoord']).fill().map((_, i) => ({
                        company: `Company ${i+30}`,
                        name: i % 2 === 0 ? `Person ${i+30}` : '',
                        role: i % 3 === 0 ? `Role ${i+30}` : '' // Add role for some entries
                    }))
                };
            });
            
            // Calculate weighted score for each trend
            fallbackData.forEach(item => {
                // Same weighted score calculation as in dataService.js
                const counts = item.interestCounts;
                item.weightedScore = (
                    counts['Sterke, concrete interesse'] * 3 +
                    counts['Redelijke interesse'] * 2 +
                    counts['Vage interesse'] * 1
                ) / (counts['Sterke, concrete interesse'] + counts['Redelijke interesse'] + counts['Vage interesse'] + counts['Niets over gehoord']);
            });
            
            // Sort by weighted score
            fallbackData.sort((a, b) => b.weightedScore - a.weightedScore);
            console.log('Sorted fallback data for all trends:', fallbackData);
            
            // Extract data for chart
            trends = fallbackData.map(item => item.concept);
            strongInterest = fallbackData.map(item => item.interestCounts['Sterke, concrete interesse']);
            reasonableInterest = fallbackData.map(item => item.interestCounts['Redelijke interesse']);
            vagueInterest = fallbackData.map(item => item.interestCounts['Vage interesse']);
            nothingHeard = fallbackData.map(item => item.interestCounts['Niets over gehoord']);
            
            // Store respondent data for tooltips
            respondentData = fallbackData.reduce((acc, item) => {
                acc[item.concept] = item.respondents || {};
                return acc;
            }, {});
        }
        
        console.log('Using trends data for all trends chart');
        console.log('All trends:', trends);
        console.log('Data arrays for all trends:', { strongInterest, reasonableInterest, vagueInterest, nothingHeard });
        
        // Create chart and store the instance - same configuration as top trends chart
        allTrendsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: trends,
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
                scales: {
                    x: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Responses'
                        },
                        grid: {
                            display: true
                        }
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Technology Trends'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                // Basic label showing the count
                                return `${context.dataset.label}: ${context.raw}`;
                            },
                            afterLabel: function(context) {
                                // Get the trend name and interest level
                                const trend = trends[context.dataIndex];
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
                                
                                // Get respondents for this trend and interest level
                                const respondents = respondentData[trend] && respondentData[trend][interestLevel];
                                
                                if (!respondents || respondents.length === 0) {
                                    return 'No respondent data available';
                                }
                                
                                // Format respondent information
                                const lines = respondents.map(resp => {
                                    if (resp.role && resp.role.trim() !== '') {
                                        // If role is available, only show the name
                                        return resp.name && resp.name.trim() !== '' ? resp.name + ' (' + resp.role + ')' : 'Anonymous';
                                    } else {
                                        // If no role, only show company
                                        return resp.company;
                                    }
                                });
                                
                                // Limit to 10 respondents to avoid tooltip overflow
                                if (lines.length > 10) {
                                    return lines.slice(0, 10).join('\n') + `\n...and ${lines.length - 10} more`;
                                }
                                
                                return lines.join('\n');
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
                }
            }
        });
    } catch (error) {
        console.error('Error creating all trends chart:', error);
    }
}

/**
 * Initialize the View All Trends button
 */
function initializeViewAllTrendsButton() {
    const viewAllTrendsBtn = document.getElementById('viewAllTrendsBtn');
    if (!viewAllTrendsBtn) {
        console.error('Could not find View All Trends button');
        return;
    }
    
    viewAllTrendsBtn.addEventListener('click', function() {
        // Find the All Trends section
        const allTrendsSection = document.getElementById('allTrendsCollapse');
        if (!allTrendsSection) {
            console.error('Could not find All Trends section');
            return;
        }
        
        // Make sure the All Trends section is expanded
        const bsCollapse = bootstrap.Collapse.getInstance(allTrendsSection);
        if (bsCollapse && !allTrendsSection.classList.contains('show')) {
            bsCollapse.show();
        }
        
        // Scroll to the All Trends section with smooth animation
        // Find the card containing the All Trends section using a more compatible approach
        const allTrendsElement = document.getElementById('allTrendsChart');
        if (allTrendsElement) {
            // Find the closest card parent
            let cardElement = allTrendsElement;
            while (cardElement && !cardElement.classList.contains('card')) {
                cardElement = cardElement.parentElement;
            }
            
            // Scroll to the card if found, otherwise scroll to the chart element
            if (cardElement) {
                cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                allTrendsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
}

/**
 * Create a keywords chart for technology terms
 */
function createTechKeywordsChart() {
    try {
        console.log('Starting to create tech keywords chart');
        const ctx = document.getElementById('techKeywordsChart');
        
        if (!ctx) {
            console.error('Could not find techKeywordsChart canvas element');
            return;
        }
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            return;
        }
        
        // Destroy existing chart if it exists to prevent duplicates
        if (techKeywordsChartInstance) {
            console.log('Destroying existing tech keywords chart instance');
            techKeywordsChartInstance.destroy();
            techKeywordsChartInstance = null;
        }
        
        // Get tech tags with frequencies
        const techTags = getEmergingTechTags();
        console.log('Tech tags for keywords chart:', techTags);
        
        if (!techTags || techTags.length === 0) {
            console.warn('No tech tags available for keywords chart');
            return;
        }
        
        // Sort by frequency (highest first) and take top 15
        const sortedTags = [...techTags].sort((a, b) => b.frequency - a.frequency).slice(0, 15);
        
        // Extract labels and data
        const labels = sortedTags.map(tag => tag.tag);
        const data = sortedTags.map(tag => tag.frequency);
        
        // Create chart
        techKeywordsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Keywords'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Mentioned ${context.raw} times`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating tech keywords chart:', error);
    }
}

/**
 * Initialize all collapsible panels in the emerging tech tab
 */
function initializeAllCollapsiblePanels() {
    // Initialize tag cloud collapse panel
    initializeCollapsePanel('tagCloudCollapse', 'tagCloudCollapseIcon');
    
    // Initialize top trends collapse panel
    initializeCollapsePanel('topTrendsCollapse', 'topTrendsCollapseIcon');
    
    // Initialize tech overview collapse panel
    initializeCollapsePanel('techOverviewCollapse', 'techOverviewCollapseIcon');
    
    // Initialize tech keywords chart collapse panel
    initializeCollapsePanel('techKeywordsChartCollapse', 'techKeywordsChartCollapseIcon');
    
    // Initialize all trends collapse panel
    initializeCollapsePanel('allTrendsCollapse', 'allTrendsCollapseIcon');
}

/**
 * Helper function to initialize a collapsible panel
 */
function initializeCollapsePanel(collapseId, iconId) {
    const collapseElement = document.getElementById(collapseId);
    const collapseIcon = document.getElementById(iconId);
    
    if (collapseElement && collapseIcon) {
        collapseElement.addEventListener('show.bs.collapse', function () {
            collapseIcon.classList.remove('bi-chevron-down');
            collapseIcon.classList.add('bi-chevron-up');
        });
        
        collapseElement.addEventListener('hide.bs.collapse', function () {
            collapseIcon.classList.remove('bi-chevron-up');
            collapseIcon.classList.add('bi-chevron-down');
        });
    }
}

/**
 * Hide admin features when not in admin mode
 */
function hideAdminFeatures() {
    // Hide the mark for removal button in the tag details
    const markForRemovalBtn = document.getElementById('mark-tech-tag-for-removal');
    if (markForRemovalBtn) {
        markForRemovalBtn.style.display = 'none';
    }
    
    // Hide the entire tags marked for removal section
    const tagsToRemoveSection = document.querySelector('#tech-tags-to-remove').closest('.mt-4');
    if (tagsToRemoveSection) {
        tagsToRemoveSection.style.display = 'none';
    }
}

/**
 * Initialize the tech tag removal feature
 */
function initializeTechTagRemovalFeature() {
    // Get elements
    const copyTagsBtn = document.getElementById('copy-tech-tags-to-clipboard');
    const clearTagsBtn = document.getElementById('clear-tech-tags-to-remove');
    
    if (!copyTagsBtn || !clearTagsBtn) {
        console.error('Could not find tag removal buttons');
        return;
    }
    
    // Add event listeners
    copyTagsBtn.addEventListener('click', () => {
        const tagsArray = Array.from(techTagsMarkedForRemoval);
        const tagsJson = JSON.stringify(tagsArray);
        
        // Copy to clipboard
        navigator.clipboard.writeText(tagsJson).then(() => {
            alert('Tags copied to clipboard as JSON array');
        }).catch(err => {
            console.error('Failed to copy tags:', err);
            alert('Failed to copy tags. See console for details.');
        });
    });
    
    clearTagsBtn.addEventListener('click', () => {
        techTagsMarkedForRemoval.clear();
        updateTechRemovalTagList();
    });
    
    // Initialize the removal tag list
    updateTechRemovalTagList();
}

/**
 * Update the display of tech tags marked for removal
 */
function updateTechRemovalTagList() {
    const removalTagList = document.getElementById('tech-removal-tag-list');
    if (!removalTagList) return;
    
    // Clear existing content
    removalTagList.innerHTML = '';
    
    // If no tags, show a message
    if (techTagsMarkedForRemoval.size === 0) {
        removalTagList.innerHTML = '<span class="text-muted">No tags marked for removal yet.</span>';
        return;
    }
    
    // Create elements for each tag
    Array.from(techTagsMarkedForRemoval).sort().forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'badge bg-danger text-white d-flex align-items-center';
        tagElement.style.padding = '6px 10px';
        
        const tagText = document.createElement('span');
        tagText.textContent = tag;
        tagElement.appendChild(tagText);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-close btn-close-white ms-2';
        removeBtn.style.fontSize = '0.65rem';
        removeBtn.setAttribute('aria-label', 'Remove tag');
        removeBtn.addEventListener('click', () => {
            techTagsMarkedForRemoval.delete(tag);
            updateTechRemovalTagList();
        });
        
        tagElement.appendChild(removeBtn);
        removalTagList.appendChild(tagElement);
    });
}

// Note: getEmergingTechEntries is now imported from dataService.js
