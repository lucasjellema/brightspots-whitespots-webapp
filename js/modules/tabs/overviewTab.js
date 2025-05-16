// Overview Tab Module
import { getSurveySummary, getChallenges, getTechnologyTrends, getProductsVendors, getCustomerThemeTags, getEmergingTechTags, getCompaniesByTag, findEntriesByTag } from '../../dataService.js';

/**
 * Load the overview tab content
 */
export async function loadOverviewContent() {
    try {
        // Get the container element
        const container = document.getElementById('overview-content');
        
        // Check if admin mode is enabled via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminMode = urlParams.get('admin') === 'yes';
        
        // Set global admin mode flag
        window.isAdminMode = isAdminMode;
        
        // Fetch the HTML template
        const response = await fetch('js/modules/tabs/templates/overview.html');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status}`);
        }
        
        // Load the HTML template into the container
        const templateHtml = await response.text();
        container.innerHTML = templateHtml;
        
        // Hide admin features if not in admin mode
        if (!isAdminMode) {
            hideAdminFeatures();
        }
        
        // Get data
        const summary = getSurveySummary();
        const topChallenges = getChallenges().slice(0, 5);
        const topTrends = getTechnologyTrends().slice(0, 5);
        const topVendors = getProductsVendors().slice(0, 5);
        
        // Format date
        const formatDate = (date) => {
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        };
        
        // Update the DOM with data
        document.getElementById('total-responses').textContent = summary.totalResponses;
        document.getElementById('companies-count').textContent = summary.companies;
        document.getElementById('survey-period').textContent = `${formatDate(summary.startDate)} - ${formatDate(summary.endDate)}`;
        
        // Populate top challenges list
        const topChallengesList = document.getElementById('top-challenges-list');
        topChallengesList.innerHTML = topChallenges.map(item => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>${item.challenge}</div>
               
            </div>
        `).join('');
        
        // Populate top trends list
        const topTrendsList = document.getElementById('top-trends-list');
        topTrendsList.innerHTML = topTrends.map(item => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>${item.concept}</div>
            </div>
        `).join('');
        
        // Populate top vendors list
        const topVendorsList = document.getElementById('top-vendors-list');
        topVendorsList.innerHTML = topVendors.map(item => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>${item.vendor}</div>
            </div>
        `).join('');
        
        // Add event listeners to buttons
        document.getElementById('view-all-challenges-btn').addEventListener('click', () => {
            document.getElementById('customer-themes-tab').click();
        });
        
        document.getElementById('view-all-trends-btn').addEventListener('click', () => {
            document.getElementById('emerging-tech-tab').click();
        });
        
        document.getElementById('view-all-vendors-btn').addEventListener('click', () => {
            document.getElementById('technology-trends-tab').click();
        });
        
        // Create the tag clouds
        createTagCloud();
        createTechTagCloud();
        
        // Initialize collapsible tag cloud panels
        initializeCollapsiblePanel();
        initializeTechTagCollapsiblePanel();
        
        // Initialize tag removal features
        initializeTagRemovalFeature();
        initializeTechTagRemovalFeature();
        
    } catch (error) {
        console.error('Error loading overview content:', error);
    }
}


/**
 * Initialize the collapsible panel functionality for the tag cloud
 */
function initializeCollapsiblePanel() {
    const collapseElement = document.getElementById('overviewTagCloudCollapse');
    const collapseIcon = document.getElementById('overviewTagCloudCollapseIcon');
    
    if (!collapseElement || !collapseIcon) {
        console.error('Could not find collapse elements');
        return;
    }
    
    console.log('Initializing collapsible panel with elements:', { collapseElement, collapseIcon });
    
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
    const toggleButton = document.querySelector('[data-bs-target="#overviewTagCloudCollapse"]');
    if (toggleButton) {
        // Add click event to manually toggle the collapse state and icon
        toggleButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (collapseElement.classList.contains('show')) {
                // Collapsing
                collapseIcon.classList.remove('bi-chevron-up');
                collapseIcon.classList.add('bi-chevron-down');
            } else {
                // Expanding
                collapseIcon.classList.remove('bi-chevron-down');
                collapseIcon.classList.add('bi-chevron-up');
            }
            bsCollapse.toggle();
        });
    }
    
    // Update icon when collapse state changes (backup approach)
    collapseElement.addEventListener('show.bs.collapse', () => {
        collapseIcon.classList.remove('bi-chevron-down');
        collapseIcon.classList.add('bi-chevron-up');
    });
    
    collapseElement.addEventListener('hide.bs.collapse', () => {
        collapseIcon.classList.remove('bi-chevron-up');
        collapseIcon.classList.add('bi-chevron-down');
    });
}

/**
 * Create a tag cloud for customer theme tags
 */
// Store tags marked for removal
let tagsMarkedForRemoval = new Set();

// Store tech tags marked for removal
let techTagsMarkedForRemoval = new Set();

function createTagCloud() {
    const tagCloudContainer = document.getElementById('tag-cloud');
    const tagCompaniesContainer = document.getElementById('tag-companies');
    const selectedTagElement = document.getElementById('selected-tag');
    const companiesListElement = document.getElementById('companies-list');
    
    if (!tagCloudContainer) return;
    
    // Get tag data
    const tagData = getCustomerThemeTags();
    
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
    tagCloudContainer.innerHTML = '';
    topTags.forEach(tagItem => {
        const { tag, frequency } = tagItem;
        
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
        tagElement.style.position = 'relative';
        
        // Apply line-through style if tag is already marked for removal
        if (tagsMarkedForRemoval.has(tag)) {
            tagElement.style.textDecoration = 'line-through';
        }
        
        // Create tag text
        const tagText = document.createTextNode(tag);
        tagElement.appendChild(tagText);
        
        // Only create X mark for quick removal if in admin mode
        if (window.isAdminMode) {
            const xMark = document.createElement('span');
            xMark.innerHTML = '&times;';
            xMark.style.position = 'absolute';
            xMark.style.top = '0';
            xMark.style.right = '3px';
            xMark.style.fontSize = '14px';
            xMark.style.fontWeight = 'bold';
            xMark.style.cursor = 'pointer';
            xMark.style.display = 'none'; // Hidden by default, show on hover
            
            // Set appropriate color and title based on removal status
            if (tagsMarkedForRemoval.has(tag)) {
                xMark.style.color = 'rgba(25, 135, 84, 0.8)'; // Green for already marked
                xMark.title = 'Remove from list';
            } else {
                xMark.style.color = 'rgba(220, 53, 69, 0.8)'; // Red for not marked
                xMark.title = 'Mark for removal';
            }
            
            tagElement.appendChild(xMark);
            
            // Add hover and click events for X mark only in admin mode
            tagElement.addEventListener('mouseover', () => {
                tagElement.style.color = '#0d6efd';
                xMark.style.display = 'block'; // Show X mark on hover
            });
            
            tagElement.addEventListener('mouseout', () => {
                tagElement.style.color = '';
                xMark.style.display = 'none'; // Hide X mark when not hovering
            });
            
            // Add click handler for the X mark
            xMark.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the tag's click event
                
                // Toggle tag in removal list
                if (tagsMarkedForRemoval.has(tag)) {
                    tagsMarkedForRemoval.delete(tag);
                    tagElement.style.textDecoration = '';
                    xMark.style.color = 'rgba(220, 53, 69, 0.8)';
                    xMark.title = 'Mark for removal';
                } else {
                    tagsMarkedForRemoval.add(tag);
                    tagElement.style.textDecoration = 'line-through';
                    xMark.style.color = 'rgba(25, 135, 84, 0.8)';
                    xMark.title = 'Remove from list';
                }
                
                // Update the removal tag list display
                updateRemovalTagList();
            });
        }
        
        // Add hover effect for non-admin mode
        if (!window.isAdminMode) {
            tagElement.addEventListener('mouseover', () => {
                tagElement.style.color = '#0d6efd';
            });
            
            tagElement.addEventListener('mouseout', () => {
                tagElement.style.color = '';
            });
        }
        
        // Show companies that mentioned this tag
        tagElement.addEventListener('click', () => {
            const companies = getCompaniesByTag(tag);
            selectedTagElement.textContent = tag;
            companiesListElement.innerHTML = companies.length > 0 
                ? companies.map(company => `<span class="badge bg-secondary me-1 mb-1">${company}</span>`).join(' ')
                : '<em>No companies found</em>';
            tagCompaniesContainer.style.display = 'block';
            
            // Update mark for removal button state
            const markForRemovalBtn = document.getElementById('mark-tag-for-removal');
            if (markForRemovalBtn) {
                if (tagsMarkedForRemoval.has(tag)) {
                    markForRemovalBtn.textContent = 'Remove from list';
                    markForRemovalBtn.classList.remove('btn-outline-danger');
                    markForRemovalBtn.classList.add('btn-outline-secondary');
                } else {
                    markForRemovalBtn.textContent = 'Mark for removal';
                    markForRemovalBtn.classList.remove('btn-outline-secondary');
                    markForRemovalBtn.classList.add('btn-outline-danger');
                }
                
                // Store the current tag for the removal button to use
                markForRemovalBtn.dataset.tag = tag;
            }
            
            // Store the selected tag in sessionStorage for the customer-themes tab to use
            sessionStorage.setItem('selectedTag', tag);
            console.log('Tag cloud: stored selected tag in sessionStorage:', tag);
            
            // Force a delay to ensure the session storage is set before navigating
            setTimeout(() => {
                // Navigate to customer-themes tab
                const customerThemesTab = document.getElementById('customer-themes-tab');
                console.log('Tag cloud: navigating to customer-themes tab', customerThemesTab);
                if (customerThemesTab) {
                    customerThemesTab.click();
                } else {
                    console.error('Could not find customer-themes-tab element');
                }
            }, 100);
        });
        
        tagCloudContainer.appendChild(tagElement);
    });
    
    // Initialize tag removal functionality
    initializeTagRemovalFeature();
}

/**
 * Initialize the tag removal feature
 */
function initializeTagRemovalFeature() {
    // Only initialize tag removal features if in admin mode
    if (!window.isAdminMode) {
        return;
    }
    
    // Initialize the mark for removal button
    const markForRemovalBtn = document.getElementById('mark-tag-for-removal');
    if (markForRemovalBtn) {
        markForRemovalBtn.addEventListener('click', () => {
            const tag = markForRemovalBtn.dataset.tag;
            if (!tag) return;
            
            if (tagsMarkedForRemoval.has(tag)) {
                // Remove from list
                tagsMarkedForRemoval.delete(tag);
                markForRemovalBtn.textContent = 'Mark for removal';
                markForRemovalBtn.classList.remove('btn-outline-secondary');
                markForRemovalBtn.classList.add('btn-outline-danger');
            } else {
                // Add to list
                tagsMarkedForRemoval.add(tag);
                markForRemovalBtn.textContent = 'Remove from list';
                markForRemovalBtn.classList.remove('btn-outline-danger');
                markForRemovalBtn.classList.add('btn-outline-secondary');
            }
            
            // Update the removal tag list display
            updateRemovalTagList();
        });
    }
    
    // Initialize the copy to clipboard button
    const copyToClipboardBtn = document.getElementById('copy-tags-to-clipboard');
    if (copyToClipboardBtn) {
        copyToClipboardBtn.addEventListener('click', () => {
            const tagsArray = Array.from(tagsMarkedForRemoval);
            const jsonString = JSON.stringify(tagsArray, null, 2);
            navigator.clipboard.writeText(jsonString)
                .then(() => {
                    alert('Tags copied to clipboard as JSON array!');
                })
                .catch(err => {
                    console.error('Failed to copy tags to clipboard:', err);
                    // Fallback for browsers that don't support clipboard API
                    const textarea = document.createElement('textarea');
                    textarea.value = jsonString;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('Tags copied to clipboard as JSON array!');
                });
        });
    }
    
    // Initialize the clear all button
    const clearAllBtn = document.getElementById('clear-tags-to-remove');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all tags marked for removal?')) {
                tagsMarkedForRemoval.clear();
                updateRemovalTagList();
            }
        });
    }
    
    // Initial update of the removal tag list
    updateRemovalTagList();
}

/**
 * Update the display of tags marked for removal
 */
/**
 * Hide admin features when not in admin mode
 */
function hideAdminFeatures() {
    // The tag-item elements won't be created yet when this function is called initially,
    // so we need to modify the createTagCloud function to check for admin mode
    
    // We'll set a global flag that the createTagCloud function can check
    window.isAdminMode = false;
    
    // Hide the mark for removal button in the customer tag details
    const markForRemovalBtn = document.getElementById('mark-tag-for-removal');
    if (markForRemovalBtn) {
        markForRemovalBtn.style.display = 'none';
    }
    
    // Hide the entire customer tags marked for removal section
    const tagsToRemoveSection = document.querySelector('#tags-to-remove').closest('.mt-4');
    if (tagsToRemoveSection) {
        tagsToRemoveSection.style.display = 'none';
    }
    
    // Hide the mark for removal button in the tech tag details
    const markTechForRemovalBtn = document.getElementById('mark-tech-tag-for-removal');
    if (markTechForRemovalBtn) {
        markTechForRemovalBtn.style.display = 'none';
    }
    
    // Hide the entire tech tags marked for removal section
    const techTagsToRemoveSection = document.querySelector('#tech-tags-to-remove').closest('.mt-4');
    if (techTagsToRemoveSection) {
        techTagsToRemoveSection.style.display = 'none';
    }
}

/**
 * Create a tag cloud for emerging tech/vendor/product tags
 */
function createTechTagCloud() {
    const tagCloudContainer = document.getElementById('tech-tag-cloud');
    const tagCompaniesContainer = document.getElementById('tech-tag-companies');
    const selectedTagElement = document.getElementById('selected-tech-tag');
    const companiesListElement = document.getElementById('tech-companies-list');
    
    if (!tagCloudContainer) return;
    
    // Get tag data
    const tagData = getEmergingTechTags();
    
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
        tagElement.style.position = 'relative';
        
        // Apply line-through style if tag is already marked for removal
        if (techTagsMarkedForRemoval.has(tag)) {
            tagElement.style.textDecoration = 'line-through';
        }
        
        // Create tag text
        const tagText = document.createTextNode(tag);
        tagElement.appendChild(tagText);
        
        // Only create X mark for quick removal if in admin mode
        if (window.isAdminMode) {
            const xMark = document.createElement('span');
            xMark.innerHTML = '&times;';
            xMark.style.position = 'absolute';
            xMark.style.top = '0';
            xMark.style.right = '3px';
            xMark.style.fontSize = '14px';
            xMark.style.fontWeight = 'bold';
            xMark.style.cursor = 'pointer';
            xMark.style.display = 'none'; // Hidden by default, show on hover
            
            // Set appropriate color and title based on removal status
            if (techTagsMarkedForRemoval.has(tag)) {
                xMark.style.color = 'rgba(25, 135, 84, 0.8)'; // Green for already marked
                xMark.title = 'Remove from list';
            } else {
                xMark.style.color = 'rgba(220, 53, 69, 0.8)'; // Red for not marked
                xMark.title = 'Mark for removal';
            }
            
            tagElement.appendChild(xMark);
            
            // Add hover and click events for X mark only in admin mode
            tagElement.addEventListener('mouseover', () => {
                tagElement.style.color = '#0d6efd';
                xMark.style.display = 'block'; // Show X mark on hover
            });
            
            tagElement.addEventListener('mouseout', () => {
                tagElement.style.color = '';
                xMark.style.display = 'none'; // Hide X mark when not hovering
            });
            
            // Add click handler for the X mark
            xMark.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the tag's click event
                
                // Toggle tag in removal list
                if (techTagsMarkedForRemoval.has(tag)) {
                    techTagsMarkedForRemoval.delete(tag);
                    tagElement.style.textDecoration = '';
                    xMark.style.color = 'rgba(220, 53, 69, 0.8)';
                    xMark.title = 'Mark for removal';
                } else {
                    techTagsMarkedForRemoval.add(tag);
                    tagElement.style.textDecoration = 'line-through';
                    xMark.style.color = 'rgba(25, 135, 84, 0.8)';
                    xMark.title = 'Remove from list';
                }
                
                // Update the removal tag list display
                updateTechRemovalTagList();
            });
        }
        
        // Add hover effect for non-admin mode
        if (!window.isAdminMode) {
            tagElement.addEventListener('mouseover', () => {
                tagElement.style.color = '#0d6efd';
            });
            
            tagElement.addEventListener('mouseout', () => {
                tagElement.style.color = '';
            });
        }
        
        // Show companies that mentioned this tag
        tagElement.addEventListener('click', () => {
            const companies = getCompaniesByTag(tag);
            selectedTagElement.textContent = tag;
            companiesListElement.innerHTML = companies.length > 0 
                ? companies.map(company => `<span class="badge bg-secondary me-1 mb-1">${company}</span>`).join(' ')
                : '<em>No companies found</em>';
            tagCompaniesContainer.style.display = 'block';
            
            // Update mark for removal button state
            const markForRemovalBtn = document.getElementById('mark-tech-tag-for-removal');
            if (markForRemovalBtn) {
                if (techTagsMarkedForRemoval.has(tag)) {
                    markForRemovalBtn.textContent = 'Remove from list';
                    markForRemovalBtn.classList.remove('btn-outline-danger');
                    markForRemovalBtn.classList.add('btn-outline-secondary');
                } else {
                    markForRemovalBtn.textContent = 'Mark for removal';
                    markForRemovalBtn.classList.remove('btn-outline-secondary');
                    markForRemovalBtn.classList.add('btn-outline-danger');
                }
                
                // Store the current tag for the removal button to use
                markForRemovalBtn.dataset.tag = tag;
            }
            
            // Store the selected tag in sessionStorage for the emerging-tech tab to use
            sessionStorage.setItem('selectedTechTag', tag);
            console.log('Tech tag cloud: stored selected tag in sessionStorage:', tag);
            
            // Force a delay to ensure the session storage is set before navigating
            setTimeout(() => {
                // Navigate to emerging-tech tab
                const emergingTechTab = document.getElementById('emerging-tech-tab');
                console.log('Tech tag cloud: navigating to emerging-tech tab', emergingTechTab);
                if (emergingTechTab) {
                    emergingTechTab.click();
                } else {
                    console.error('Could not find emerging-tech-tab element');
                }
            }, 100);
        });
        
        tagCloudContainer.appendChild(tagElement);
    });
}

/**
 * Initialize the collapsible panel functionality for the tech tag cloud
 */
function initializeTechTagCollapsiblePanel() {
    const collapseElement = document.getElementById('techTagCloudCollapse');
    const collapseIcon = document.getElementById('techTagCloudCollapseIcon');
    
    if (!collapseElement || !collapseIcon) {
        console.error('Could not find tech collapse elements');
        return;
    }
    
    console.log('Initializing tech collapsible panel with elements:', { collapseElement, collapseIcon });
    
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

/**
 * Initialize the tech tag removal feature
 */
function initializeTechTagRemovalFeature() {
    // Only initialize tag removal features if in admin mode
    if (!window.isAdminMode) {
        return;
    }
    
    // Initialize the mark for removal button
    const markForRemovalBtn = document.getElementById('mark-tech-tag-for-removal');
    if (markForRemovalBtn) {
        markForRemovalBtn.addEventListener('click', () => {
            const tag = markForRemovalBtn.dataset.tag;
            if (!tag) return;
            
            if (techTagsMarkedForRemoval.has(tag)) {
                // Remove from list
                techTagsMarkedForRemoval.delete(tag);
                markForRemovalBtn.textContent = 'Mark for removal';
                markForRemovalBtn.classList.remove('btn-outline-secondary');
                markForRemovalBtn.classList.add('btn-outline-danger');
            } else {
                // Add to list
                techTagsMarkedForRemoval.add(tag);
                markForRemovalBtn.textContent = 'Remove from list';
                markForRemovalBtn.classList.remove('btn-outline-danger');
                markForRemovalBtn.classList.add('btn-outline-secondary');
            }
            
            // Update the removal tag list display
            updateTechRemovalTagList();
        });
    }
    
    // Initialize the copy to clipboard button
    const copyToClipboardBtn = document.getElementById('copy-tech-tags-to-clipboard');
    if (copyToClipboardBtn) {
        copyToClipboardBtn.addEventListener('click', () => {
            const tagsArray = Array.from(techTagsMarkedForRemoval);
            const jsonString = JSON.stringify(tagsArray, null, 2);
            navigator.clipboard.writeText(jsonString)
                .then(() => {
                    alert('Tech tags copied to clipboard as JSON array!');
                })
                .catch(err => {
                    console.error('Failed to copy tech tags to clipboard:', err);
                    // Fallback for browsers that don't support clipboard API
                    const textarea = document.createElement('textarea');
                    textarea.value = jsonString;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert('Tech tags copied to clipboard as JSON array!');
                });
        });
    }
    
    // Initialize the clear all button
    const clearAllBtn = document.getElementById('clear-tech-tags-to-remove');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all tech tags marked for removal?')) {
                techTagsMarkedForRemoval.clear();
                updateTechRemovalTagList();
            }
        });
    }
    
    // Initial update of the removal tag list
    updateTechRemovalTagList();
}

/**
 * Update the display of tech tags marked for removal
 */
function updateTechRemovalTagList() {
    const removalTagList = document.getElementById('tech-removal-tag-list');
    if (!removalTagList) return;
    
    if (techTagsMarkedForRemoval.size === 0) {
        removalTagList.innerHTML = '<em class="text-muted">No tech tags marked for removal yet</em>';
        return;
    }
    
    removalTagList.innerHTML = '';
    Array.from(techTagsMarkedForRemoval).sort().forEach(tag => {
        const tagBadge = document.createElement('span');
        tagBadge.className = 'badge bg-danger';
        tagBadge.style.position = 'relative';
        tagBadge.style.paddingRight = '25px';
        tagBadge.textContent = tag;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm text-white p-0';
        removeBtn.style.position = 'absolute';
        removeBtn.style.right = '5px';
        removeBtn.style.top = '50%';
        removeBtn.style.transform = 'translateY(-50%)';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove from list';
        
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            techTagsMarkedForRemoval.delete(tag);
            updateTechRemovalTagList();
        });
        
        tagBadge.appendChild(removeBtn);
        removalTagList.appendChild(tagBadge);
        
        // Add a space after each badge
        removalTagList.appendChild(document.createTextNode(' '));
    });
}

function updateRemovalTagList() {
    const removalTagList = document.getElementById('removal-tag-list');
    if (!removalTagList) return;
    
    if (tagsMarkedForRemoval.size === 0) {
        removalTagList.innerHTML = '<em class="text-muted">No tags marked for removal yet</em>';
        return;
    }
    
    removalTagList.innerHTML = '';
    Array.from(tagsMarkedForRemoval).sort().forEach(tag => {
        const tagBadge = document.createElement('span');
        tagBadge.className = 'badge bg-danger';
        tagBadge.style.position = 'relative';
        tagBadge.style.paddingRight = '25px';
        tagBadge.textContent = tag;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm text-white p-0';
        removeBtn.style.position = 'absolute';
        removeBtn.style.right = '5px';
        removeBtn.style.top = '50%';
        removeBtn.style.transform = 'translateY(-50%)';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove from list';
        
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tagsMarkedForRemoval.delete(tag);
            updateRemovalTagList();
        });
        
        tagBadge.appendChild(removeBtn);
        removalTagList.appendChild(tagBadge);
        
        // Add a space after each badge
        removalTagList.appendChild(document.createTextNode(' '));
    });
}
