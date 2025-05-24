// About Tab Module

/**
 * Load the about tab content
 */
export async function loadAboutContent() {
    try {
        // Get the container element
        const container = document.getElementById('about-content');
        
        // Fetch the HTML template
        const response = await fetch('js/modules/tabs/templates/about.html');
        if (!response.ok) {
            throw new Error(`Failed to load template: ${response.status}`);
        }
        
        // Load the HTML template into the container
        const templateHtml = await response.text();
        container.innerHTML = templateHtml;
        
    } catch (error) {
        console.error('Error loading about content:', error);
    }
}
