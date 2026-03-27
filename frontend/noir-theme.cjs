const fs = require('fs');
const path = require('path');

function applyNoirTheme(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            applyNoirTheme(fullPath);
        } else if (fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');

            // --- HEX REPLACEMENTS (for index.css) ---
            content = content.replace(/#022c22/g, '#09090b'); // bg-dark
            content = content.replace(/#064e3b/g, '#18181b'); // bg-dark-secondary
            content = content.replace(/#ecfdf5/g, '#fafafa'); // text-primary
            content = content.replace(/#a7f3d0/g, '#a1a1aa'); // text-secondary
            content = content.replace(/#10b981/g, '#ffffff'); // accent-primary (white)
            content = content.replace(/#34d399/g, '#e4e4e7'); // accent-secondary (zinc-200)
            content = content.replace(/#059669/g, '#71717a'); // accent-tertiary (zinc-500)
            
            // --- RGBA REPLACEMENTS (across all files) ---
            // Previous primary accent: 16, 185, 129 -> White: 255, 255, 255
            content = content.replace(/16,\s*185,\s*129/g, '255, 255, 255');
            // Previous secondary accent: 52, 211, 153 -> Zinc-200: 228, 228, 231
            content = content.replace(/52,\s*211,\s*153/g, '228, 228, 231');
            
            // Previous bg-dark map: 2, 44, 34 -> Zinc-950: 9, 9, 11
            content = content.replace(/2,\s*44,\s*34/g, '9, 9, 11');
            // Previous bg-dark-secondary map: 6, 78, 59 -> Zinc-900: 24, 24, 27
            content = content.replace(/6,\s*78,\s*59/g, '24, 24, 27');

            fs.writeFileSync(fullPath, content, 'utf8');
        }
    }
}

applyNoirTheme(path.join(__dirname, 'src'));
console.log('Noir Premium Theme applied globally!');
