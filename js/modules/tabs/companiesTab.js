// Companies Tab Module
import { getSurveyData } from '../../dataService.js';

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
        
        // Load the HTML template into the container
        const templateHtml = await response.text();
        container.innerHTML = templateHtml;
        
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
    // Show details section
    document.getElementById('companyDetailsSection').style.display = 'block';
    
    // Set company name
    document.getElementById('companyName').textContent = companyData.name;
    
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
    
    // Populate customer themes
    const customerThemesText = document.getElementById('customerThemesText');
    if (companyData.customerThemes.length > 0) {
        customerThemesText.innerHTML = companyData.customerThemes.map(theme => 
            `<p>${theme}</p>`
        ).join('<hr class="my-2">');
    } else {
        customerThemesText.textContent = 'No customer themes provided.';
    }
    
    // Populate emerging tech
    const emergingTechText = document.getElementById('emergingTechText');
    if (companyData.emergingTech.length > 0) {
        emergingTechText.innerHTML = companyData.emergingTech.map(tech => 
            `<p>${tech}</p>`
        ).join('<hr class="my-2">');
    } else {
        emergingTechText.textContent = 'No emerging tech information provided.';
    }
    
    // Populate challenges table
    populateInterestTable('challengesTableBody', companyData.challenges);
    
    // Populate tech concepts table
    populateInterestTable('techConceptsTableBody', companyData.techConcepts);
    
    // Populate products/vendors table
    populateInterestTable('productsVendorsTableBody', companyData.productsVendors);
}

/**
 * Populate an interest table with data
 */
function populateInterestTable(tableId, data) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';
    
    // Sort entries by interest level (highest first)
    const sortedEntries = Object.entries(data).sort((a, b) => {
        return getInterestScore(b[1]) - getInterestScore(a[1]);
    });
    
    if (sortedEntries.length > 0) {
        sortedEntries.forEach(([item, interestLevel]) => {
            const row = document.createElement('tr');
            
            const itemCell = document.createElement('td');
            itemCell.textContent = item;
            row.appendChild(itemCell);
            
            const interestCell = document.createElement('td');
            interestCell.innerHTML = getInterestBadge(interestLevel);
            row.appendChild(interestCell);
            
            tableBody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 2;
        cell.className = 'text-center text-muted';
        cell.textContent = 'No data available';
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}
