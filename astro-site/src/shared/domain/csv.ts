export type CsvRow = Record<string, string>;

export function parseCsv(text: string, source = 'CSV'): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(cell => cell.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error(`[${source}] Unterminated quoted CSV field.`);
  row.push(field);
  if (row.some(cell => cell.trim())) rows.push(row);
  if (!rows.length) throw new Error(`[${source}] Empty CSV response.`);
  const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim());
  if (headers.some(header => !header) || new Set(headers).size !== headers.length) throw new Error(`[${source}] Empty or duplicate CSV column name.`);
  return rows.slice(1).map((cells, index) => {
    if (cells.length > headers.length) throw new Error(`[${source}] CSV row ${index + 2}: expected at most ${headers.length} fields, received ${cells.length}.`);
    // Google Sheets can omit trailing empty cells. Legacy parsing pads those with empty strings.
    return Object.fromEntries(headers.map((header, column) => [header, (cells[column] ?? '').replace(/\r?\n/g, ' ').trim()]));
  });
}
