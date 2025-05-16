// Customer Themes Tab Module
import { getCustomerThemes, findEntriesByTag, getCustomerThemeTags, getCompaniesByTag, getChallenges } from '../../dataService.js';
import { formatRespondentsForTooltip } from '../../utils.js';
/**
 * Load the customer themes tab content
 */
export async function loadCustomerThemesContent() {
    try {
        // Get the container element
        const container = document.getElementById('customer-themes-content');
        
        // Fetch the HTML template
        const response = await fetch('js/modules/tabs/templates/customer-themes.html');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status}`);
        }
        
        // Load the HTML template into the container
        const templateHtml = await response.text();
        container.innerHTML = templateHtml;
        
        // Check if there's a selected tag from the tag cloud
        const selectedTag = sessionStorage.getItem('selectedTag');
        console.log('Loading customer themes tab with selected tag:', selectedTag);
        
        // Get customer themes data - filtered by tag if one is selected
        let themes = [];
        
        if (selectedTag && selectedTag.trim() !== '') {
            console.log('Filtering by tag:', selectedTag);
            themes = findEntriesByTag(selectedTag);
            console.log('Found', themes.length, 'entries with tag:', selectedTag);
            
            // Show the clear filter button
            const clearFilterBtn = document.getElementById('clearTagFilter');
            if (clearFilterBtn) {
                clearFilterBtn.style.display = 'inline-block';
                clearFilterBtn.addEventListener('click', () => {
                    sessionStorage.removeItem('selectedTag');
                    loadCustomerThemesContent();
                });
            }
            
            // Show filter info in the combined alert
            const filterInfo = document.getElementById('filter-info');
            const filterTag = document.getElementById('filter-tag');
            if (filterInfo && filterTag) {
                filterTag.textContent = selectedTag;
                filterInfo.style.display = 'block';
            }
            
            // Add event listener to the inline clear filter button
            const inlineClearFilter = document.getElementById('inline-clear-filter');
            if (inlineClearFilter) {
                inlineClearFilter.addEventListener('click', () => {
                    sessionStorage.removeItem('selectedTag');
                    loadCustomerThemesContent();
                });
            }
        } else {
            console.log('Loading all themes');
            themes = getCustomerThemes();
            console.log('Loaded', themes.length, 'total themes');
            
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
        }
        
        // Update the response count
        document.getElementById('theme-response-count').textContent = themes.length;
        
        // Populate themes container
        const themesContainer = document.getElementById('themesContainer');
        console.log('Themes container element:', themesContainer);
        
        if (!themesContainer) {
            console.error('Could not find themes container element!');
            return;
        }
        
        // Check if themes array is valid
        if (!Array.isArray(themes) || themes.length === 0) {
            console.warn('No themes to display or invalid themes array:', themes);
            themesContainer.innerHTML = '<div class="col-12"><div class="alert alert-warning">No matching entries found.</div></div>';
            return;
        }
        
        // Generate HTML for theme cards
        const themesHtml = themes.map(theme => {
            console.log('Processing theme:', theme);
            
            // Create tags display if available
            const tagsHtml = theme.tags && theme.tags.length > 0 
                ? `<div class="mt-2">
                    ${theme.tags.map(tag => {
                        // Highlight the selected tag with a different style
                        const isSelected = selectedTag && tag.toLowerCase() === selectedTag.toLowerCase();
                        const badgeClass = isSelected ? 'badge bg-warning text-dark me-1' : 'badge bg-info text-dark me-1';
                        return `<span class="${badgeClass}">${tag}</span>`;
                    }).join('')}
                  </div>` 
                : '';
                
            console.log('Theme content before formatting:', theme.themes);
            const formattedContent = formatThemeContent(theme.themes, selectedTag);
            console.log('Theme content after formatting:', formattedContent);
            
            return `
            <div class="col-md-6 mb-4 theme-card">
                <div class="card h-100">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${theme.name || 'Anonymous'}</h5>
                            <span class="badge bg-secondary">${theme.company || 'Unknown'}</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="theme-content">${formattedContent}</p>
                        ${tagsHtml}
                    </div>
                </div>
            </div>
            `;
        }).join('');
        
        console.log('Generated HTML length:', themesHtml.length);
        themesContainer.innerHTML = themesHtml;
        console.log('Themes container updated with', themes.length, 'cards');
        
        // Now that we've rendered the content, we can clear the selected tag from session storage
        if (selectedTag) {
            // Wait a moment to ensure everything is rendered before clearing
            setTimeout(() => {
                console.log('Clearing selected tag from session storage:', selectedTag);
                sessionStorage.removeItem('selectedTag');
            }, 500);
        }
        
        // Create the tag cloud
        createTagCloud();
        
        // Initialize search functionality
        initializeSearch();
        
        // Create keywords chart
        createKeywordsChart(themes);
        
        // Create top challenges chart
        createTopChallengesChart();
        
        // Create all challenges chart
        createAllChallengesChart();
        
        // Add event listener for chart initialization events
        const topChallengesChart = document.getElementById('topChallengesChart');
        if (topChallengesChart) {
            topChallengesChart.addEventListener('chartinit', function() {
                console.log('Top challenges chart initialization event received');
                createTopChallengesChart();
            });
        }
        
        const allChallengesChart = document.getElementById('allChallengesChart');
        if (allChallengesChart) {
            allChallengesChart.addEventListener('chartinit', function() {
                console.log('All challenges chart initialization event received');
                createAllChallengesChart();
            });
        }
        
        // Initialize collapsible tag cloud panel
        initializeCollapsiblePanel();
        
        // Initialize the View All Challenges button
        initializeViewAllChallengesButton();
        
    } catch (error) {
        console.error('Error loading customer themes content:', error);
    }
}

/**
 * Format theme content with proper line breaks and highlighting
 */
function formatThemeContent(content, selectedTag = null) {
    console.log('Formatting theme content:', content);
    if (!content) {
        console.warn('Empty content provided to formatThemeContent');
        return '';
    }
    
    // Check if content is a string
    if (typeof content !== 'string') {
        console.error('Content is not a string:', typeof content, content);
        return String(content || '');
    }
    
    // Replace newlines with HTML line breaks
    let formatted = content.replace(/\n/g, '<br>');
    
    // Highlight key terms
    const keyTerms = [
        'AI', 'Artificial Intelligence', 'automation', 'productivity', 
        'cloud', 'security', 'data', 'analytics', 'digital', 
        'transformation', 'customer experience', 'innovation'
    ];
    
    // Add the selected tag to the key terms if it's not already there
    if (selectedTag && !keyTerms.includes(selectedTag)) {
        keyTerms.push(selectedTag);
    }
    
    keyTerms.forEach(term => {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        
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
 * Initialize search functionality for themes
 */
function initializeSearch() {
    const searchInput = document.getElementById('themeSearch');
    const searchBtn = document.getElementById('themeSearchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const themesContainer = document.getElementById('themesContainer');
    const themeCards = themesContainer.querySelectorAll('.theme-card');
    
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
            themeCards.forEach(card => card.style.display = '');
            searchInfo.style.display = 'none';
            searchResultsAlert.style.display = 'none';
            return;
        }
        
        let matchCount = 0;
        
        themeCards.forEach(card => {
            const content = card.querySelector('.theme-content').textContent.toLowerCase();
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
    };
    
    const clearSearch = () => {
        searchInput.value = '';
        themeCards.forEach(card => card.style.display = '');
        searchInfo.style.display = 'none';
        searchResultsAlert.style.display = 'none';
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
 * Create a chart showing common keywords in customer themes
 */
function createKeywordsChart(themes) {
    const ctx = document.getElementById('keywordsChart');
    
    if (!ctx) return;
    
    // Extract keywords from themes
    const keywordData = extractKeywords(themes);
    
    // Limit to top 15 keywords
    const topKeywords = keywordData.slice(0, 15);
    
    // Create chart
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topKeywords.map(item => item.keyword),
            datasets: [{
                label: 'Frequency',
                data: topKeywords.map(item => item.count),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                            return `Frequency: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create a tag cloud for customer theme tags
 */
function createTagCloud() {
    const tagCloudContainer = document.getElementById('customer-tag-cloud');
    
    if (!tagCloudContainer) {
        console.error('Could not find tag cloud container');
        return;
    }
    
    // Get tag data
    const tagData = getCustomerThemeTags();
    console.log('Tag data for cloud:', tagData);
    
    // Filter to top 50 tags to avoid overcrowding
    const topTags = tagData.slice(0, 50);
    
    // Find min and max frequencies for scaling
    const minFrequency = Math.min(...topTags.map(t => t.frequency));
    const maxFrequency = Math.max(...topTags.map(t => t.frequency));
    
    // Scale font size between 10px and 28px based on frequency
    const scaleFontSize = (frequency) => {
        if (maxFrequency === minFrequency) return 16; // If all tags have same frequency
        return 10 + ((frequency - minFrequency) / (maxFrequency - minFrequency)) * 18;
    };
    
    // Generate colors based on frequency
    const getTagColor = (frequency) => {
        // Use a color scale from light blue to dark blue based on frequency
        const intensity = Math.floor(((frequency - minFrequency) / (maxFrequency - minFrequency)) * 100);
        return `hsl(210, 80%, ${Math.max(40, 85 - intensity * 0.5)}%)`;
    };
    
    // Create tag elements
    tagCloudContainer.innerHTML = '';
    
    if (topTags.length === 0) {
        tagCloudContainer.innerHTML = '<div class="text-center text-muted">No tags available</div>';
        return;
    }
    
    topTags.forEach(tagItem => {
        const { tag, frequency } = tagItem;
        
        // Create tag element
        const tagElement = document.createElement('span');
        tagElement.textContent = tag;
        tagElement.className = 'tag-item';
        tagElement.style.fontSize = `${scaleFontSize(frequency)}px`;
        tagElement.style.color = getTagColor(frequency);
        tagElement.style.padding = '6px 12px';
        tagElement.style.margin = '5px';
        tagElement.style.display = 'inline-block';
        tagElement.style.cursor = 'pointer';
        tagElement.style.transition = 'transform 0.2s, box-shadow 0.2s';
        
        // Add hover effect
        tagElement.addEventListener('mouseenter', () => {
            tagElement.style.transform = 'scale(1.1)';
            tagElement.style.textDecoration = 'underline';
            
            // Show tooltip with frequency
            tagElement.title = `${tag} (mentioned ${frequency} times)`;
        });
        
        tagElement.addEventListener('mouseleave', () => {
            tagElement.style.transform = 'scale(1)';
            tagElement.style.textDecoration = 'none';
        });
        
        // Add click event to filter by this tag
        tagElement.addEventListener('click', () => {
            // Store the selected tag in sessionStorage
            sessionStorage.setItem('selectedTag', tag);
            console.log('Tag cloud: stored selected tag in sessionStorage:', tag);
            
            // Reload the customer themes content with the selected tag
            loadCustomerThemesContent();
        });
        
        tagCloudContainer.appendChild(tagElement);
    });
}

// Store chart instance to allow proper cleanup
let topChallengesChartInstance = null;

/**
 * Create a chart showing the top 10 challenges by interest level
 */
function createTopChallengesChart() {
    try {
        console.log('Starting to create top challenges chart');
        const ctx = document.getElementById('topChallengesChart');
        
        if (!ctx) {
            console.error('Could not find topChallengesChart canvas element');
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
                setTimeout(createTopChallengesChart, 100);
            };
            document.head.appendChild(script);
            return;
        }
        
        console.log('Canvas element found, Chart.js is available');
        
        // Destroy existing chart if it exists to prevent duplicates
        if (topChallengesChartInstance) {
            console.log('Destroying existing chart instance');
            topChallengesChartInstance.destroy();
            topChallengesChartInstance = null;
        }
        
        // Make sure the canvas is visible and has proper dimensions
        ctx.style.display = 'block';
        ctx.height = 400; // Set explicit height
        
        // Get challenges data from the data service and sort by weighted score
        let challengesData = getChallenges();
        console.log('Challenges data from service:', challengesData);
        
        // Declare variables at the top level so they're accessible throughout the function
        let challenges = [];
        let strongInterest = [];
        let reasonableInterest = [];
        let vagueInterest = [];
        let nothingHeard = [];
        let respondentData = {}; // Store respondent information for tooltips
        
        if (challengesData && challengesData.length > 0) {
            // Sort challenges by weighted score (highest first) - same as in overviewTab.js
            challengesData.sort((a, b) => b.weightedScore - a.weightedScore);
            console.log('Sorted challenges data:', challengesData);
            
            // Get top 10 challenges
            const top10Challenges = challengesData.slice(0, 10);
            
            // Store respondent data for tooltips
            respondentData = top10Challenges.reduce((acc, item) => {
                acc[item.challenge] = item.respondents || {};
                return acc;
            }, {});
            
            // Extract challenge names and interest level counts
            challenges = top10Challenges.map(item => item.challenge);
            strongInterest = top10Challenges.map(item => item.interestCounts['Sterke, concrete interesse'] || 0);
            reasonableInterest = top10Challenges.map(item => item.interestCounts['Redelijke interesse'] || 0);
            vagueInterest = top10Challenges.map(item => item.interestCounts['Vage interesse'] || 0);
            nothingHeard = top10Challenges.map(item => item.interestCounts['Niets over gehoord'] || 0);
        } else {
            // If we couldn't get data from the service, use calculated fallback data
            console.warn('No challenges data available, using fallback data');
            
            // Create fallback data with interest counts and sample respondent data
            const fallbackData = [
                { challenge: 'Cyber Security', interestCounts: { 'Sterke, concrete interesse': 12, 'Redelijke interesse': 8, 'Vage interesse': 4, 'Niets over gehoord': 2 } },
                { challenge: 'IT Cost Management', interestCounts: { 'Sterke, concrete interesse': 11, 'Redelijke interesse': 8, 'Vage interesse': 5, 'Niets over gehoord': 3 } },
                { challenge: 'Bredere toepassing van AI in bedrijfsprocessen en producten/diensten', interestCounts: { 'Sterke, concrete interesse': 10, 'Redelijke interesse': 8, 'Vage interesse': 6, 'Niets over gehoord': 3 } },
                { challenge: 'Adoptie van Generative AI voor medewerkers', interestCounts: { 'Sterke, concrete interesse': 9, 'Redelijke interesse': 9, 'Vage interesse': 6, 'Niets over gehoord': 3 } },
                { challenge: 'Automation of IT (IaC)', interestCounts: { 'Sterke, concrete interesse': 9, 'Redelijke interesse': 10, 'Vage interesse': 5, 'Niets over gehoord': 4 } },
                { challenge: 'Legacy & Technical Debt', interestCounts: { 'Sterke, concrete interesse': 10, 'Redelijke interesse': 8, 'Vage interesse': 7, 'Niets over gehoord': 2 } },
                { challenge: 'Enterprise Architecture', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 11, 'Vage interesse': 7, 'Niets over gehoord': 3 } },
                { challenge: '(Impact van) Wetgeving (op IT)', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 11, 'Vage interesse': 6, 'Niets over gehoord': 4 } },
                { challenge: 'Identity Management / eIDAS', interestCounts: { 'Sterke, concrete interesse': 7, 'Redelijke interesse': 11, 'Vage interesse': 6, 'Niets over gehoord': 4 } },
                { challenge: 'ERP vernieuwing', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 12, 'Vage interesse': 6, 'Niets over gehoord': 3 } }
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
            
            // Calculate weighted score for each challenge
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
            challenges = fallbackData.map(item => item.challenge);
            strongInterest = fallbackData.map(item => item.interestCounts['Sterke, concrete interesse']);
            reasonableInterest = fallbackData.map(item => item.interestCounts['Redelijke interesse']);
            vagueInterest = fallbackData.map(item => item.interestCounts['Vage interesse']);
            nothingHeard = fallbackData.map(item => item.interestCounts['Niets over gehoord']);
            
            // Store respondent data for tooltips
            respondentData = fallbackData.reduce((acc, item) => {
                acc[item.challenge] = item.respondents || {};
                return acc;
            }, {});
        }
        
        console.log('Using challenges data for chart');
        console.log('Challenges:', challenges);
        console.log('Data arrays:', { strongInterest, reasonableInterest, vagueInterest, nothingHeard });
        
        // Create chart and store the instance
        topChallengesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: challenges,
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
                            text: 'Challenges'
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
                                // Get the challenge name and interest level
                                const challenge = challenges[context.dataIndex];
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
                                
                                // Get respondents for this challenge and interest level
                                const respondents = respondentData[challenge] && respondentData[challenge][interestLevel];
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
        console.error('Error creating top challenges chart:', error);
    }
}

/**
 * Create a chart showing all challenges by interest level
 */
let allChallengesChartInstance = null;

function createAllChallengesChart() {
    try {
        console.log('Starting to create all challenges chart');
        const ctx = document.getElementById('allChallengesChart');
        
        if (!ctx) {
            console.error('Could not find allChallengesChart canvas element');
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
                setTimeout(createAllChallengesChart, 100);
            };
            document.head.appendChild(script);
            return;
        }
        
        console.log('Canvas element found, Chart.js is available');
        
        // Destroy existing chart if it exists to prevent duplicates
        if (allChallengesChartInstance) {
            console.log('Destroying existing all challenges chart instance');
            allChallengesChartInstance.destroy();
            allChallengesChartInstance = null;
        }
        
        // Make sure the canvas is visible and has proper dimensions
        ctx.style.display = 'block';
        ctx.height = 600; // Set explicit height for all challenges (larger than top 10)
        
        // Get challenges data from the data service and sort by weighted score
        let challengesData = getChallenges();
        console.log('All challenges data from service:', challengesData);
        
        // Declare variables for chart data
        let challenges = [];
        let strongInterest = [];
        let reasonableInterest = [];
        let vagueInterest = [];
        let nothingHeard = [];
        let respondentData = {}; // Store respondent information for tooltips
        
        if (challengesData && challengesData.length > 0) {
            // Sort challenges by weighted score (highest first) - same as in overviewTab.js
            challengesData.sort((a, b) => b.weightedScore - a.weightedScore);
            console.log('Sorted all challenges data:', challengesData);
            
            // Use all challenges, not just top 10
            // Store respondent data for tooltips
            respondentData = challengesData.reduce((acc, item) => {
                acc[item.challenge] = item.respondents || {};
                return acc;
            }, {});
            
            // Extract challenge names and interest level counts
            challenges = challengesData.map(item => item.challenge);
            strongInterest = challengesData.map(item => item.interestCounts['Sterke, concrete interesse'] || 0);
            reasonableInterest = challengesData.map(item => item.interestCounts['Redelijke interesse'] || 0);
            vagueInterest = challengesData.map(item => item.interestCounts['Vage interesse'] || 0);
            nothingHeard = challengesData.map(item => item.interestCounts['Niets over gehoord'] || 0);
        } else {
            // If we couldn't get data from the service, use calculated fallback data
            console.warn('No challenges data available, using fallback data');
            
            // Create fallback data with interest counts and sample respondent data
            // This is the same as in createTopChallengesChart but we'll use more items
            const fallbackData = [
                { challenge: 'Cyber Security', interestCounts: { 'Sterke, concrete interesse': 12, 'Redelijke interesse': 8, 'Vage interesse': 4, 'Niets over gehoord': 2 } },
                { challenge: 'IT Cost Management', interestCounts: { 'Sterke, concrete interesse': 11, 'Redelijke interesse': 8, 'Vage interesse': 5, 'Niets over gehoord': 3 } },
                { challenge: 'Bredere toepassing van AI in bedrijfsprocessen en producten/diensten', interestCounts: { 'Sterke, concrete interesse': 10, 'Redelijke interesse': 8, 'Vage interesse': 6, 'Niets over gehoord': 3 } },
                { challenge: 'Adoptie van Generative AI voor medewerkers', interestCounts: { 'Sterke, concrete interesse': 9, 'Redelijke interesse': 9, 'Vage interesse': 6, 'Niets over gehoord': 3 } },
                { challenge: 'Automation of IT (IaC)', interestCounts: { 'Sterke, concrete interesse': 9, 'Redelijke interesse': 10, 'Vage interesse': 5, 'Niets over gehoord': 4 } },
                { challenge: 'Legacy & Technical Debt', interestCounts: { 'Sterke, concrete interesse': 10, 'Redelijke interesse': 8, 'Vage interesse': 7, 'Niets over gehoord': 2 } },
                { challenge: 'Enterprise Architecture', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 11, 'Vage interesse': 7, 'Niets over gehoord': 3 } },
                { challenge: '(Impact van) Wetgeving (op IT)', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 11, 'Vage interesse': 6, 'Niets over gehoord': 4 } },
                { challenge: 'Identity Management / eIDAS', interestCounts: { 'Sterke, concrete interesse': 7, 'Redelijke interesse': 11, 'Vage interesse': 6, 'Niets over gehoord': 4 } },
                { challenge: 'ERP vernieuwing', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 12, 'Vage interesse': 6, 'Niets over gehoord': 3 } },
                // Additional fallback items for the all challenges chart
                { challenge: 'Data Management', interestCounts: { 'Sterke, concrete interesse': 7, 'Redelijke interesse': 9, 'Vage interesse': 5, 'Niets over gehoord': 2 } },
                { challenge: 'Cloud Migration', interestCounts: { 'Sterke, concrete interesse': 9, 'Redelijke interesse': 10, 'Vage interesse': 4, 'Niets over gehoord': 2 } },
                { challenge: 'DevOps Adoption', interestCounts: { 'Sterke, concrete interesse': 8, 'Redelijke interesse': 9, 'Vage interesse': 6, 'Niets over gehoord': 3 } },
                { challenge: 'Microservices Architecture', interestCounts: { 'Sterke, concrete interesse': 6, 'Redelijke interesse': 8, 'Vage interesse': 7, 'Niets over gehoord': 4 } },
                { challenge: 'API Management', interestCounts: { 'Sterke, concrete interesse': 7, 'Redelijke interesse': 10, 'Vage interesse': 5, 'Niets over gehoord': 3 } }
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
            
            // Calculate weighted score for each challenge
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
            console.log('Sorted fallback data for all challenges:', fallbackData);
            
            // Extract data for chart
            challenges = fallbackData.map(item => item.challenge);
            strongInterest = fallbackData.map(item => item.interestCounts['Sterke, concrete interesse']);
            reasonableInterest = fallbackData.map(item => item.interestCounts['Redelijke interesse']);
            vagueInterest = fallbackData.map(item => item.interestCounts['Vage interesse']);
            nothingHeard = fallbackData.map(item => item.interestCounts['Niets over gehoord']);
            
            // Store respondent data for tooltips
            respondentData = fallbackData.reduce((acc, item) => {
                acc[item.challenge] = item.respondents || {};
                return acc;
            }, {});
        }
        
        console.log('Using challenges data for all challenges chart');
        console.log('All challenges:', challenges);
        console.log('Data arrays for all challenges:', { strongInterest, reasonableInterest, vagueInterest, nothingHeard });
        
        // Create chart and store the instance - same configuration as top challenges chart
        allChallengesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: challenges,
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
                            text: 'Challenges'
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
                                // Get the challenge name and interest level
                                const challenge = challenges[context.dataIndex];
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
                                
                                // Get respondents for this challenge and interest level
                                const respondents = respondentData[challenge] && respondentData[challenge][interestLevel];
                                
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
        console.error('Error creating all challenges chart:', error);
    }
}

/**
 * Initialize the collapsible panel functionality
 */
function initializeCollapsiblePanel() {
    // Initialize tag cloud collapse panel
    initializeCollapsePanel('tagCloudCollapse', 'tagCloudCollapseIcon');
    
    // Initialize top challenges collapse panel
    initializeCollapsePanel('topChallengesCollapse', 'topChallengesCollapseIcon');
    
    // Initialize customer themes overview collapse panel
    initializeCollapsePanel('customerThemesOverviewCollapse', 'customerThemesOverviewCollapseIcon');
    
    // Initialize keywords chart collapse panel
    initializeCollapsePanel('keywordsChartCollapse', 'keywordsChartCollapseIcon');
    
    // Initialize all challenges collapse panel
    initializeCollapsePanel('allChallengesCollapse', 'allChallengesCollapseIcon');
}

/**
 * Initialize the View All Challenges button
 */
function initializeViewAllChallengesButton() {
    const viewAllChallengesBtn = document.getElementById('viewAllChallengesBtn');
    if (!viewAllChallengesBtn) {
        console.error('Could not find View All Challenges button');
        return;
    }
    
    viewAllChallengesBtn.addEventListener('click', function() {
        // Find the All Challenges section
        const allChallengesSection = document.getElementById('allChallengesCollapse');
        if (!allChallengesSection) {
            console.error('Could not find All Challenges section');
            return;
        }
        
        // Make sure the All Challenges section is expanded
        const bsCollapse = bootstrap.Collapse.getInstance(allChallengesSection);
        if (bsCollapse && !allChallengesSection.classList.contains('show')) {
            bsCollapse.show();
        }
        
        // Scroll to the All Challenges section with smooth animation
        // Find the card containing the All Challenges section using a more compatible approach
        const allChallengesElement = document.getElementById('allChallengesChart');
        if (allChallengesElement) {
            // Find the closest card parent
            let cardElement = allChallengesElement;
            while (cardElement && !cardElement.classList.contains('card')) {
                cardElement = cardElement.parentElement;
            }
            
            // Scroll to the card if found, otherwise scroll to the chart element
            if (cardElement) {
                cardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                allChallengesElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    });
}

/**
 * Helper function to initialize a collapsible panel
 */
function initializeCollapsePanel(collapseId, iconId) {
    const collapseElement = document.getElementById(collapseId);
    const collapseIcon = document.getElementById(iconId);
    
    if (!collapseElement || !collapseIcon) {
        console.error(`Could not find collapse elements for ${collapseId}`);
        return;
    }
    
    console.log(`Initializing collapsible panel ${collapseId} with elements:`, { collapseElement, collapseIcon });
    
    // Initialize the collapse component explicitly
    const bsCollapse = new bootstrap.Collapse(collapseElement, {
        toggle: false // Don't toggle on initialization
    });
    
    // Set initial icon state
    if (collapseElement.classList.contains('show')) {
        collapseIcon.classList.remove('bi-chevron-down');
        collapseIcon.classList.add('bi-chevron-up');
    } else {
        collapseIcon.classList.remove('bi-chevron-up');
        collapseIcon.classList.add('bi-chevron-down');
    }
    
    // Get the toggle button
    const toggleButton = document.querySelector(`[data-bs-target="#${collapseId}"]`);
    if (toggleButton) {
        // Add click event to manually toggle the collapse state and icon
        toggleButton.addEventListener('click', (event) => {
            event.preventDefault();
        });
    }
    
    // Update icon when collapse state changes
    collapseElement.addEventListener('show.bs.collapse', function () {
        collapseIcon.classList.remove('bi-chevron-down');
        collapseIcon.classList.add('bi-chevron-up');
    });
    
    collapseElement.addEventListener('hide.bs.collapse', function () {
        collapseIcon.classList.remove('bi-chevron-up');
        collapseIcon.classList.add('bi-chevron-down');
    });
}

/**
 * Extract keywords from themes and count their frequency
 */
function extractKeywords(themes) {
    // List of common keywords to look for
    const keywordList = [
        'AI', 'automation', 'productivity', 'cloud', 'security', 
        'data', 'analytics', 'digital', 'transformation', 'customer', 
        'experience', 'innovation', 'agile', 'DevOps', 'mobile',
        'integration', 'platform', 'architecture', 'strategy', 'solution',
        'service', 'application', 'technology', 'business', 'process',
        'efficiency', 'cost', 'quality', 'performance', 'scalability'
    ];
    
    // Count occurrences of each keyword
    const keywordCounts = {};
    
    themes.forEach(theme => {
        if (!theme.themes) return;
        
        const text = theme.themes.toLowerCase();
        
        keywordList.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
            const matches = text.match(regex);
            
            if (matches) {
                keywordCounts[keyword] = (keywordCounts[keyword] || 0) + matches.length;
            }
        });
    });
    
    // Convert to array format for chart
    return Object.entries(keywordCounts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count);
}
