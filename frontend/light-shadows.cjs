const fs = require('fs');
const path = require('path');

function lightenShadows(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            lightenShadows(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // Swap all rgba(255, 255, 255, 0.X) border/shadow mappings to rgba(0, 0, 0, 0.1) for bright theme borders
            content = content.replace(/rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)/g, 'rgba(0, 0, 0, $1)');
            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

lightenShadows(path.join(__dirname, 'src'));
console.log('Shadows and Borders adapted for Light theme!');
