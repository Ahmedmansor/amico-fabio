import fs from 'node:fs';
import { parseCsv } from '../../src/shared/domain/csv.ts';
export function fixtureText(name) { return fs.readFileSync(new URL(`./fixtures/${name}.csv`, import.meta.url), 'utf8'); }
export function fixtureRows(name) { return parseCsv(fixtureText(name), name); }
export function fixtureProvider() { return { reset() {}, async read(name) { return fixtureRows(name); } }; }
