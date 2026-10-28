import { readFile } from 'node:fs/promises';
import { getTrips } from '../../src/features/tours/data/trips.mjs';
import { authors } from '../../src/features/blog/data/authors.ts';
import { isPublished } from '../../src/features/blog/domain/publication.ts';
import { supportedLocales } from '../../src/shared/config/languages.ts';
import { getAutomaticLinkPhrases } from '../../src/features/blog/domain/validation.ts';

const { records, policy } = JSON.parse(await readFile(new URL('../../.astro/blog/index.json', import.meta.url), 'utf8'));
console.log(`Validated article snapshot — ${new Date(policy.evaluatedAt).toISOString()}`);
for (const lang of supportedLocales) {
  console.log(`\n${lang.toUpperCase()} — claimed automatic-link phrases`);
  for (const record of records.filter(record => record.lang === lang && isPublished(record, policy))) {
    for (const keyword of getAutomaticLinkPhrases(record)) console.log(`${JSON.stringify(keyword)} -> ${record.sourcePath}`);
  }
}
console.log('\nApproved author IDs');
for (const [id, author] of Object.entries(authors)) console.log(`${id}: ${author.name} (${author.type})`);
if (!Object.keys(authors).length) console.log('None configured. Real publication requires an approved author.');
console.log('\nPublished trip IDs (read-only catalog)');
for (const trip of await getTrips()) console.log(`${trip.id}: ${trip.text.it.title} | ${trip.text.en.title}`);
