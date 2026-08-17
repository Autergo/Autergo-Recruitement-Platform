const fs = require('fs');
const path = require('path');

function fixBackticks(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      fixBackticks(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes("'${API_BASE_URL}") || content.includes('"${API_BASE_URL}')) {
        console.log('Fixing template literals in', full);
        content = content.replace(/['"]\$\{API_BASE_URL\}([^'"]*)['"]/g, '`${API_BASE_URL}$1`');
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  }
}

fixBackticks('./src');
console.log('Successfully fixed all template literals to backticks.');
