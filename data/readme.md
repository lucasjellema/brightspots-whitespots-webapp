# Bright Spots Survey Data

## Data Structure Overview

The `brightspots-mock.json` file contains survey response data structured as an array of JSON objects. Each object represents a single survey response with the following structure:

### Metadata Fields

- `Id`: Unique identifier for the survey response
- `Start time`: When the survey was started (format: DD-MM-YYYY HH:MM)
- `Completion time`: When the survey was completed (format: DD-MM-YYYY HH:MM)
- `Email`: Email address of respondent (usually "anonymous")
- `Name`: Name field (usually empty)

### Respondent Information

- `Jouw naam`: Respondent's name
- `Rol`: Respondent's role (e.g., CTO, Solution Architect, Software Engineer)
- `Jouw bedrijf`: Respondent's company

### Customer Themes

- `newCustomerThemes`: Free text describing customer themes or priorities (semicolon-separated)
- `newCustomerThemesTags`: Array of tags categorizing the customer themes

### Technology Implementation

- `emergingTechVendorProduct`: Free text describing technologies, vendors, and products with implementation stages and timeframes (semicolon-separated)
- `emergingTechVendorProductTags`: Array of technology names extracted from the free text

### Interest Categories

The following fields contain maps of topics to interest levels (in Dutch):

- `challenges`: Business and IT challenges with interest levels
- `techConcepts`: Technical concepts with interest levels
- `productsVendors`: Products and vendors with interest levels

### Interest Levels (in Dutch)

Interest levels are expressed in Dutch with the following values:
- "Niets over gehoord" (Haven't heard about it)
- "Vage interesse" (Vague interest)
- "Redelijke interesse" (Reasonable interest)
- "Sterke, concrete interesse" (Strong, concrete interest)

## Example Entry

```json
{
  "Id": "1",
  "Start time": "02-03-2025 07:24",
  "Completion time": "02-03-2025 07:41",
  "Email": "anonymous",
  "Name": "",
  "Jouw naam": "Debra Towne",
  "Rol": "CTO",
  "Jouw bedrijf": "Frami - Beier",
  "newCustomerThemes": "prioritizing innovative digital ecosystem evolution; investing in transformative omnichannel experience design; focusing on high-priority predictive analytics platform",
  "newCustomerThemesTags": [
    "Digital Ecosystem Evolution",
    "Omnichannel Experience Design",
    "Predictive Analytics Platform"
  ],
  "emergingTechVendorProduct": "VirtualSphere across business units (short-term); CloudFunction in production environment (immediate); WebFlux Apps in production environment (ongoing)",
  "emergingTechVendorProductTags": [
    "VirtualSphere",
    "CloudFunction",
    "WebFlux Apps"
  ],
  "challenges": {
    "Digital Ecosystem Transformation": "Sterke, concrete interesse",
    "Multi-Cloud Strategy": "Sterke, concrete interesse",
    "Cyber Resilience": "Vage interesse"
  },
  "techConcepts": {
    "NeuralSync": "Vage interesse",
    "QuantumFlow": "Vage interesse",
    "CloudMesh": "Vage interesse"
  },
  "productsVendors": {
    "CloudSphere": "Vage interesse",
    "NexusStack": "Sterke, concrete interesse",
    "RelationForge": "Niets over gehoord"
  }
}
```

## Usage

This data is used to analyze and visualize technology trends, customer themes, and interest levels across different organizations. The web application processes this data to generate insights about brightspots (areas of high interest) and whitespots (areas of opportunity) in the technology landscape.
