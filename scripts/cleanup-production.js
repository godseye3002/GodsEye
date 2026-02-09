// Production cleanup script for SOV progress code
// Run this before deploying to production

const fs = require('fs');
const path = require('path');

// Files to clean up
const filesToClean = [
  'examples/SovProgressExample.tsx',
  'examples/SovProgressTest.tsx', 
  'components/SovProgressDebug.tsx'
];

// Console logs to remove
const consoleLogPatterns = [
  /console\.log.*\[SOV Progress\]/g,
  /console\.log.*\[SOV Listener\]/g,
  /console\.log.*\[SovProgressIndicator\]/g,
  /console\.log.*🔍|📊|🎯|🚀|⏳|✅|❌/g
];

console.log('🧹 Cleaning up SOV code for production...');

filesToClean.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console logs
    consoleLogPatterns.forEach(pattern => {
      content = content.replace(pattern, '// [REMOVED FOR PRODUCTION]');
    });
    
    // Add production notice at top
    if (file.includes('SovProgressExample') || file.includes('SovProgressTest')) {
      content = `// DEVELOPMENT EXAMPLE - Remove in production\n` + content;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned: ${file}`);
  }
});

console.log('✨ Production cleanup complete!');
