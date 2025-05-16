# Single Page Application Structure Guide

This document describes the structure and architecture of the Single Page Application (SPA) used in the Observability Survey project. It serves as a guide for setting up similar applications in the future.

## Application Overview

The application is a static web-based dashboard that displays survey data through various visualizations and interactive elements. It follows a modular architecture with clear separation of concerns:

1. **Core Structure**: HTML-based with Bootstrap for styling
2. **Data Management**: Centralized data service
3. **UI Components**: Tab-based navigation with modular rendering
4. **Visualization**: Chart.js for data visualization

## Directory Structure

```
project-root/
├── index.html                 # Main HTML entry point
├── css/
│   └── styles.css             # Custom styles
├── js/
│   ├── main.js                # Application initialization
│   ├── dataService.js         # Centralized data handling
│   └── modules/               # Modular components
│       ├── chartService.js    # Chart creation utilities (optional)
│       ├── uiHelpers.js       # UI utility functions (optional)
│       └── tabs/              # Tab-specific modules
│           ├── dashboardTab.js # Dashboard tab logic
│           ├── dashboard.html  # Dashboard tab HTML template
│           ├── findTab.js      # Find tab logic
│           ├── find.html       # Find tab HTML template
│           ├── speakersTab.js  # Speakers tab logic
│           └── speakers.html   # Speakers tab HTML template
└── data/
    └── sprekerpool.json       # Application data
```

## Core Components

### 1. HTML Structure

The application uses a single HTML file (`index.html`) with a tab-based structure:

- **Header**: Application title and navigation
- **Tab Navigation**: Bootstrap tabs for different sections
- **Tab Content**: Container divs for each tab's content
- **Footer**: Copyright and additional information

Each tab follows a consistent structure with cards, charts, and interactive elements.

### 2. Data Management

Data handling is centralized in the `dataService.js` module:

- **Data Loading**: Fetches JSON data from server or local file
- **Data Storage**: Maintains data in memory for application-wide access
- **Data Processing**: Provides utility functions for data manipulation
- **Data Access**: Exports functions for components to retrieve data

```javascript
// Example from dataService.js
let surveyData = [];

export function loadSurveyData() {
    // Fetch data from source
    return fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            surveyData = data;
            return data;
        });
}

export function getSurveyData() {
    return surveyData;
}
```

### 3. Tab Navigation System

The application uses Bootstrap's tab system for navigation:

- **Tab Buttons**: HTML elements with `data-bs-toggle="tab"` and `data-bs-target` attributes
- **Tab Content**: Corresponding `<div>` elements with matching IDs
- **Event Handling**: JavaScript listeners for tab switching events

```javascript
// Tab initialization in main.js
function initializeEventListeners() {
    // Add event listeners for tab switching
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            // Actions when tab is shown
            window.dispatchEvent(new Event('resize'));
            
            // Get the active tab ID
            const activeTabId = event.target.getAttribute('data-bs-target').substring(1);
        });
    });
}
```

### 4. Modular Tab Implementation

Each tab is implemented as two separate files in the `js/modules/tabs/` directory:

1. **JavaScript Module** (e.g., `dashboardTab.js`):
   - **Import Dependencies**: Each tab imports the data service and other utilities
   - **HTML Loading**: Fetches the corresponding HTML template file
   - **Render Function**: Exports a main load function (e.g., `loadDashboardContent()`)
   - **Tab-Specific Logic**: Contains only code relevant to that specific tab
   - **Event Handlers**: Sets up tab-specific interactions

2. **HTML Template** (e.g., `dashboard.html`):
   - Contains only the HTML structure for that specific tab
   - Includes placeholders for dynamic content
   - Maintains consistent styling with the main application
   - Can be edited independently from the JavaScript logic

```javascript
// Example tab module structure (dashboardTab.js)
import { getSpeakers } from '../../dataService.js';

// Function to load the dashboard tab HTML content
async function loadDashboardContent() {
    try {
        // Fetch the HTML template for this tab
        const response = await fetch('js/modules/tabs/dashboard.html');
        const html = await response.text();
        
        // Insert the HTML into the DOM
        document.getElementById('dashboard-content').innerHTML = html;
        
        // After loading HTML, display data and initialize functionality
        displaySpeakerData();
    } catch (error) {
        console.error('Error loading dashboard content:', error);
    }
}

// Function to display data in the tab
function displaySpeakerData() {
    const speakers = getSpeakers(3); // Get data for this tab
    const textArea = document.getElementById('dashboard-data');
    if (textArea && speakers.length > 0) {
        textArea.value = JSON.stringify(speakers, null, 2);
    }
}

export { loadDashboardContent };
```

### 5. Application Initialization

The application is initialized in `main.js`:

1. **Load Data**: First, load data from the data service
2. **Load Initial Tab**: Load the content for the default active tab
3. **Initialize Events**: Set up event listeners for tab switching
4. **DOM Ready**: Ensure initialization happens after DOM is fully loaded

```javascript
// Initialization flow in main.js
import { loadSpeakerData } from './dataService.js';
import { loadDashboardContent } from './modules/tabs/dashboardTab.js';
import { loadFindContent } from './modules/tabs/findTab.js';
import { loadSpeakersContent } from './modules/tabs/speakersTab.js';

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    try {
        // Load speaker data first
        await loadSpeakerData();
        
        // Load initial tab content (dashboard is active by default)
        await loadDashboardContent();
        
        // Set up tab event listeners
        initializeTabEventListeners();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
}

function initializeTabEventListeners() {
    // Add event listeners for tab switching
    const tabs = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetTabId = event.target.getAttribute('id');
            
            // Load content based on which tab was clicked
            switch (targetTabId) {
                case 'dashboard-tab':
                    loadDashboardContent();
                    break;
                case 'find-tab':
                    loadFindContent();
                    break;
                case 'speakers-tab':
                    loadSpeakersContent();
                    break;
            }
        });
    });
}
```

## Best Practices for New Applications

When creating a new application following this structure:

1. **Start with HTML**: Create the basic HTML structure with Bootstrap tabs
2. **Set Up Data Service**: Implement the data loading and access functions
3. **Create Tab Modules**: Implement each tab as a separate module
4. **Initialize Application**: Set up the main.js to orchestrate loading and rendering

### Implementation Steps

1. **Create the HTML skeleton**:
   - Define tab navigation
   - Create tab content containers
   - Include necessary CSS and JavaScript files

2. **Implement the data service**:
   - Create data loading function
   - Set up data storage
   - Implement utility functions for data processing

### HTML Template Loading Pattern

A key feature of this architecture is the separation of HTML templates from JavaScript logic:

1. **Benefits of Separate HTML Templates**:
   - **Separation of Concerns**: HTML structure is separate from JavaScript logic
   - **Maintainability**: Easier to update UI without touching logic
   - **Reusability**: Templates can be reused across different parts of the application
   - **Parallel Development**: UI designers and JavaScript developers can work independently

2. **HTML Loading Process**:
   - Each tab's JavaScript module fetches its HTML template using the Fetch API
   - The HTML content is inserted into the appropriate container in the DOM
   - After insertion, JavaScript initializes any necessary functionality
   - This happens only when the tab is activated, improving initial load performance

3. **Create individual tab modules**:
   - One file per tab
   - Import data service
   - Export render function
   - Implement tab-specific logic

4. **Set up application initialization**:
   - Load data first
   - Render tabs after data is loaded
   - Initialize event listeners

5. **Add visualization and interactivity**:
   - Create charts and graphs
   - Implement filtering and selection
   - Add cross-tab navigation where appropriate

## Extending the Application

To add new features to the application:

1. **New Tab**: Create a new tab module and add corresponding HTML
2. **New Data Type**: Extend the data service with new processing functions
3. **New Visualization**: Add new chart types to the chart service
4. **New Interactions**: Implement additional event listeners

This modular approach ensures that the application remains maintainable and extensible as requirements evolve.
