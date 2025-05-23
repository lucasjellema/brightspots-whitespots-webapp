# Brightspots & Whitespots Dashboard

A web-based dashboard application for visualizing and exploring survey data related to business challenges, technology trends, and product vendors.

## Overview

The Brightspots & Whitespots Dashboard is a Single Page Application (SPA) designed to present insights from survey data through interactive visualizations and organized content. It helps users identify "bright spots" (successful areas) and "white spots" (opportunity areas) in the technology and business landscape.

## Features

- **Interactive Dashboard**: Tab-based navigation for exploring different aspects of the survey data
- **Data Visualization**: Charts and graphs to visualize survey results and trends
- **Responsive Design**: Built with Bootstrap for optimal viewing on any device
- **Modular Architecture**: Clean separation of concerns for easy maintenance and extensibility

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
│       ├── chartService.js    # Chart creation utilities (optional)
│       ├── uiHelpers.js       # UI utility functions (optional)
│       └── tabs/              # Tab-specific modules
│           ├── overviewTab.js # Overview tab logic
│           ├── customerThemesTab.js # Customer themes tab logic
│           ├── technologyTrendsTab.js # Technology trends tab logic
│           └── companiesTab.js # Companies tab logic
└── data/                      # Application data files
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

1. **Default Local Data**: By default, the application loads data from the local `data/brightspots.json` file
2. **External Data Source**: You can specify an external data source by adding the `parDataFile` query parameter to the URL

Example URL with external data source:
```
http://localhost:8000/index.html?parDataFile=https://example.com/path/to/data.json
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
