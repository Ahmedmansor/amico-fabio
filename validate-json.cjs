const fs = require('fs');
const path = require('path');

const jsonFiles = [
  'assets/js/data/i18n/en.json',
  'assets/js/data/i18n/it.json',
  'assets/js/data/trips-metadata.json',
  'assets/js/data/image-paths.json'
];

let allValid = true;

console.log('Validating JSON files...\n');

jsonFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✓ ${filePath} - Valid (${sizeKB} KB)`);
  } catch (error) {
    console.error(`✗ ${filePath} - Invalid: ${error.message}`);
    allValid = false;
  }
});

console.log('\n' + (allValid ? '✓ All JSON files are valid!' : '✗ Some JSON files have errors'));
process.exit(allValid ? 0 : 1);
