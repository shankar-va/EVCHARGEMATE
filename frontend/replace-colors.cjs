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
            
            // bg-dark map: 15, 23, 42 -> 2, 44, 34
            content = content.replace(/15,\s*23,\s*42/g, '2, 44, 34');
            
            // bg-dark-secondary map: 30, 41, 59 -> 6, 78, 59
            content = content.replace(/30,\s*41,\s*59/g, '6, 78, 59');

            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

replaceColors(path.join(__dirname, 'src'));
console.log('Background Colors replaced!');
