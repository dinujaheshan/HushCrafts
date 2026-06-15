const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.tsx')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = walk(path.join(__dirname, 'apps/web/src'));
const icons = new Set();

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const match = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
  if (match) {
    match[1].split(',').forEach(i => icons.add(i.trim()));
    // replace lucide-react with our custom component
    content = content.replace(/['"]lucide-react['"]/, "'@/components/MaterialIcons'");
    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log(Array.from(icons).filter(Boolean).sort().join(', '));
