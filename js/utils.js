/**
 * Utility functions for the Brightspots & Whitespots Dashboard
 */

/**
 * Format respondent data for tooltips
 * Shows every respondent who has a role with name and role
 * Groups other respondents by company and shows only the company name
 * 
 * @param {Array} respondents - Array of respondent objects with name, role, and company properties
 * @returns {string} Formatted string for tooltip display
 */
export function formatRespondentsForTooltip(respondents) {
    if (!respondents || respondents.length === 0) {
        return 'No respondent data available';
    }
    
    // Separate respondents into two groups: those with roles and those without
    const respWithRoles = [];
    const companyGroups = {};
    
    // Process all respondents
    respondents.forEach(resp => {
        if (resp.role && resp.role.trim() !== '') {
            // Add respondents with roles to their own list
            respWithRoles.push(resp);
        } else {
            // Group others by company
            const company = resp.company.trim();
            if (company) { // Skip empty company names
                if (!companyGroups[company]) {
                    companyGroups[company] = [];
                }
                companyGroups[company].push(resp);
            }
        }
    });
    
    // Create lines for the tooltip
    const lines = [];
    
    // First add all respondents with roles
    respWithRoles.forEach(resp => {
        if (resp.name && resp.name.trim() !== '') {
            lines.push(`${resp.name} (${resp.role})`);
        } else {
            lines.push(`Anonymous (${resp.role})`);
        }
    });
    
    // Then add one entry per company for those without roles
    Object.keys(companyGroups).forEach(company => {
        lines.push(company);
    });
    
    // Limit to 15 entries to avoid tooltip overflow
    if (lines.length > 15) {
        return lines.slice(0, 15).join('\n') + `\n...and ${lines.length - 15} more`;
    }
    
    return lines.join('\n');
}
