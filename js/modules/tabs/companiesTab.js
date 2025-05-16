// Companies Tab Module
import { getCompanies, getProductsVendors } from '../../dataService.js';

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
        
        // Get data
        const companies = getCompanies();
        const productsVendors = getProductsVendors();
        
        // Update company statistics
        document.getElementById('total-companies').textContent = companies.length;
        const totalRespondents = companies.reduce((sum, company) => sum + company.count, 0);
        document.getElementById('total-respondents').textContent = totalRespondents;
        document.getElementById('avg-respondents').textContent = (totalRespondents / companies.length).toFixed(1);
        
        // Populate top companies list
        const topCompaniesList = document.getElementById('top-companies-list');
        topCompaniesList.innerHTML = companies.slice(0, 5).map(company => `
            <li><strong>${company.name}</strong> - ${company.count} respondent${company.count !== 1 ? 's' : ''}</li>
        `).join('');
        
        // Populate companies accordion
        const companiesAccordion = document.getElementById('companiesAccordion');
        companiesAccordion.innerHTML = companies.map((company, index) => `
            <div class="accordion-item company-item">
                <h2 class="accordion-header" id="heading${index}">
                    <button class="accordion-button ${index !== 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="${index === 0 ? 'true' : 'false'}" aria-controls="collapse${index}">
                        <div class="d-flex justify-content-between align-items-center w-100 me-3">
                            <span>${company.name}</span>
                            <span class="badge bg-primary rounded-pill">${company.count} respondent${company.count !== 1 ? 's' : ''}</span>
                        </div>
                    </button>
                </h2>
                <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading${index}" data-bs-parent="#companiesAccordion">
                    <div class="accordion-body">
                        <h6>Respondents:</h6>
                        <ul class="list-group mb-3">
                            ${company.respondents.map(respondent => `
                                <li class="list-group-item">
                                    <div class="fw-bold">${respondent.name}</div>
                                    ${respondent.themes ? `
                                        <div class="mt-2">
                                            <strong>Customer Themes:</strong>
                                            <p class="text-muted small">${respondent.themes}</p>
                                        </div>
                                    ` : ''}
                                    ${respondent.emergingTech ? `
                                        <div class="mt-2">
                                            <strong>Emerging Tech/Vendor/Product:</strong>
                                            <p class="text-muted small">${respondent.emergingTech}</p>
                                        </div>
                                    ` : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Populate vendors table
        const vendorsTableBody = document.getElementById('vendorsTableBody');
        vendorsTableBody.innerHTML = productsVendors.map(vendor => `
            <tr class="vendor-row">
                <td>${vendor.vendor}</td>
                <td>${vendor.interestCounts['Niets over gehoord']}</td>
                <td>${vendor.interestCounts['Vage interesse']}</td>
                <td>${vendor.interestCounts['Redelijke interesse']}</td>
                <td>${vendor.interestCounts['Sterke, concrete interesse']}</td>
                <td><strong>${vendor.weightedScore.toFixed(2)}</strong></td>
            </tr>
        `).join('');
        
        // Initialize search functionality
        initializeSearch();
        
        // Create charts
        createCompaniesChart(companies);
        createTopVendorsChart(productsVendors.slice(0, 10));
        
    } catch (error) {
        console.error('Error loading companies content:', error);
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    // Company search
    const companySearchInput = document.getElementById('companySearch');
    const companySearchBtn = document.getElementById('companySearchBtn');
    const companyItems = document.querySelectorAll('.company-item');
    
    const performCompanySearch = () => {
        const searchTerm = companySearchInput.value.toLowerCase();
        
        companyItems.forEach(item => {
            const companyName = item.querySelector('.accordion-button span').textContent.toLowerCase();
            const respondents = Array.from(item.querySelectorAll('.list-group-item')).map(li => li.textContent.toLowerCase());
            
            const matchesCompany = companyName.includes(searchTerm);
            const matchesRespondent = respondents.some(text => text.includes(searchTerm));
            
            if (matchesCompany || matchesRespondent) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    };
    
    if (companySearchBtn) {
        companySearchBtn.addEventListener('click', performCompanySearch);
    }
    
    if (companySearchInput) {
        companySearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performCompanySearch();
            }
        });
    }
    
    // Vendor search
    const vendorSearchInput = document.getElementById('vendorSearch');
    const vendorSearchBtn = document.getElementById('vendorSearchBtn');
    const vendorRows = document.querySelectorAll('.vendor-row');
    
    const performVendorSearch = () => {
        const searchTerm = vendorSearchInput.value.toLowerCase();
        
        vendorRows.forEach(row => {
            const vendor = row.querySelector('td:first-child').textContent.toLowerCase();
            
            if (vendor.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };
    
    if (vendorSearchBtn) {
        vendorSearchBtn.addEventListener('click', performVendorSearch);
    }
    
    if (vendorSearchInput) {
        vendorSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performVendorSearch();
            }
        });
    }
}

/**
 * Create a chart showing companies by number of respondents
 */
function createCompaniesChart(companies) {
    const ctx = document.getElementById('companiesChart');
    
    if (!ctx) return;
    
    // Take top 10 companies by respondent count
    const topCompanies = companies.slice(0, 10);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topCompanies.map(company => company.name),
            datasets: [{
                label: 'Number of Respondents',
                data: topCompanies.map(company => company.count),
                backgroundColor: 'rgba(13, 110, 253, 0.7)',
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Respondents'
                    }
                }
            }
        }
    });
}

/**
 * Create a chart showing top products/vendors
 */
function createTopVendorsChart(vendors) {
    const ctx = document.getElementById('topVendorsChart');
    
    if (!ctx) return;
    
    const labels = vendors.map(vendor => vendor.vendor);
    const strongInterest = vendors.map(vendor => vendor.interestCounts['Sterke, concrete interesse']);
    const reasonableInterest = vendors.map(vendor => vendor.interestCounts['Redelijke interesse']);
    const vagueInterest = vendors.map(vendor => vendor.interestCounts['Vage interesse']);
    const noInterest = vendors.map(vendor => vendor.interestCounts['Niets over gehoord']);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Strong Interest',
                    data: strongInterest,
                    backgroundColor: '#d1e7dd',
                    borderColor: '#0f5132',
                    borderWidth: 1
                },
                {
                    label: 'Reasonable Interest',
                    data: reasonableInterest,
                    backgroundColor: '#fff3cd',
                    borderColor: '#664d03',
                    borderWidth: 1
                },
                {
                    label: 'Vague Interest',
                    data: vagueInterest,
                    backgroundColor: '#cff4fc',
                    borderColor: '#055160',
                    borderWidth: 1
                },
                {
                    label: 'No Interest',
                    data: noInterest,
                    backgroundColor: '#e9ecef',
                    borderColor: '#6c757d',
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
