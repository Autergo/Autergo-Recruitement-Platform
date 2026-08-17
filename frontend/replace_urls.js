const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      if (full.includes('config')) continue;
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('http://localhost:8000/api/v1')) {
        console.log('Replacing in', full);
        if (!content.includes('API_BASE_URL')) {
          content = "import { API_BASE_URL } from '@/config/api';\n" + content;
        }
        content = content.replace(/['"]http:\/\/localhost:8000\/api\/v1([^'"]*)['"]/g, '`${API_BASE_URL}$1`');
        content = content.replace(/`http:\/\/localhost:8000\/api\/v1([^`]*)`/g, '`${API_BASE_URL}$1`');
        fs.writeFileSync(full, content, 'utf8');
      }
    }
  }
}

walk('./src');
console.log('Finished updating endpoints.');
