// Companies Tab Module
import { 
    getSurveyData, 
    saveInterestDetails, 
    getInterestDetails, 
    getRecordById,
    loadThemesData,
    getThemesData,
    getThemeAssessments,
    saveThemeAssessments 
} from '../../dataService.js';

/**
 * Load the companies tab content
 */
export async function loadCompaniesContent() {
    try {
        // Get the container element
        const container = document.getElementById('companies-content');
        
        // Fetch the HTML template
        const response = await fetch('js/modules/tabs/templates/companies.html');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status}`);
        }
        
        // Fetch the interest modal template
        const interestModalResponse = await fetch('js/modules/tabs/templates/interest-modal.html');
        if (!interestModalResponse.ok) {
            throw new Error(`Failed to load interest modal template: ${interestModalResponse.status}`);
        }
        
        // Fetch the theme assessment modal template (separated to prevent event bubbling issues)
        const themeModalResponse = await fetch('js/modules/tabs/theme-assessment-modal.html');
        if (!themeModalResponse.ok) {
            throw new Error(`Failed to load theme assessment modal template: ${themeModalResponse.status}`);
        }
        
        // Load all HTML templates into the container
        const templateHtml = await response.text();
        const interestModalHtml = await interestModalResponse.text();
        const themeModalHtml = await themeModalResponse.text();
        
        // Insert regular content and interest modal into the container
        container.innerHTML = templateHtml + interestModalHtml;
        
        // Insert theme assessment modal directly into the body to prevent event bubbling
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = themeModalHtml;
        document.body.appendChild(modalWrapper.firstElementChild);
        
        // Load themes data first and ensure it's available
        console.log('Loading themes data...');
        const themes = await loadThemesData();
        console.log('Themes loaded successfully:', themes.length, 'themes');
        
        // Show themes in console for debugging
        console.table(getThemesData());
        
        // Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const isAdminMode = urlParams.get('adminMode') === 'yes';
        const uuid = urlParams.get('uuid');
        
        // Check if we have a UUID parameter or in sessionStorage
        const selectedUuid = uuid || sessionStorage.getItem('selectedUuid');
        let isUuidMode = false;
        let uuidCompanyName = null;
        
        if (selectedUuid) {
            // Find the record associated with the UUID
            const record = getRecordById(selectedUuid);
            if (record) {
                uuidCompanyName = record['Jouw bedrijf'];
                isUuidMode = true;
                console.log(`Found company ${uuidCompanyName} for UUID ${selectedUuid}`);
                
                // Clear the selectedUuid from sessionStorage after using it
                if (!uuid) {
                    sessionStorage.removeItem('selectedUuid');
                }
            } else {
                console.warn(`No record found for UUID ${selectedUuid}`);
            }
        }
        
        // Determine if we should show edit controls for this company
        // Show controls if in admin mode OR if in UUID mode for this specific company
        const showEditControls = isAdminMode || (isUuidMode && uuidCompanyName);
        
        // We're now always showing the Actions column for inspection options
        // No need to hide the column headers anymore
        
        // Get survey data
        const surveyData = getSurveyData();
        
        // Process data to group by companies (only records without a role)
        const companiesData = processCompaniesData(surveyData);
        
        // Populate company selector
        populateCompanySelector(companiesData);
        
        // Add event listener for company selection
        document.getElementById('companySelector').addEventListener('change', (event) => {
            const selectedCompany = event.target.value;
            if (selectedCompany) {
                displayCompanyDetails(companiesData[selectedCompany]);
            } else {
                // Hide details section if no company is selected
                document.getElementById('companyDetailsSection').style.display = 'none';
            }
        });
        
        // Add event listeners for interest details modal
        document.getElementById('saveInterestDetailsBtn').addEventListener('click', saveInterestDetailsHandler);
        document.getElementById('addRecordBtn').addEventListener('click', addInterestRecordHandler);
        document.getElementById('clearFormBtn').addEventListener('click', clearInterestForm);
        
        // If we have a company from the UUID, select it in the dropdown
        if (isUuidMode && uuidCompanyName && companiesData[uuidCompanyName]) {
            const companySelector = document.getElementById('companySelector');
            companySelector.value = uuidCompanyName;
            
            // Trigger the change event to display the company details
            const changeEvent = new Event('change');
            companySelector.dispatchEvent(changeEvent);
        }
        
    } catch (error) {
        console.error('Error loading companies content:', error);
    }
}

/**
 * Process survey data to group by companies
 * Only consider records without a role specified
 */
function processCompaniesData(surveyData) {
    const companiesMap = {};
    
    // Filter records without a role
    const filteredData = surveyData.filter(entry => !entry.Rol || entry.Rol.trim() === '');
    
    filteredData.forEach(entry => {
        const companyName = entry['Jouw bedrijf'];
        if (!companyName || companyName.trim() === '') return;
        
        if (!companiesMap[companyName]) {
            companiesMap[companyName] = {
                name: companyName,
                contributors: [],
                customerThemes: [],
                emergingTech: [],
                challenges: {},
                techConcepts: {},
                productsVendors: {}
            };
        }
        
        // Add contributor
        if (entry['Jouw naam'] && entry['Jouw naam'].trim() !== '') {
            companiesMap[companyName].contributors.push(entry['Jouw naam']);
        }
        
        // Add customer themes
        if (entry.newCustomerThemes && entry.newCustomerThemes.trim() !== '') {
            companiesMap[companyName].customerThemes.push(entry.newCustomerThemes);
        }
        
        // Add emerging tech
        if (entry.emergingTechVendorProduct && entry.emergingTechVendorProduct.trim() !== '') {
            companiesMap[companyName].emergingTech.push(entry.emergingTechVendorProduct);
        }
        
        // Process challenges
        if (entry.challenges) {
            Object.entries(entry.challenges).forEach(([challenge, interestLevel]) => {
                if (!interestLevel || interestLevel.trim() === '') return;
                
                const currentInterest = companiesMap[companyName].challenges[challenge];
                if (!currentInterest || getInterestScore(interestLevel) > getInterestScore(currentInterest)) {
                    companiesMap[companyName].challenges[challenge] = interestLevel;
                }
            });
        }
        
        // Process tech concepts
        if (entry.techConcepts) {
            Object.entries(entry.techConcepts).forEach(([concept, interestLevel]) => {
                if (!interestLevel || interestLevel.trim() === '') return;
                
                const currentInterest = companiesMap[companyName].techConcepts[concept];
                if (!currentInterest || getInterestScore(interestLevel) > getInterestScore(currentInterest)) {
                    companiesMap[companyName].techConcepts[concept] = interestLevel;
                }
            });
        }
        
        // Process products/vendors
        if (entry.productsVendors) {
            Object.entries(entry.productsVendors).forEach(([vendor, interestLevel]) => {
                if (!interestLevel || interestLevel.trim() === '') return;
                
                const currentInterest = companiesMap[companyName].productsVendors[vendor];
                if (!currentInterest || getInterestScore(interestLevel) > getInterestScore(currentInterest)) {
                    companiesMap[companyName].productsVendors[vendor] = interestLevel;
                }
            });
        }
    });
    
    return companiesMap;
}

/**
 * Get numeric score for interest level
 */
function getInterestScore(interestLevel) {
    switch (interestLevel) {
        case 'Sterke, concrete interesse': return 3;
        case 'Redelijke interesse': return 2;
        case 'Vage interesse': return 1;
        case 'Niets over gehoord': return 0;
        default: return -1;
    }
}

/**
 * Get interest level badge HTML
 */
function getInterestBadge(interestLevel) {
    let badgeClass = 'bg-secondary';
    
    switch (interestLevel) {
        case 'Sterke, concrete interesse':
            badgeClass = 'bg-success';
            break;
        case 'Redelijke interesse':
            badgeClass = 'bg-primary';
            break;
        case 'Vage interesse':
            badgeClass = 'bg-warning';
            break;
        case 'Niets over gehoord':
            badgeClass = 'bg-secondary';
            break;
    }
    
    return `<span class="badge ${badgeClass}">${interestLevel}</span>`;
}

/**
 * Populate company selector dropdown
 */
function populateCompanySelector(companiesData) {
    const selector = document.getElementById('companySelector');
    
    // Sort companies alphabetically
    const sortedCompanies = Object.values(companiesData).sort((a, b) => a.name.localeCompare(b.name));
    
    sortedCompanies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.name;
        option.textContent = `${company.name} (${company.contributors.length} contributor${company.contributors.length !== 1 ? 's' : ''})`;
        selector.appendChild(option);
    });
}

/**
 * Display company details
 */
function displayCompanyDetails(companyData) {
    // Check if we're in UUID mode for this specific company
    const urlParams = new URLSearchParams(window.location.search);
    const uuid = urlParams.get('uuid');
    const isAdminMode = urlParams.get('adminMode') === 'yes';
    
    let isUuidMode = false;
    if (uuid) {
        const record = getRecordById(uuid);
        if (record && record['Jouw bedrijf'] === companyData.name) {
            isUuidMode = true;
        }
    }
    
    // Determine if we should show editing controls
    const showEditControls = isAdminMode || isUuidMode;
    
    // Show details section
    document.getElementById('companyDetailsSection').style.display = 'block';
    
    // Set company name
    document.getElementById('companyName').textContent = companyData.name;
    
    // Always show the theme assessment section
    const themeAssessmentSection = document.getElementById('themeAssessmentSection');
    console.log('Showing theme assessment section for company:', companyData.name);
    themeAssessmentSection.style.display = 'block';
    
    // Initialize the collapsible panel - Show it by default for better visibility
    const collapseElement = document.getElementById('themeAssessmentCollapse');
    if (collapseElement) {
        // Add the 'show' class to make it visible by default
        collapseElement.classList.add('show');
        
        // Update the icon to match the opened state
        const iconElement = document.getElementById('themeAssessmentCollapseIcon');
        if (iconElement) {
            iconElement.classList.remove('bi-chevron-down');
            iconElement.classList.add('bi-chevron-up');
        }
    }
    
    // Initialize the collapsible panel functionality
    initializeCollapsePanel('themeAssessmentCollapse', 'themeAssessmentCollapseIcon');
    
    // Display the compact summary in the collapsible panel
    displayThemeAssessmentSummary(companyData.name);
    
    // Only initialize the edit functionality when in admin/UUID mode
    if (showEditControls) {
        // Initialize the theme assessment modal for editing
        initializeThemeAssessmentModal(companyData.name);
    } else {
        // Hide the edit button when not in admin/UUID mode
        const editBtn = document.getElementById('editThemeAssessmentBtn');
        if (editBtn) {
            editBtn.style.display = 'none';
        }
    }
    
    // Show or hide action columns based on edit permissions
    const actionHeaders = [
        document.getElementById('challengesActionsHeader'),
        document.getElementById('techConceptsActionsHeader'),
        document.getElementById('productsVendorsActionsHeader')
    ];
    
    // Toggle visibility of action columns based on edit permissions
    actionHeaders.forEach(header => {
        if (header) {
            header.style.display = showEditControls ? 'table-cell' : 'none';
        }
    });
    
    // Populate contributors list
    const contributorsList = document.getElementById('contributorsList');
    contributorsList.innerHTML = '';
    
    if (companyData.contributors.length > 0) {
        companyData.contributors.forEach(contributor => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.textContent = contributor;
            contributorsList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.className = 'list-group-item text-muted';
        li.textContent = 'Anonymous contributors';
        contributorsList.appendChild(li);
    }
    
    // Create container for customer themes section
    const customerThemesContainer = document.getElementById('customerThemesText').parentNode;
    customerThemesContainer.innerHTML = '';
    
    if (showEditControls) {
        // Create editable version for customer themes
        const customerThemesTextarea = document.createElement('textarea');
        customerThemesTextarea.className = 'form-control';
        customerThemesTextarea.id = 'customerThemesText';
        customerThemesTextarea.rows = 5;
        customerThemesTextarea.placeholder = 'Enter customer themes here...';
        customerThemesTextarea.value = companyData.customerThemes.join('\n\n');
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary mt-2';
        saveBtn.innerHTML = '<i class="bi bi-save"></i> Save Customer Themes';
        saveBtn.addEventListener('click', () => saveCustomerThemes(companyData.name, customerThemesTextarea.value));
        
        customerThemesContainer.appendChild(customerThemesTextarea);
        customerThemesContainer.appendChild(saveBtn);
    } else {
        // Create regular non-editable version
        const customerThemesText = document.createElement('p');
        customerThemesText.id = 'customerThemesText';
        
        if (companyData.customerThemes.length > 0) {
            customerThemesText.innerHTML = companyData.customerThemes.map(theme => 
                `<p>${theme}</p>`
            ).join('<hr class="my-2">');
        } else {
            customerThemesText.className = 'text-muted';
            customerThemesText.textContent = 'No customer themes provided.';
        }
        
        customerThemesContainer.appendChild(customerThemesText);
    }
    
    // Create container for emerging tech section
    const emergingTechContainer = document.getElementById('emergingTechText') ? 
        document.getElementById('emergingTechText').parentNode : 
        document.querySelector('.card-body:nth-of-type(2)');
    emergingTechContainer.innerHTML = '';
    
    if (showEditControls) {
        // Create editable version for emerging tech
        const emergingTechTextarea = document.createElement('textarea');
        emergingTechTextarea.className = 'form-control';
        emergingTechTextarea.id = 'emergingTechText';
        emergingTechTextarea.rows = 5;
        emergingTechTextarea.placeholder = 'Enter emerging tech information here...';
        emergingTechTextarea.value = companyData.emergingTech.join('\n\n');
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary mt-2';
        saveBtn.innerHTML = '<i class="bi bi-save"></i> Save Emerging Tech';
        saveBtn.addEventListener('click', () => saveEmergingTech(companyData.name, emergingTechTextarea.value));
        
        emergingTechContainer.appendChild(emergingTechTextarea);
        emergingTechContainer.appendChild(saveBtn);
    } else {
        // Create regular non-editable version
        const emergingTechText = document.createElement('p');
        emergingTechText.id = 'emergingTechText';
        
        if (companyData.emergingTech.length > 0) {
            emergingTechText.innerHTML = companyData.emergingTech.map(tech => 
                `<p>${tech}</p>`
            ).join('<hr class="my-2">');
        } else {
            emergingTechText.className = 'text-muted';
            emergingTechText.textContent = 'No emerging tech information provided.';
        }
        
        emergingTechContainer.appendChild(emergingTechText);
    }
    
    // Populate challenges table
    populateInterestTable('challengesTableBody', companyData.challenges);
    
    // Populate tech concepts table
    populateInterestTable('techConceptsTableBody', companyData.techConcepts);
    
    // Populate products/vendors table
    populateInterestTable('productsVendorsTableBody', companyData.productsVendors);
}

/**
 * Initialize the theme assessment modal to prevent flickering issues
 * @param {string} companyName - The company name
 */
function initializeThemeAssessmentModal(companyName) {
    console.log('Initializing theme assessment modal for:', companyName);
    
    // 1. First destroy any existing modal instance to prevent memory leaks
    const modalElement = document.getElementById('themeAssessmentModal');
    if (modalElement) {
        const existingModal = bootstrap.Modal.getInstance(modalElement);
        if (existingModal) {
            existingModal.dispose();
        }
    }
    
    // 2. Create a single modal instance (but don't show it yet)
    let modalInstance = null;
    
    // 3. Set up a clean edit button handler
    const editBtn = document.getElementById('editThemeAssessmentBtn');
    if (editBtn) {
        // Clear any previous event listeners
        const newEditBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newEditBtn, editBtn);
        
        // Create a clean, simple click handler
        newEditBtn.onclick = function(e) {
            // Stop event propagation to prevent conflicts
            e.stopPropagation();
            e.preventDefault();
            
            console.log('Edit button clicked, showing modal');
            
            // Prepare the modal content
            displayThemeAssessment(companyName, true);
            
            // Create the modal only if it doesn't exist
            if (!modalInstance) {
                modalInstance = new bootstrap.Modal(modalElement, {
                    backdrop: 'static',
                    keyboard: true
                });
            }
            
            // Show the modal
            modalInstance.show();
        };
    } else {
        console.error('Edit button for theme assessments not found');
    }
}

/**
 * Display theme assessment interface in the modal
 * @param {string} companyName - The company name
 * @param {boolean} isEditable - Whether the assessment is editable
 */
function displayThemeAssessment(companyName, isEditable) {
    // Get themes data
    const themes = getThemesData();
    if (!themes || themes.length === 0) {
        const container = document.getElementById('themeAssessmentContainer');
        container.innerHTML = '<div class="alert alert-warning">No themes available for assessment.</div>';
        return;
    }
    
    // Get existing assessments for this company
    const existingAssessments = getThemeAssessments(companyName) || {};
    
    // Create container for theme assessments
    const container = document.getElementById('themeAssessmentContainer');
    container.innerHTML = '';
    
    // Define the assessment options with colors
    const assessmentOptions = [
        { value: 'fully-claimed', label: 'Fully claimed', color: 'success' },
        { value: 'somewhat-associated', label: 'Somewhat associated', color: 'primary' },
        { value: 'our-ambition', label: 'It\'s our ambition', color: 'warning' },
        { value: 'not-for-us', label: 'Not for us', color: 'danger' }
    ];
    
    // Create a form for all themes
    const form = document.createElement('form');
    form.id = 'themeAssessmentForm';
    
    // Create assessment UI for each theme
    themes.forEach(theme => {
        const themeId = theme.Id;
        const themeName = theme.Name;
        const existingAssessment = existingAssessments[themeId] || {};
        
        // Create a card for each theme
        const themeCard = document.createElement('div');
        themeCard.className = 'card mb-3';
        
        // Create card header
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        cardHeader.textContent = themeName;
        themeCard.appendChild(cardHeader);
        
        // Create card body
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        // Create radio group for assessment options
        const radioGroup = document.createElement('div');
        radioGroup.className = 'mb-3';
        
        // Add label for radio group
        const radioLabel = document.createElement('label');
        radioLabel.className = 'form-label fw-bold';
        radioLabel.textContent = 'Level of involvement:';
        radioGroup.appendChild(radioLabel);
        
        // Create radio button group
        const radioButtonGroup = document.createElement('div');
        radioButtonGroup.className = 'btn-group w-100 d-flex mb-3';
        radioButtonGroup.setAttribute('role', 'group');
        
        // Add radio buttons for each assessment option
        assessmentOptions.forEach(option => {
            const isChecked = existingAssessment.involvement === option.value;
            
            const radioWrap = document.createElement('div');
            radioWrap.className = 'form-check form-check-inline flex-fill text-center';
            
            const radioInput = document.createElement('input');
            radioInput.className = 'btn-check';
            radioInput.type = 'radio';
            radioInput.name = `involvement-${themeId}`;
            radioInput.id = `${option.value}-${themeId}`;
            radioInput.value = option.value;
            radioInput.checked = isChecked;
            radioInput.disabled = !isEditable;
            
            const radioLabel = document.createElement('label');
            radioLabel.className = `btn btn-outline-${option.color} w-100`;
            radioLabel.setAttribute('for', `${option.value}-${themeId}`);
            radioLabel.textContent = option.label;
            
            radioWrap.appendChild(radioInput);
            radioWrap.appendChild(radioLabel);
            radioButtonGroup.appendChild(radioWrap);
        });
        
        radioGroup.appendChild(radioButtonGroup);
        cardBody.appendChild(radioGroup);
        
        // Add description field
        const descriptionGroup = document.createElement('div');
        descriptionGroup.className = 'mb-3';
        
        const descriptionLabel = document.createElement('label');
        descriptionLabel.className = 'form-label fw-bold';
        descriptionLabel.setAttribute('for', `description-${themeId}`);
        descriptionLabel.textContent = 'Description:';
        
        const descriptionTextarea = document.createElement('textarea');
        descriptionTextarea.className = 'form-control';
        descriptionTextarea.id = `description-${themeId}`;
        descriptionTextarea.name = `description-${themeId}`;
        descriptionTextarea.rows = 3;
        descriptionTextarea.placeholder = 'Add details about the company\'s involvement with this theme...';
        descriptionTextarea.value = existingAssessment.description || '';
        descriptionTextarea.disabled = !isEditable;
        
        descriptionGroup.appendChild(descriptionLabel);
        descriptionGroup.appendChild(descriptionTextarea);
        cardBody.appendChild(descriptionGroup);
        
        // Add card body to card
        themeCard.appendChild(cardBody);
        
        // Add card to form
        form.appendChild(themeCard);
    });
    
    // Add form to container
    container.appendChild(form);
    
    // Configure save button in the modal
    const saveButton = document.getElementById('saveThemeAssessmentBtn');
    if (saveButton && isEditable) {
        // Remove any existing event listeners to prevent duplicates
        const newSaveButton = saveButton.cloneNode(true);
        saveButton.parentNode.replaceChild(newSaveButton, saveButton);
        
        // Add save handler that updates both the modal and the summary view
        newSaveButton.addEventListener('click', () => {
            saveThemeAssessmentHandler(companyName);
            
            // After saving, update the summary view
            setTimeout(() => {
                displayThemeAssessmentSummary(companyName);
            }, 100);
            
            // Close the modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('themeAssessmentModal'));
            if (modal) {
                modal.hide();
            }
        });
    }
}

/**
 * Display a compact summary of theme assessments in the collapsible panel
 * @param {string} companyName - The company name
 */
function displayThemeAssessmentSummary(companyName) {
    console.log('Displaying theme assessment summary for company:', companyName);
    
    // Get themes data
    const themes = getThemesData();
    console.log('Themes data loaded:', themes);
    
    if (!themes || themes.length === 0) {
        console.error('No themes available for assessment summary');
        const container = document.getElementById('themeAssessmentSummary');
        container.innerHTML = '<div class="alert alert-warning p-2">No themes available.</div>';
        return;
    }
    
    // Get existing assessments for this company
    const existingAssessments = getThemeAssessments(companyName) || {};
    console.log('Existing assessments for', companyName, ':', existingAssessments);
    
    // Create container for theme assessments summary
    const container = document.getElementById('themeAssessmentSummary');
    if (!container) {
        console.error('themeAssessmentSummary container not found');
        return;
    }
    
    container.innerHTML = '';
    
    // Define the assessment options with colors
    const assessmentOptions = [
        { value: 'fully-claimed', label: 'Fully claimed', color: 'success' },
        { value: 'somewhat-associated', label: 'Somewhat associated', color: 'primary' },
        { value: 'our-ambition', label: 'Our ambition', color: 'warning' },
        { value: 'not-for-us', label: 'Not for us', color: 'danger' }
    ];
    
    // Create a table for the compact view
    const table = document.createElement('table');
    table.className = 'table table-sm table-hover';
    
    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const thTheme = document.createElement('th');
    thTheme.textContent = 'Theme';
    headerRow.appendChild(thTheme);
    
    const thInvolvement = document.createElement('th');
    thInvolvement.textContent = 'Involvement';
    headerRow.appendChild(thInvolvement);
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create table body
    const tbody = document.createElement('tbody');
    
    // Always show all themes with their assessment status
    themes.forEach(theme => {
        const themeId = theme.Id;
        const themeName = theme.Name;
        const assessment = existingAssessments[themeId];
        
        const row = document.createElement('tr');
        
        // Theme name cell
        const nameCell = document.createElement('td');
        nameCell.textContent = themeName;
        nameCell.className = 'fw-medium';
        row.appendChild(nameCell);
        
        // Status/involvement cell
        const involvementCell = document.createElement('td');
        
        if (assessment && assessment.involvement) {
            // Find the matching option
            const option = assessmentOptions.find(opt => opt.value === assessment.involvement);
            if (option) {
                // Create badge with the involvement level
                const badge = document.createElement('span');
                badge.className = `badge bg-${option.color}`;
                badge.textContent = option.label;
                involvementCell.appendChild(badge);
                
                // Add tooltip with description if available
                if (assessment.description) {
                    involvementCell.setAttribute('title', assessment.description);
                    involvementCell.style.cursor = 'help';
                }
            } else {
                involvementCell.textContent = 'Not specified';
            }
        } else {
            // No assessment yet
            const badge = document.createElement('span');
            badge.className = 'badge bg-secondary';
            badge.textContent = 'Not assessed';
            involvementCell.appendChild(badge);
        }
        
        row.appendChild(involvementCell);
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

/**
 * Helper function to initialize a collapsible panel
 * @param {string} collapseId - The ID of the collapse element
 * @param {string} iconId - The ID of the icon element to toggle
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

/**
 * Save theme assessment handler
 * @param {string} companyName - The company name
 */
function saveThemeAssessmentHandler(companyName) {
    try {
        // Get the form
        const form = document.getElementById('themeAssessmentForm');
        if (!form) {
            console.error('Theme assessment form not found');
            return false;
        }
        
        // Get themes data
        const themes = getThemesData();
        if (!themes || themes.length === 0) {
            console.error('No themes available');
            return false;
        }
        
        // Get existing assessments or initialize empty object
        const assessments = getThemeAssessments(companyName) || {};
        
        // Process each theme assessment
        themes.forEach(theme => {
            const themeId = theme.Id;
            
            // Get involvement value
            const involvementRadios = form.querySelectorAll(`input[name="involvement-${themeId}"]`);
            let involvement = null;
            involvementRadios.forEach(radio => {
                if (radio.checked) {
                    involvement = radio.value;
                }
            });
            
            // Get description value
            const descriptionTextarea = document.getElementById(`description-${themeId}`);
            const description = descriptionTextarea ? descriptionTextarea.value : '';
            
            // Only save if involvement is selected or description is not empty
            if (involvement || description) {
                assessments[themeId] = {
                    involvement,
                    description,
                    timestamp: new Date().toISOString()
                };
            }
        });
        
        // Save the assessments
        saveThemeAssessments(companyName, assessments);
        
        // Show success message
        alert('Theme assessments saved successfully!');
        
        return true;
    } catch (error) {
        console.error('Error saving theme assessments:', error);
        alert('Failed to save theme assessments: ' + error.message);
        return false;
    }
}

/**
 * Populate an interest table with data
 */
function populateInterestTable(tableId, data) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';
    
    // Check URL parameters for admin and UUID modes
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('adminMode') === 'yes';
    const uuid = urlParams.get('uuid');
    
    // Get the current company name
    const companyName = document.getElementById('companyName').textContent;
    
    // Check if we're in UUID mode for this specific company
    let isUuidMode = false;
    if (uuid) {
        const record = getRecordById(uuid);
        if (record && record['Jouw bedrijf'] === companyName) {
            isUuidMode = true;
        }
    }
    
    // Determine if we should show editing controls
    // Show controls if in admin mode OR if in UUID mode for this specific company
    const showEditControls = isAdminMode || isUuidMode;
    
    // Determine category based on tableId
    let category;
    switch(tableId) {
        case 'challengesTableBody':
            category = 'challenges';
            break;
        case 'techConceptsTableBody':
            category = 'techConcepts';
            break;
        case 'productsVendorsTableBody':
            category = 'productsVendors';
            break;
    }
    
    // Sort entries by interest level (highest first)
    const sortedEntries = Object.entries(data).sort((a, b) => {
        return getInterestScore(b[1]) - getInterestScore(a[1]);
    });
    
    if (sortedEntries.length > 0) {
        sortedEntries.forEach(([item, interestLevel]) => {
            const row = document.createElement('tr');
            
            // Check for existing details
            const hasExistingDetails = getInterestDetails(companyName, category, item) !== null;
            
            // Create the item cell
            const itemCell = document.createElement('td');
            // Just use the plain text now since we're adding a dedicated inspect button
            itemCell.textContent = item;
            row.appendChild(itemCell);
            
            // Create the interest level cell
            const interestCell = document.createElement('td');
            interestCell.innerHTML = getInterestBadge(interestLevel);
            row.appendChild(interestCell);
            
            // Create the actions cell
            const actionsCell = document.createElement('td');
            
            // Only add buttons or content if edit controls should be shown
            if (showEditControls) {
                // Only add inspect/edit buttons for items with high interest levels
                if (interestLevel === 'Sterke, concrete interesse' || interestLevel === 'Redelijke interesse') {
                    // Create edit button in admin/UUID mode
                    const btn = document.createElement('button');
                    btn.className = 'btn btn-sm btn-outline-primary';
                    btn.innerHTML = '<i class="bi bi-pencil"></i> Details';
                    btn.setAttribute('data-company', companyName);
                    btn.setAttribute('data-category', category);
                    btn.setAttribute('data-topic', item);
                    btn.setAttribute('data-admin-mode', 'true');
                    btn.addEventListener('click', openInterestDetailsModal);
                    actionsCell.appendChild(btn);
                } else {
                    // Low interest items - no action needed in admin mode
                    actionsCell.innerHTML = '<span class="text-muted">-</span>';
                }
            } else if (hasExistingDetails) {
                // In view-only mode, only show inspect button when details exist
                const details = getInterestDetails(companyName, category, item);
                const recordCount = details?.records?.length || 0;
                
                if (recordCount > 0) {
                    const viewBtn = document.createElement('button');
                    viewBtn.className = 'btn btn-sm btn-outline-info';
                    viewBtn.innerHTML = `<i class="bi bi-eye"></i> Inspect (${recordCount} ${recordCount === 1 ? 'detail' : 'details'})`;
                    viewBtn.setAttribute('data-company', companyName);
                    viewBtn.setAttribute('data-category', category);
                    viewBtn.setAttribute('data-topic', item);
                    viewBtn.setAttribute('data-admin-mode', 'false');
                    viewBtn.addEventListener('click', openInterestDetailsModal);
                    actionsCell.appendChild(viewBtn);
                } else {
                    // Empty cell when no details to view
                    actionsCell.innerHTML = '';
                }
            } else {
                // Empty cell in view mode with no details
                actionsCell.innerHTML = '';
            }
            
            row.appendChild(actionsCell);
            
            tableBody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        // Adjust colspan based on edit controls visibility
        cell.colSpan = showEditControls ? 3 : 2;
        cell.className = 'text-center text-muted';
        cell.textContent = 'No data available';
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

// Array to store new records before saving
let newInterestRecords = [];

/**
 * Open the interest details modal
 */
function openInterestDetailsModal(event) {
    const button = event.currentTarget;
    const company = button.getAttribute('data-company');
    const category = button.getAttribute('data-category');
    const topic = button.getAttribute('data-topic');
    const isAdminMode = button.getAttribute('data-admin-mode') === 'true';
    
    // Reset the new records array
    newInterestRecords = [];
    
    // Set the form hidden fields
    document.getElementById('detailsCompany').value = company;
    document.getElementById('detailsCategory').value = category;
    document.getElementById('detailsTopic').value = topic;
    
    // Set the modal title based on admin mode
    if (isAdminMode) {
        document.getElementById('interestDetailsModalLabel').textContent = `Record Interest Details for ${topic}`;
    } else {
        document.getElementById('interestDetailsModalLabel').textContent = `Interest Details for ${topic}`;
    }
    
    // Clear the form
    clearInterestForm();
    
    // Hide the records to save section
    document.getElementById('recordsToSaveSection').style.display = 'none';
    
    // Get elements to show/hide based on admin mode
    const addNewRecordSection = document.querySelector('.card.mb-4');
    const saveAllRecordsBtn = document.getElementById('saveInterestDetailsBtn');
    
    // Show/hide elements based on admin mode
    if (isAdminMode) {
        // Admin mode - show all controls
        addNewRecordSection.style.display = 'block';
        saveAllRecordsBtn.style.display = 'block';
    } else {
        // View-only mode - hide record adding controls
        addNewRecordSection.style.display = 'none';
        saveAllRecordsBtn.style.display = 'none';
    }
    
    // Check if there are existing details
    const existingDetails = getInterestDetails(company, category, topic);
    if (existingDetails && existingDetails.records && existingDetails.records.length > 0) {
        // Show existing records
        const recordsList = document.getElementById('existingRecordsList');
        recordsList.innerHTML = '';
        
        existingDetails.records.forEach((record, index) => {
            const recordItem = document.createElement('div');
            recordItem.className = 'list-group-item';
            recordItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h6>Customer: ${record.where}</h6>
                    <span class="badge bg-secondary">${record.when}</span>
                </div>
                <p><strong>Interest:</strong> ${record.what}</p>
                <p><strong>Contact:</strong> ${record.from}</p>
            `;
            recordsList.appendChild(recordItem);
        });
        
        document.getElementById('existingRecordsSection').style.display = 'block';
    } else {
        // No existing records
        const recordsList = document.getElementById('existingRecordsList');
        recordsList.innerHTML = '<div class="list-group-item text-muted">No existing records found.</div>';
        document.getElementById('existingRecordsSection').style.display = 'block';
    }
    
    // Open the modal
    const modal = new bootstrap.Modal(document.getElementById('interestDetailsModal'));
    modal.show();
}

/**
 * Clear the interest form
 */
function clearInterestForm() {
    document.getElementById('interestDetailsForm').reset();
}

/**
 * Add a new interest record to the list
 */
function addInterestRecordHandler() {
    // Get form data
    const where = document.getElementById('detailsWhere').value;
    const when = document.getElementById('detailsWhen').value;
    const what = document.getElementById('detailsWhat').value;
    const from = document.getElementById('detailsFrom').value;
    
    // Validate form - 'from' field is now optional
    if (!where || !when || !what) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Create record object
    const record = {
        where,
        when,
        what,
        from: from || 'Not specified', // Use a default value if from is empty
        timestamp: new Date().toISOString()
    };
    
    // Add to new records array
    newInterestRecords.push(record);
    
    // Update the records to save section
    updateRecordsToSaveSection();
    
    // Clear the form for the next record
    clearInterestForm();
}

/**
 * Update the records to save section
 */
function updateRecordsToSaveSection() {
    const recordsToSaveSection = document.getElementById('recordsToSaveSection');
    const recordsToSaveList = document.getElementById('recordsToSaveList');
    
    // Show the section if there are records
    if (newInterestRecords.length > 0) {
        recordsToSaveSection.style.display = 'block';
        
        // Update the list
        recordsToSaveList.innerHTML = '';
        
        newInterestRecords.forEach((record, index) => {
            const recordItem = document.createElement('div');
            recordItem.className = 'list-group-item';
            recordItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h6>Customer: ${record.where}</h6>
                    <span class="badge bg-success">${record.when}</span>
                </div>
                <p><strong>Interest:</strong> ${record.what}</p>
                <p><strong>Contact:</strong> ${record.from}</p>
                <button type="button" class="btn btn-sm btn-outline-danger remove-record" data-index="${index}">
                    <i class="bi bi-trash"></i> Remove
                </button>
            `;
            recordsToSaveList.appendChild(recordItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-record').forEach(button => {
            button.addEventListener('click', removeInterestRecord);
        });
    } else {
        recordsToSaveSection.style.display = 'none';
    }
}

/**
 * Remove an interest record from the list
 */
function removeInterestRecord(event) {
    const index = parseInt(event.currentTarget.getAttribute('data-index'));
    
    // Remove the record from the array
    newInterestRecords.splice(index, 1);
    
    // Update the records to save section
    updateRecordsToSaveSection();
}

/**
 * Save interest details handler
 */
function saveInterestDetailsHandler() {
    // Get form data
    const company = document.getElementById('detailsCompany').value;
    const category = document.getElementById('detailsCategory').value;
    const topic = document.getElementById('detailsTopic').value;
    
    // Validate form
    if (!company || !category || !topic || newInterestRecords.length === 0) {
        alert('Please add at least one record');
        return;
    }
    
    // Get existing details if any
    const existingDetails = getInterestDetails(company, category, topic) || { records: [] };
    
    // Combine existing and new records
    const updatedRecords = [...existingDetails.records, ...newInterestRecords];
    
    // Create updated details object
    const details = {
        topic,
        category,
        lastUpdated: new Date().toISOString(),
        records: updatedRecords
    };
    
    // Save the details
    if (saveInterestDetails(company, category, topic, details)) {
        alert('Interest details saved successfully');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('interestDetailsModal'));
        modal.hide();
        
        // Refresh the table
        const companiesData = processCompaniesData(getSurveyData());
        const selectedCompany = document.getElementById('companySelector').value;
        if (selectedCompany) {
            displayCompanyDetails(companiesData[selectedCompany]);
        }
    } else {
        alert('Failed to save interest details');
    }
}

/**
 * Save Customer Themes
 * @param {string} companyName - The name of the company
 * @param {string} themesText - The customer themes text to save
 */
function saveCustomerThemes(companyName, themesText) {
    try {
        // Get current survey data
        const surveyData = getSurveyData();
        
        // Find the company records (without a role)
        const companyRecords = surveyData.filter(entry => 
            entry['Jouw bedrijf'] === companyName && (!entry.Rol || entry.Rol.trim() === '')
        );
        
        if (companyRecords.length === 0) {
            alert('No company record found to update');
            return false;
        }
        
        // Split text by double newlines to create array
        const themes = themesText.split('\n\n')
            .map(theme => theme.trim())
            .filter(theme => theme.length > 0);
        
        // Update the first record for this company
        companyRecords[0].newCustomerThemes = themes.join('; ');
        
        alert('Customer themes saved successfully');
        
        // Refresh the company details
        const companiesData = processCompaniesData(getSurveyData());
        displayCompanyDetails(companiesData[companyName]);
        
        return true;
    } catch (error) {
        console.error('Error saving customer themes:', error);
        alert('Failed to save customer themes: ' + error.message);
        return false;
    }
}

/**
 * Save Emerging Tech
 * @param {string} companyName - The name of the company
 * @param {string} techText - The emerging tech text to save
 */
function saveEmergingTech(companyName, techText) {
    try {
        // Get current survey data
        const surveyData = getSurveyData();
        
        // Find the company records (without a role)
        const companyRecords = surveyData.filter(entry => 
            entry['Jouw bedrijf'] === companyName && (!entry.Rol || entry.Rol.trim() === '')
        );
        
        if (companyRecords.length === 0) {
            alert('No company record found to update');
            return false;
        }
        
        // Split text by double newlines to create array
        const techItems = techText.split('\n\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        
        // Update the first record for this company
        companyRecords[0].emergingTechVendorProduct = techItems.join('; ');
        
        alert('Emerging tech information saved successfully');
        
        // Refresh the company details
        const companiesData = processCompaniesData(getSurveyData());
        displayCompanyDetails(companiesData[companyName]);
        
        return true;
    } catch (error) {
        console.error('Error saving emerging tech information:', error);
        alert('Failed to save emerging tech information: ' + error.message);
        return false;
    }
}
