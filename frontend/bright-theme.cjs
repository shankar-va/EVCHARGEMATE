const fs = require('fs');
const path = require('path');

function applyBrightTheme(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            applyBrightTheme(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // --- HEX REPLACEMENTS (for index.css base mappings) ---
            content = content.replace(/#09090b/g, '#ffffff'); // bg-dark
            content = content.replace(/#18181b/g, '#f8fafc'); // bg-dark-secondary
            // Note: `#ffffff` is the old accent-primary, but wait, if bg-dark just became #ffffff, it'll mess up sequential replaces!
            // I should use temporary placeholders or parse carefully.
        }
    }
}
