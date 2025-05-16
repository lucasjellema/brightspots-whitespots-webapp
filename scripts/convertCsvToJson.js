const fs = require('fs');
const path = require('path');

// Define file paths
const inputFile = path.join(__dirname, '../data', 'brightspots.csv');
const outputFile = path.join(__dirname, '../data', 'brightspots.json');

// Function to convert CSV to JSON with structured transformation
function convertCsvToJson(csvFilePath, jsonFilePath) {
  try {
    // Read the CSV file
    const csvData = fs.readFileSync(csvFilePath, 'utf8');

    // Extract headers from the first line
    const lines = csvData.split(/\r?\n/);
    const headers = lines[0].split(';');

    // Process the file content to identify records that start with 'xx'
    const records = [];
    let currentRecord = '';

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;

      if (line.startsWith('xx')) {
        // This is a new record, save the previous one if it exists
        if (currentRecord) {
          records.push(currentRecord);
        }
        currentRecord = line.substring(2); // Remove the 'xx' prefix
      } else {
        // This is a continuation of the current record
        if (currentRecord) {
          currentRecord += '\n' + line;
        }
      }
    }

    // Add the last record
    if (currentRecord) {
      records.push(currentRecord);
    }

    // Process each record
    const jsonData = [];
    for (const record of records) {
      // Split the record by semicolons, but respect quoted values
      const values = [];
      let currentValue = '';
      let inQuotes = false;

      for (let j = 0; j < record.length; j++) {
        const char = record[j];

        if (char === '"') {
          inQuotes = !inQuotes;
          currentValue += char;
        } else if (char === ';' && !inQuotes) {
          values.push(currentValue);
          currentValue = '';
        } else {
          currentValue += char;
        }
      }

      // Add the last value
      values.push(currentValue);

      // Skip if the record doesn't have enough values
      if (values.length < 5) continue; // Require at least basic fields

      // Create a structured object for each record
      const entry = {};
      const challengesObj = {};
      const techConceptsObj = {};
      const productsVendorsObj = {};

      headers.forEach((header, index) => {
        // Handle case where values might be missing
        if (index < values.length) {
          // Clean up the value - remove surrounding quotes if present
          let value = values[index];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }

          // Organize properties into structured objects
          if (header.startsWith('Wat zijn uitdagingen en thema\'s waar je klanten over hoort?.')) {
            // Extract the challenge name (everything after the prefix)
            const challengeName = header.replace('Wat zijn uitdagingen en thema\'s waar je klanten over hoort?.', '');
            challengesObj[challengeName] = value;
          } else if (header.startsWith('TechAndConcepts.')) {
            // Extract the tech concept name
            const techConceptName = header.replace('TechAndConcepts.', '');
            techConceptsObj[techConceptName] = value;
          } else if (header.startsWith('Wat zijn concrete producten en leveranciers waar je klanten over hoort?.')) {
            // Extract the product/vendor name
            const productVendorName = header.replace('Wat zijn concrete producten en leveranciers waar je klanten over hoort?.', '');
            productsVendorsObj[productVendorName] = value;
          } else {
            // Keep other properties as is
            entry[header] = value;
          }
        }
      });

      // Add the structured objects to the entry
      entry['challenges'] = challengesObj;
      entry['techConcepts'] = techConceptsObj;
      entry['productsVendors'] = productsVendorsObj;

      // Get the company name from "Jouw bedrijf" field to filter it out
      const companyToFilter = entry['Jouw bedrijf'] || '';

      // Extract relevant entities from newCustomerThemes if it exists
      if (entry['newCustomerThemes']) {
        // Extract entities and add them as a property
        const themeTags = extractEntitiesFromText(entry['newCustomerThemes'], companyToFilter);
        // Normalize case and deduplicate tags
        const normalizedThemeTags = normalizeTags(themeTags);
        // Make sure to add the tags as a proper array
        entry.newCustomerThemesTags = normalizedThemeTags;
        console.log(`Extracted ${normalizedThemeTags.length} newCustomerThemesTags for record ${entry['Id']}`);
      }

      // Extract relevant entities from emergingTechVendorProduct if it exists
      if (entry['emergingTechVendorProduct']) {
        // Extract entities and add them as a property
        const vendorTags = extractEntitiesFromText(entry['emergingTechVendorProduct'], companyToFilter);
        // Normalize case and deduplicate tags
        const normalizedVendorTags = normalizeTags(vendorTags);
        // Make sure to add the tags as a proper array
        entry.emergingTechVendorProductTags = normalizedVendorTags;
        console.log(`Extracted ${normalizedVendorTags.length} emergingTechVendorProductTags for record ${entry['Id']}`);
      }

      jsonData.push(entry);
    }

    // Write the JSON data to a file
    fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf8');

    console.log(`Conversion complete! JSON file saved to: ${jsonFilePath}`);
    console.log(`Converted ${jsonData.length} records from CSV to JSON with structured organization`);
    return jsonData;
  } catch (error) {
    console.error('Error converting CSV to JSON:', error);
    throw error;
  }
}

/**
 * Extract relevant entities from text
 * This function identifies key technology and business concepts from free text
 * @param {string} text - The text to extract entities from
 * @param {string} companyToFilter - The company name from "Jouw bedrijf" to filter out
 * @return {string[]} Array of extracted entities
 */
function extractEntitiesFromText(text, companyToFilter = '') {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Common tech and business terms to look for
  const keyTerms = [
    // AI and data related
    'AI', 'Artificial Intelligence', 'Machine Learning', 'ML', 'Deep Learning',
    'NLP', 'Natural Language Processing', 'Computer Vision', 'Data Science',
    'Big Data', 'Data Mining', 'Data Analytics', 'Business Intelligence', 'BI',
    'Predictive Analytics', 'Data Visualization', 'Data Warehouse', 'Data Lake',
    'ETL', 'Data Governance', 'Data Quality', 'Data Management', 'Data Security',
    'AI Agents', 'Agentic AI', 'LLM', 'Large Language Model', 'Generative AI',
    'GenAI', 'Chatbot', 'Virtual Assistant', 'Conversational AI',

    // Cloud and infrastructure
    'Cloud', 'AWS', 'Azure', 'Google Cloud', 'GCP', 'IaaS', 'PaaS', 'SaaS',
    'Serverless', 'Microservices', 'Containers', 'Docker', 'Kubernetes', 'K8s',
    'DevOps', 'CI/CD', 'Infrastructure as Code', 'IaC', 'Terraform',

    // Database technologies
    'SQL', 'NoSQL', 'Graph Database', 'MongoDB', 'PostgreSQL', 'MySQL',
    'Oracle', 'Redis', 'Elasticsearch', 'Neo4j', 'Cassandra', 'DynamoDB',

    // Software development
    'API', 'REST', 'GraphQL', 'Microservices', 'Web Services', 'SDK',
    'Frontend', 'Backend', 'Full Stack', 'Mobile Development', 'Web Development',
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', '.NET', 'React',
    'Angular', 'Vue.js', 'Node.js',

    // Security
    'Cybersecurity', 'Security', 'Encryption', 'Authentication', 'Authorization',
    'Identity Management', 'IAM', 'Zero Trust', 'Compliance', 'GDPR', 'Privacy',

    // Business concepts
    'Digital Transformation', 'Innovation', 'Agile', 'Scrum', 'Kanban',
    'Project Management', 'Product Management', 'UX', 'User Experience',
    'Customer Experience', 'CX', 'ROI', 'KPI', 'Metrics', 'Analytics',
    'Strategy', 'Business Model', 'Revenue Model', 'Growth',

    // Emerging technologies
    'IoT', 'Internet of Things', 'Blockchain', 'AR', 'VR', 'XR',
    'Augmented Reality', 'Virtual Reality', 'Mixed Reality', 'Metaverse',
    '5G', 'Edge Computing', 'Quantum Computing', 'Robotics', 'Automation',
    'RPA', 'Robotic Process Automation'
  ];

  // Prepare regex patterns for each term (case insensitive, whole word)
  const patterns = keyTerms.map(term => {
    // Escape special regex characters
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Create pattern for whole word matching
    return new RegExp(`\\b${escapedTerm}\\b`, 'i');
  });

  // Find all matches
  const matches = [];
  patterns.forEach((pattern, index) => {
    if (pattern.test(text)) {
      matches.push(keyTerms[index]);
    }
  });

  const notTags = [
    "nieuwe",
    "diensten",
    "vraag",
    "vragen",
    "kunnen",
    "krijgen",
    "blijft",
    "werken",
    "terug",
    "staan",
    "vanuit",
    "effici",
    "zullen",
    "minder",
    "wordt",
    "verwacht",
    "rondom",
    "leveren",

    "eigen",
    "onder",
    "steeds",
    "alleen",
    "klant",
    "markt",
    "vooral",
    "speelt",
    "aantal",
    "opzetten",
    "organisatie",
    "oplossingen",
    "lijkt",
    "andere",
    "meerdere",
    "beter",
    "kijken",
    "echte",
    "basis"
    ,
    "zowel",
    "komen",
    "hierin",
    "algemene",
    "verlagen",
    "grotere",
    "toepassingen",
    "maken",
    "creatie",
    "versnelling"
    ,
    "huidige",
    "probleem",
    "houdbaar",
    "zorgt",
    "eindigheid",
    "services",
    "dienstverlening"
    ,
    "rijkere",
    "landen",
    "aanpassen",
    "ontwikkelen",
    "situatie",
    "staat",
    "model",
    "voorop",
    "wellicht",
    "waarbij",
    "geworden",
    "welke"
    ,
    "spelen",
    "stroming",
    "realiseren",
    "moeten"
    ,
    "management",
    "opties",
    "betreft",
    "versnellen"
    , "let"
    ,
    "automatisering",
    "Een",
    "bedrijven",
    "gericht"
    ,
    "binnen",
    "zoals",
    "alles",
    "gelieerde",
    "vanwege",
    "alternatief",
    "worden",
    "leveranciers",
    "heeft",
    "nvesteerd",
    "standaard",
    "producten",
    "aanbieden",
    "passen",
    "relevant",
    "Verder",
    "alternatieven",
    "investeringen",
    "bieden",
    "aandacht",
    "hebben"
    ,
      "lastig",
      "Omdat",
      "product",
      "Dit",
      "enige",
      "manier",
      "proces",
      "voorbeeld",
      "Met",
      "belangrijke",
      "kennis",
      "moderne",
      "oplossing",
      "behouden"
      ,
        "Hier",
        "AWS zullen nog dominanter worden vanwege hun AI modellen en investeringen in gelieerde bedrijven zoals OpenAI. Omdat het toepassen van AI zo lastig is zullen we moeten kijken naar leveranciers welke een \"\"Suite Oplossing\"\" kunnen leveren waarbij de AI en automatisering \"\"embedded\"\" is in de oplossing. Dit is ook de enige manier om compliancy te behouden zonder hier zelf verantwoordelijk voor te zijn.\nBinnen Conclusion Experience is Optimizely hier een goed voorbeeld van. Met hun product Optimizely One hebben ze alles voor de marketeer binnen ��n Suite oplossing en is een moderne architectuur zoals headless en composable toch haalbaar. Dit zullen we ook moeten gaan omarmen voor toolings zoals Salesforce",
        "SAP en Dynamics. Bij Optimizely heeft Conclusion Experience een hele sterke partnership opgebouwd. Bij Microsoft doet Conclusion nu hetzelfde. Hier zal meer in ge�nvesteerd moeten worden.",
        "omarmen",
        "haalbaar",
        "business",
        "Bij Optimizely",
        "sterke",
        "Suite",
        "dominanter"
      


  ];

  // Also try to extract custom entities using simple heuristics
  // Look for capitalized words that might be product names or technologies
  // Also include lowercase words longer than 4 letters
  const customEntityRegex = /\b(([A-Z][a-zA-Z0-9]*(?:\s[A-Z][a-zA-Z0-9]*)*)|([a-z]{5,}))\b/g;

  // Words to filter out (common words that don't add value as entities)
  const wordsToFilter = [
    // Common words from English
    'I', 'A', 'The', 'This', 'That', 'We', 'They', 'It',
    // User-specified words to filter out
    'Hoe', 'Het', 'US', 'Door', 'Hierbij', 'Back', 'Stap', 'Mag', 'Wat', 'Jonge',
    'Ook', 'Optie', 'De', 'In', 'En', 'Enkele', 'Focus', 'Co', 'Conclusion', 'MBS',
    'Ruim', 'Zou', 'Wij', 'Dus', 'Rond', 'Veel', 'Low', 'Geen', 'Wel',
    // Company names to filter out

    'Conclusion Experience', 'Conclusion Accelerate', 'Conclusion'];

  const customMatches = [...text.matchAll(customEntityRegex)]
    .map(match => match[0])
    .filter(entity => {
      // Filter out common words that might be capitalized
      if (entity.length <= 1) return false;

      // Check if the entity is in the filter list
      if (wordsToFilter.includes(entity)) return false;

      // Check if the entity is in the notTags list (case insensitive)
      if (notTags.some(tag => entity.toLowerCase().includes(tag.toLowerCase()))) {
        return false;
      }

      // Check if the entity contains the company name from "Jouw bedrijf"
      if (companyToFilter && entity.includes(companyToFilter)) {
        return false;
      }

      // Check if the entity is a variation of Conclusion (which appears in many "Jouw bedrijf" values)
      if (entity.includes('Conclusion')) {
        return false;
      }

      // Avoid duplicates with the key terms
      return !matches.some(match => match.toLowerCase() === entity.toLowerCase());
    });

  // Combine and deduplicate
  return [...new Set([...matches, ...customMatches])];
}

/**
 * Normalize tags by removing duplicates with different casing
 * and filtering out tags that are too long
 * @param {string[]} tags - Array of tags to normalize
 * @return {string[]} Array of normalized tags
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];

  // Create a map to store normalized tags with their preferred case
  const normalizedTagsMap = new Map();

  // Process each tag
  tags.forEach(tag => {
    // Skip empty tags
    if (!tag) return;
    
    // Skip tags longer than 15 characters
    if (tag.length > 15) return;

    // Convert to lowercase for comparison
    const lowerTag = tag.toLowerCase();

    // If we haven't seen this tag before (case insensitive), add it with original case
    if (!normalizedTagsMap.has(lowerTag)) {
      normalizedTagsMap.set(lowerTag, tag);
    }
  });

  // Return the values from the map (the preferred case versions)
  return Array.from(normalizedTagsMap.values());
}

// Execute the conversion
try {
  convertCsvToJson(inputFile, outputFile);
} catch (error) {
  console.error('Failed to convert CSV to JSON:', error.message);
}
