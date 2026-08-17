const fs = require('fs');
const path = require('path');

function fixClientDirectives(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      fixClientDirectives(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes("'use client'") || content.includes('"use client"')) {
        // Remove existing use client
        content = content.replace(/['"]use client['"];?\r?\n?/g, '');
        // Place use client at the very top line
        content = "'use client';\n\n" + content.trimStart();
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  }
}

fixClientDirectives('./src');
console.log('Fixed use client placement.');
