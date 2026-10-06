const fs = require('fs');
const path = require('path');

const filesToProcess = [
  path.join(__dirname, 'app/page.tsx'),
  path.join(__dirname, 'app/admin/page.tsx'),
  path.join(__dirname, 'app/admin/inventory/page.tsx')
];

const colorMap = {
  'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900': 'bg-transparent',
  'bg-gradient-to-br from-slate-900 to-purple-950': 'bg-black/40 backdrop-blur-3xl',
  'bg-slate-900': 'bg-black/20',
  'bg-slate-800': 'bg-black/30',
  'blue-600': 'brand-green',
  'purple-600': 'brand-green-dark',
  'pink-600': 'brand-green',
  'blue-500': 'brand-green',
  'purple-500': 'brand-green-dark',
  'pink-500': 'brand-green-light',
  'blue-400': 'brand-green',
  'purple-400': 'brand-green-dark',
  'pink-400': 'brand-green-light',
  'blue-300': 'brand-green-light',
  'purple-300': 'brand-green-light',
  'pink-300': 'white',
  'blue-200': 'white',
  'purple-200': 'brand-green-light',
  'pink-200': 'white',
  'indigo-600': 'brand-green-dark',
  'indigo-400': 'brand-green-light',
  'indigo-500': 'brand-green',
  'amber-500': 'brand-green-light',
  'amber-400': 'brand-green-light',
  'emerald-600': 'brand-green-dark',
  'emerald-500': 'brand-green',
  'emerald-400': 'brand-green-light',
  'cyan-500': 'brand-green',
  'cyan-400': 'brand-green-light'
};

filesToProcess.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Iterate over the color map and replace
    for (const [oldColor, newColor] of Object.entries(colorMap)) {
      const regex = new RegExp(oldColor, 'g');
      content = content.replace(regex, newColor);
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Processed ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
