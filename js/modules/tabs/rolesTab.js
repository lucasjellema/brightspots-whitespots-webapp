// People Tab Module
import { getSurveyData } from '../../dataService.js';

/**
 * Load the roles tab content (now showing people)
 */
export async function loadRolesContent() {
    try {
        // Get the container element
        const container = document.getElementById('roles-content');
        
        // Fetch the HTML template
        const response = await fetch('js/modules/tabs/templates/roles.html');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status}`);
        }
        
        // Load the HTML template into the container
        const templateHtml = await response.text();
        container.innerHTML = templateHtml;
        
        // Get survey data
        const surveyData = getSurveyData();
        
        // Process data for individual people
        const peopleData = processPeopleData(surveyData);
        
        // Populate person selector
        populatePersonSelector(peopleData);
        
        // Add event listener for person selection
        document.getElementById('personSelector').addEventListener('change', (event) => {
            const selectedPersonId = event.target.value;
            if (selectedPersonId) {
                displayPersonDetails(peopleData[selectedPersonId]);
            } else {
                // Hide details section if no person is selected
                document.getElementById('personDetailsSection').style.display = 'none';
            }
        });
        
    } catch (error) {
        console.error('Error loading people content:', error);
    }
}

/**
 * Process survey data for individual people
 * Only include people with a specified role
 */
function processPeopleData(surveyData) {
    const peopleMap = {};
    
    // Filter to only include entries with a role specified
    const filteredData = surveyData.filter(entry => entry.Rol && entry.Rol.trim() !== '');
    
    filteredData.forEach((entry, index) => {
        const personName = entry['Jouw naam'] && entry['Jouw naam'].trim() !== '' ? entry['Jouw naam'] : 'Anonymous ' + (index + 1);
        const personId = `person_${index}`;
        
        peopleMap[personId] = {
            id: personId,
            name: personName,
            role: entry.Rol,
            company: entry['Jouw bedrijf'] || 'Unknown',
            customerThemes: entry.newCustomerThemes || '',
            emergingTech: entry.emergingTechVendorProduct || '',
            challenges: {},
            techConcepts: {},
            productsVendors: {}
        };
        
        // Process challenges
        if (entry.challenges) {
            Object.entries(entry.challenges).forEach(([challenge, interestLevel]) => {
                if (interestLevel && interestLevel.trim() !== '') {
                    peopleMap[personId].challenges[challenge] = interestLevel;
                }
            });
        }
        
        // Process tech concepts
        if (entry.techConcepts) {
            Object.entries(entry.techConcepts).forEach(([concept, interestLevel]) => {
                if (interestLevel && interestLevel.trim() !== '') {
                    peopleMap[personId].techConcepts[concept] = interestLevel;
                }
            });
        }
        
        // Process products/vendors
        if (entry.productsVendors) {
            Object.entries(entry.productsVendors).forEach(([vendor, interestLevel]) => {
                if (interestLevel && interestLevel.trim() !== '') {
                    peopleMap[personId].productsVendors[vendor] = interestLevel;
                }
            });
        }
    });
    
    return peopleMap;
}

/**
 * Get interest score for a level
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
 * Populate person selector dropdown
 */
function populatePersonSelector(peopleData) {
    const selector = document.getElementById('personSelector');
    
    // Sort people alphabetically by name
    const sortedPeople = Object.values(peopleData).sort((a, b) => a.name.localeCompare(b.name));
    
    sortedPeople.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        option.textContent = `${person.name} (${person.role})`;
        selector.appendChild(option);
    });
}

/**
 * Display person details
 */
function displayPersonDetails(personData) {
    // Show details section
    document.getElementById('personDetailsSection').style.display = 'block';
    
    // Set person name and info
    document.getElementById('personName').textContent = personData.name;
    document.getElementById('personInfo').textContent = `${personData.role} at ${personData.company}`;
    
    // Populate customer themes
    const customerThemesText = document.getElementById('customerThemesText');
    if (personData.customerThemes && personData.customerThemes.trim() !== '') {
        customerThemesText.innerHTML = `<p>${personData.customerThemes}</p>`;
    } else {
        customerThemesText.textContent = 'No customer themes provided.';
    }
    
    // Populate emerging tech
    const emergingTechText = document.getElementById('emergingTechText');
    if (personData.emergingTech && personData.emergingTech.trim() !== '') {
        emergingTechText.innerHTML = `<p>${personData.emergingTech}</p>`;
    } else {
        emergingTechText.textContent = 'No emerging tech information provided.';
    }
    
    // Populate challenges table
    populatePersonInterestTable('challengesTableBody', personData.challenges);
    
    // Populate tech concepts table
    populatePersonInterestTable('techConceptsTableBody', personData.techConcepts);
    
    // Populate products/vendors table
    populatePersonInterestTable('productsVendorsTableBody', personData.productsVendors);
}

/**
 * Populate an interest table with data for a single person
 */
function populatePersonInterestTable(tableId, data) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = '';
    
    // Convert data to array and sort by interest level
    const sortedItems = Object.entries(data).map(([item, interestLevel]) => {
        return {
            item,
            interestLevel,
            score: getInterestScore(interestLevel)
        };
    }).sort((a, b) => b.score - a.score);
    
    if (sortedItems.length > 0) {
        sortedItems.forEach(({ item, interestLevel }) => {
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
