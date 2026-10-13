// One-time extraction of existing content/assets; never edits the legacy site.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const workspace = fileURLToPath(new URL('../', import.meta.url));
const legacy = path.resolve(workspace, '..');
const context = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(legacy, 'assets/js/image_paths.js'), 'utf8'), context);
for (const locale of ['it', 'en']) {
  vm.runInContext(fs.readFileSync(path.join(legacy, `assets/lang/global-${locale}.js`), 'utf8'), context);
  const dictionary = context.window[locale === 'it' ? 'i18nIt' : 'i18nEn'];
  for (const [feature, key] of [['tours','trips'],['packages','packages']]) {
    const directory = path.join(workspace, `src/features/${feature}/data/content`);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, `${locale}.json`), JSON.stringify(dictionary[key], null, 2) + '\n');
  }
}
for (const group of ['trips', 'packages']) {
  fs.cpSync(path.join(legacy, `public/assets/images/${group}`), path.join(workspace, `src/shared/assets/catalog/${group}`), { recursive: true });
}
const fixtures = path.join(workspace, 'qa/data/fixtures');
fs.mkdirSync(fixtures, { recursive: true });
for (const name of ['Trips_Prices','Packages','Trip_Addons','Global_Settings']) {
  fs.copyFileSync(path.join(workspace, `.astro/data-inspection/${name}.csv`), path.join(fixtures, `${name}.csv`));
}
console.log('Copied legacy trip/package translations and original image files; public CSV inspection snapshots are test fixtures only.');
