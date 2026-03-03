const fs = require('fs');
const path = require('path');

// Create a mock window object for ImagePaths references
global.window = {
  ImagePaths: {
    secrets: {
      fabio: 'assets/images/10-comandamenti-images/fabio.webp',
      cars: 'assets/images/10-comandamenti-images/modern-sanitized-private-cars.webp',
      drivers: 'assets/images/10-comandamenti-images/autisti-professionisti.webp',
      boats: 'assets/images/10-comandamenti-images/imbarcazioni-vip.webp',
      coins: 'assets/images/10-comandamenti-images/euro-coins-no.webp',
      sim: 'assets/images/10-comandamenti-images/sim-card-solo-negozi-ufficiali.webp',
      taxi: 'assets/images/10-comandamenti-images/taxi-prezzo-concordato.webp',
      antinal: 'assets/images/10-comandamenti-images/antinal.webp',
      dress: 'assets/images/10-comandamenti-images/dress-code.webp',
      negotiate: 'assets/images/10-comandamenti-images/negoziare.webp',
      corals: 'assets/images/10-comandamenti-images/coralli.webp',
      baksheesh: 'assets/images/10-comandamenti-images/baksheesh.webp',
      water: 'assets/images/10-comandamenti-images/water.webp',
      relax: 'assets/images/10-comandamenti-images/relax.webp',
      farsha: 'assets/images/10-comandamenti-images/farsha-café.webp'
    },
    adventures: {
      pilot: 'assets/images/adventures/pilot.webp',
      eiffel: 'assets/images/adventures/eiffel-tower.webp',
      redSquare: 'assets/images/adventures/red-square.webp',
      diving: 'assets/images/adventures/diving.webp',
      desert: 'assets/images/adventures/dessert.webp',
      urbano: 'assets/images/adventures/urbano.webp',
      ogni: 'assets/images/adventures/ogni.webp',
      advanced: 'assets/images/adventures/advanced-open-water.webp'
    }
  }
};

// Extract English i18n
try {
  const enContent = fs.readFileSync('assets/lang/global-en.js', 'utf8');
  
  // Remove the window assignment and extract the object
  const enMatch = enContent.match(/window\.i18nEn\s*=\s*(\{[\s\S]*\});?\s*$/m);
  
  if (enMatch) {
    // Use eval in a safe context to parse the JavaScript object
    const i18nEn = eval('(' + enMatch[1] + ')');
    
    // Write to JSON file
    fs.writeFileSync(
      'assets/js/data/i18n/en.json',
      JSON.stringify(i18nEn, null, 2),
      'utf8'
    );
    console.log('✓ English i18n extracted to assets/js/data/i18n/en.json');
  } else {
    console.error('✗ Failed to extract English i18n');
  }
} catch (error) {
  console.error('Error extracting English i18n:', error.message);
}

// Extract Italian i18n
try {
  const itContent = fs.readFileSync('assets/lang/global-it.js', 'utf8');
  
  // Remove the window assignment and extract the object
  const itMatch = itContent.match(/window\.i18nIt\s*=\s*(\{[\s\S]*\});?\s*$/m);
  
  if (itMatch) {
    // Use eval in a safe context to parse the JavaScript object
    const i18nIt = eval('(' + itMatch[1] + ')');
    
    // Write to JSON file
    fs.writeFileSync(
      'assets/js/data/i18n/it.json',
      JSON.stringify(i18nIt, null, 2),
      'utf8'
    );
    console.log('✓ Italian i18n extracted to assets/js/data/i18n/it.json');
  } else {
    console.error('✗ Failed to extract Italian i18n');
  }
} catch (error) {
  console.error('Error extracting Italian i18n:', error.message);
}

console.log('\nExtraction complete!');
