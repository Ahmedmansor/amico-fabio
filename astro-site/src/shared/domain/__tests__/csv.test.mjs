import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsv } from '../csv.ts';
test('quoted commas, escaped quotes and multiline fields preserve legacy parsing', () => {
  assert.deepEqual(parseCsv('id,text\r\n1,"a,b ""quoted""\nnext"'), [{ id: '1', text: 'a,b "quoted" next' }]);
});
test('BOM and surrounding whitespace are stripped from headers and values', () => {
  assert.deepEqual(parseCsv('\uFEFFid,name\n 1 , Fabio '), [{ id: '1', name: 'Fabio' }]);
});
test('omitted trailing fields become empty strings as in legacy CSV parsing', () => {
  assert.deepEqual(parseCsv('a,b,c\n1,2'), [{ a: '1', b: '2', c: '' }]);
});
test('extra columns are rejected with source and row', () => {
  assert.throws(() => parseCsv('a,b\n1,2,3', 'Prices'), /Prices.*row 2/);
});
test('duplicate headers, empty input and unterminated quotes fail clearly', () => {
  assert.throws(() => parseCsv('a,a\n1,2'), /duplicate CSV column/);
  assert.throws(() => parseCsv(''), /Empty CSV/);
  assert.throws(() => parseCsv('a\n"unfinished'), /Unterminated/);
});
