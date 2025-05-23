// Script to generate anonymized mock data for brightspots.json
const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Configure faker to use a consistent seed for reproducible results
faker.seed(123);

// Interest levels used throughout the data
const interestLevels = [
    'Niets over gehoord',
    'Vage interesse',
    'Redelijke interesse', 
    'Sterke, concrete interesse'
];

// List of mock companies
const companies = Array(20).fill().map(() => faker.company.name());

// List of mock roles
const roles = [
    'CEO', 'CTO', 'CIO', 'IT Manager', 'IT Director', 
    'Software Engineer', 'Solution Architect', 'Product Manager',
    'Innovation Manager', 'Digital Transformation Lead'
];

// List of mock customer themes (more fictional)
const customerThemes = [
    'Digital Ecosystem Evolution', 'Cloud Native Architecture', 'AI-Driven Business',
    'Zero-Trust Security Framework', 'Predictive Analytics Platform', 'Hyperautomation',
    'Distributed Workforce Enablement', 'Omnichannel Experience Design', 'Mobile-First Strategy',
    'DevSecOps Transformation', 'Core Systems Reimagination', 'API Economy Participation',
    'Distributed Ledger Applications', 'Connected Systems Network', 'Business Agility Framework'
];

// List of mock tech concepts (more fictional)
const techConcepts = [
    'NeuralSync', 'QuantumFlow', 'CloudMesh',
    'EdgeNexus', 'ChainMatrix', 'IoT Fusion',
    'HoloVision', 'VirtualSphere', 'QuantumBit',
    'NextGen Networks', 'AutomationX', 'CyberShield',
    'DataNova Analytics', 'DevFlowOps', 'MicroArch',
    'ContainerPod', 'CloudFunction', 'WebFlux Apps'
];

// List of mock challenges (more fictional)
const challenges = [
    'Digital Ecosystem Transformation', 'Multi-Cloud Strategy', 'Cyber Resilience',
    'Data Sovereignty', 'Hybrid Work Model', 'Legacy-to-Modern Integration',
    'Tech Talent Strategy', 'IT Value Optimization', 'Compliance Framework',
    'Experience-Led Design', 'Intelligent Process Automation', 'Innovation Acceleration',
    'Sustainable Technology', 'Identity Orchestration', 'Infrastructure as Code',
    'Generative AI Adoption', 'Enterprise Architecture Modernization'
];

// List of mock products/vendors (more fictional)
const productsVendors = [
    'CloudSphere', 'OmniCloud', 'NexusStack',
    'RelationForge', 'EnterpriseCore', 'DataMatrix', 'CogniSys',
    'FlowService', 'WorkSphere', 'DigitalXperience',
    'TeamForge', 'CollabSync', 'VirtualMeet', 'NetConnect',
    'VirtualStack', 'ContainerOrchestra', 'ContainerShip', 'InfraCode',
    'CodeRepo', 'DevRepo', 'DataLake', 'SnowCube',
    'CodeAssist AI', 'WebAssembly+', 'VirtualKernel'
];

// Generate a random date within the last year
function randomDate() {
    const start = new Date(2024, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format date as DD-MM-YYYY HH:MM
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
}

// Generate random tags from a list
function generateTags(list, min = 1, max = 5) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Generate random interest levels for a list of items
function generateInterestLevels(items) {
    const result = {};
    items.forEach(item => {
        // 20% chance to skip an item
        if (Math.random() > 0.8) return;
        
        // Assign a random interest level
        result[item] = interestLevels[Math.floor(Math.random() * interestLevels.length)];
    });
    return result;
}

// Generate a single survey entry
function generateSurveyEntry(id) {
    const startDate = randomDate();
    const completionDate = new Date(startDate.getTime() + Math.random() * 3600000); // Up to 1 hour later
    
    const company = companies[Math.floor(Math.random() * companies.length)];
    const role = roles[Math.floor(Math.random() * roles.length)];
    
    // Sometimes leave name blank (anonymous)
    const name = Math.random() > 0.2 ? faker.person.fullName() : '';
    
    // Generate customer themes as comma-separated text with additional context
    const themesList = generateTags(customerThemes, 0, 5);
    // Create more detailed free text for themes
    const themesText = themesList.map(theme => {
        const adjectives = ['strategic', 'innovative', 'transformative', 'critical', 'emerging', 'high-priority'];
        const verbs = ['implementing', 'exploring', 'developing', 'focusing on', 'investing in', 'prioritizing'];
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const verb = verbs[Math.floor(Math.random() * verbs.length)];
        return `${verb} ${adj} ${theme.toLowerCase()}`;
    }).join('; ');
    
    // Generate emerging tech as comma-separated text with additional context
    const techList = generateTags(techConcepts, 0, 6);
    // Create more detailed free text for tech
    const techText = techList.map(tech => {
        const contexts = ['for enterprise use', 'in production environment', 'for POC', 'in R&D phase', 'with selected partners', 'across business units'];
        const timeframes = ['short-term', 'medium-term', 'long-term', 'immediate', 'ongoing', 'planned'];
        const context = contexts[Math.floor(Math.random() * contexts.length)];
        const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
        return `${tech} ${context} (${timeframe})`;
    }).join('; ');
    
    // Generate challenge interest levels
    const challengeInterests = generateInterestLevels(challenges);
    
    // Generate tech concept interest levels
    const techConceptInterests = generateInterestLevels(techConcepts);
    
    // Generate product/vendor interest levels
    const productVendorInterests = generateInterestLevels(productsVendors);
    
    return {
        "Id": id.toString(),
        "Start time": formatDate(startDate),
        "Completion time": formatDate(completionDate),
        "Email": "anonymous",
        "Name": "",
        "Jouw naam": name,
        "Rol": role,
        "Jouw bedrijf": company,
        "newCustomerThemes": themesText,
        "newCustomerThemesTags": themesList,
        "emergingTechVendorProduct": techText,
        "emergingTechVendorProductTags": techList,
        "challenges": challengeInterests,
        "techConcepts": techConceptInterests,
        "productsVendors": productVendorInterests
    };
}

// Generate the full dataset
function generateMockData(count = 50) {
    const mockData = [];
    
    for (let i = 1; i <= count; i++) {
        mockData.push(generateSurveyEntry(i));
    }
    
    return mockData;
}

// Main function to generate and save the mock data
async function main() {
    try {
        console.log('Generating mock data...');
        
        // Generate 50 mock survey entries
        const mockData = generateMockData(50);
        
        // Define output path
        const outputPath = path.join(__dirname, '..', 'data', 'brightspots-mock.json');
        
        // Write to file
        fs.writeFileSync(outputPath, JSON.stringify(mockData, null, 2), 'utf8');
        
        console.log(`Mock data successfully generated at: ${outputPath}`);
        console.log(`Generated ${mockData.length} anonymized survey entries`);
    } catch (error) {
        console.error('Error generating mock data:', error);
    }
}

// Run the script
main();
