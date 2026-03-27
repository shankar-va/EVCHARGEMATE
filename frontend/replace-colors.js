const fs = require('fs');
const path = require('path');

function replaceColors(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceColors(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Replace rgba(0, 240, 255 with rgba(16, 185, 129 (Emerald 500)
            content = content.replace(/0,\s*240,\s*255/g, '16, 185, 129');
            
            // Replace rgba(139, 92, 246 with rgba(52, 211, 153 (Emerald 400)
            content = content.replace(/139,\s*92,\s*246/g, '52, 211, 153');

            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

replaceColors(path.join(__dirname, 'src'));
console.log('Colors replaced!');
