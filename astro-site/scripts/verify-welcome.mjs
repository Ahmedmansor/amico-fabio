import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('dist/welcome/index.html','utf8');
for(const text of ['Sharm El Sheikh VIP | Fabio Tours','SCORRI GIÙ','FABIO TOURS','Non fare il turista,','sii un viaggiatore.','Scarica la guida esclusiva per scoprire la vera Sharm.','INVIA CATALOGO ORA','100% Gratuito. Nessun Spam.','Cosa dicono i nostri viaggiatori','4.9/5 su TripAdvisor'])assert.ok(html.includes(text),`Missing source copy: ${text}`);
assert.ok(html.includes('rel="canonical" href="https://fabioegypt.com/welcome/"'));assert.ok(!html.includes('hreflang="en"'));
assert.ok(!html.includes('cdn.tailwindcss.com')&&!html.includes('fonts.googleapis.com'));
for(const field of ['Name','WhatsApp'])assert.ok(html.includes(`name="${field}"`));
for(const [source,copy]of [['public/assets/bg.jpeg','bg.jpeg'],['public/assets/bg-mobile.jpg','bg-mobile.jpg'],['public/assets/images/ui/placeholder.webp','placeholder.webp'],['public/assets/images/home-who-fabio/home-who-fabio-preson.webp','portrait.webp']])assert.ok(fs.readFileSync('../'+source).equals(fs.readFileSync('src/features/welcome/presentation/assets/'+copy)),`Changed image ${copy}`);
const comparisons=JSON.parse(fs.readFileSync('qa/welcome/comparisons.json','utf8'));assert.equal(comparisons.length,2);
for(const {size,astro,legacy}of comparisons){assert.equal(astro.width,size==='desktop'?1440:390);assert.equal(astro.height,size==='desktop'?900:844);assert.equal(astro.width,legacy.width);assert.equal(astro.height,legacy.height);assert.deepEqual(astro.text,legacy.text);assert.deepEqual(astro.inputs,legacy.inputs);assert.deepEqual(astro.images,legacy.images);assert.equal(astro.overflow,false);}
assert.ok(fs.readFileSync('dist/sitemap.xml','utf8').includes('<loc>https://fabioegypt.com/welcome/</loc>'));
console.log('Welcome: original Italian copy, form fields, four source assets, local fonts/Tailwind, canonical/sitemap and matching desktop/mobile content verified.');
console.log('External lead submission was not sent. Apps Script acknowledgment and WhatsApp message behavior are covered by domain tests, not a live end-to-end submission.');
