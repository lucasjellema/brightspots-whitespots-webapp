# Brightspots & Whitespots Dashboard

A web-based dashboard application for visualizing and exploring survey data related to business challenges, technology trends, product vendors, and technology themes.

## Overview

The Brightspots & Whitespots Dashboard is a Single Page Application (SPA) designed to present insights from survey data through interactive visualizations and organized content. It helps users identify "bright spots" (successful areas) and "white spots" (opportunity areas) in the technology and business landscape, with comprehensive theme assessment capabilities.

## Features

- **Interactive Dashboard**: Tab-based navigation for exploring different aspects of the survey data
- **Data Visualization**: Charts and graphs to visualize survey results and trends
- **Theme Assessment**: Comprehensive system for evaluating company involvement with key technology themes
- **Interest Details**: Track and manage detailed information about company interests in challenges, technologies, and vendors
- **Responsive Design**: Built with Bootstrap for optimal viewing on any device
- **Modular Architecture**: Clean separation of concerns for easy maintenance and extensibility
- **Flexible Data Loading**: Support for both local and remote data sources
- **Admin & UUID Modes**: Granular permission system for viewing and editing data

## Project Structure

```
project-root/
├── index.html                 # Main HTML entry point
├── css/
│   └── styles.css             # Custom styles
├── js/
│   ├── main.js                # Application initialization
│   ├── dataService.js         # Centralized data handling
│   └── modules/               # Modular components
│       ├── chartService.js    # Chart creation utilities
│       ├── uiHelpers.js       # UI utility functions
│       └── tabs/              # Tab-specific modules
│           ├── overviewTab.js         # Overview tab logic
│           ├── customerThemesTab.js   # Customer themes tab logic
│           ├── technologyTrendsTab.js # Technology trends tab logic
│           ├── companiesTab.js        # Companies tab logic
│           ├── templates/              # HTML templates for tabs
│           │   ├── companies.html         # Companies tab template
│           │   ├── interest-modal.html    # Interest details modal template
│           │   └── theme-assessment-modal.html # Theme assessment modal template
└── data/                      # Application data files
    ├── brightspots.json       # Main survey data
    └── main-themes.json       # Theme definitions for assessment
```

## Technologies Used

- **HTML5/CSS3**: Core web technologies
- **JavaScript (ES6+)**: Modern JavaScript features
- **Bootstrap 5**: UI framework for responsive design
- **Chart.js**: Library for data visualization
- **Fetch API**: For loading data and HTML templates

## Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for development)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/brightspots-whitespots-webapp.git
   ```

2. Navigate to the project directory:
   ```
   cd brightspots-whitespots-webapp
   ```

3. Open `index.html` in your browser or serve the files using a local web server.

### Development Server

For local development, you can use any simple HTTP server. For example, with Python:

```
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

Then open `http://localhost:8000` in your browser.

## Application Architecture

### Core Components

1. **HTML Structure**: Single HTML file with tab-based structure
2. **Data Management**: Centralized in `dataService.js`
3. **Tab Navigation**: Bootstrap tabs for different sections
4. **Modular Tab Implementation**: Each tab is implemented as a separate module

### Data Flow

1. The application loads data through the data service
2. Each tab module requests specific data from the service
3. Tab modules render the data using HTML templates and Chart.js
4. User interactions trigger updates to the displayed data

### Data Loading Options

The application supports two methods for loading data:

1. **Default Local Data**: By default, the application loads data from the local files:
   - Survey data from `data/brightspots.json`
   - Theme definitions from `data/main-themes.json`
   
2. **External Data Source**: You can specify an external data source by adding the `parDataFile` query parameter to the URL

Example URL with external data source:
```
http://localhost:8000/index.html?parDataFile=https://example.com/path/to/data.json
```

The data structure in both local and external sources should follow this format:
```json
{
  "surveyData": [ ... ],  // Array of survey records
  "themeAssessments": { ... }  // Object containing theme assessments by company
}
```

### Admin Mode

The application includes an admin mode that enables additional functionality:

1. **Data Download**: When admin mode is enabled, a download button appears in the header, allowing you to download the current dataset as a JSON file
2. **Record Management**: Admin mode supports adding new records and editing existing records in the system
   - Add interest details for companies related to challenges, technology concepts, and products/vendors
   - Edit and update existing records with new information
   - All changes can be saved and downloaded as part of the dataset
3. **Theme Assessment**: Admin mode enables comprehensive theme assessment capabilities
   - Assess company involvement with technology themes using a four-level scale:
     * Fully claimed (green)
     * Somewhat associated (blue)
     * It's our ambition (yellow)
     * Not for us (red)
   - Add detailed descriptions for each theme assessment
   - View theme assessments in a collapsible panel with color-coded indicators
   - Theme assessments are included in the downloaded dataset

To enable admin mode, add the `adminMode=yes` query parameter to the URL:
```
http://localhost:8000/index.html?adminMode=yes
```

### Record-Specific Editing with UUID

The application provides a specialized mode for accessing and editing records for a specific company using a record's unique identifier:

1. **Direct Company Access**: When the `uuid` parameter is provided, the application automatically navigates to the Companies tab and selects the company associated with that record ID
2. **Targeted Editing Permissions**: For the selected company only, users can:
   - Add and edit interest details (challenges, technology concepts, products/vendors) 
   - Perform theme assessments using the same interface available in admin mode
   - Save changes that will be included in the downloaded dataset
3. **Preserved Security**: Other companies remain in read-only mode unless admin mode is active
4. **Theme Assessment Display**: Theme assessments are visible to all users, but can only be edited in admin mode or UUID mode

To access a specific company in edit mode, add the `uuid` query parameter with a record ID value:
```
http://localhost:8000/index.html?uuid=46
```

### Combining Query Parameters

You can combine multiple query parameters as needed:
```
http://localhost:8000/index.html?parDataFile=https://example.com/path/to/data.json&adminMode=yes
```

Or:
```
http://localhost:8000/index.html?parDataFile=https://example.com/path/to/data.json&uuid=46
```

## Extending the Application

### Adding a New Tab

1. Add a new tab button in `index.html`
2. Create a new tab content container in `index.html`
3. Create a new tab module in `js/modules/tabs/`
4. Import and initialize the new tab in `main.js`

### Adding New Data

1. Update the data service to handle the new data
2. Create new processing functions in the data service
3. Update the relevant tab modules to display the new data

## License

[Your License Here]

## Acknowledgments

- Survey participants who provided the data
- Bootstrap and Chart.js for their excellent libraries
