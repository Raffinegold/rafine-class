import type { CsvRow } from './store';

export interface ParsedCsvRow extends CsvRow {
  line: number;
  errors: string[];
}

export interface ParsedCsv {
  rows: ParsedCsvRow[];
  header: string[];
  missingHeader: string[];
  okCount: number;
}

const EXPECTED = ['word', 'meaning', 'pos', 'example', 'example_ko', 'order_no'];

/** 아주 작은 CSV 파서 (따옴표·줄바꿈·BOM 처리) */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch === '\r') {
      // skip
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function parseWordCsv(text: string): ParsedCsv {
  const table = parseCsv(text);
  if (!table.length) return { rows: [], header: [], missingHeader: EXPECTED, okCount: 0 };
  const header = table[0].map((h) => h.trim().toLowerCase());
  const missingHeader = EXPECTED.filter((h) => !header.includes(h));
  const idx = (name: string) => header.indexOf(name);

  const raw = table.slice(1).map((cells, i) => {
    const get = (name: string) => (idx(name) >= 0 ? (cells[idx(name)] ?? '').trim() : '');
    return {
      line: i + 2,
      word: get('word'),
      meaning: get('meaning'),
      pos: get('pos'),
      example: get('example'),
      example_ko: get('example_ko'),
      order_no: Number(get('order_no')) || i + 1,
    };
  });

  const seen = new Map<string, number>();
  const rows: ParsedCsvRow[] = raw.map((r) => {
    const errors: string[] = [];
    if (!r.word) errors.push('영단어가 비었어요');
    else if (!/^[a-zA-Z][a-zA-Z\s'’-]*$/.test(r.word)) errors.push('영단어에 알파벳이 아닌 글자가 있어요');
    if (!r.meaning) errors.push('뜻이 비었어요');
    if (r.word) {
      const key = r.word.toLowerCase();
      if (seen.has(key)) errors.push(`같은 파일 ${seen.get(key)}행과 중복`);
      else seen.set(key, r.line);
    }
    return { ...r, errors };
  });

  return {
    rows,
    header,
    missingHeader,
    okCount: rows.filter((r) => r.errors.length === 0).length,
  };
}
