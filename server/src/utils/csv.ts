export interface CustomerCsvRow {
  name: string;
  company?: string;
  phone: string;
  city?: string;
  source?: string;
  status?: string;
  last?: string;
  next?: string;
  notes?: string;
  consent?: boolean | string;
}

/**
 * Escapes a CSV field properly
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV string with UTF-8 BOM for spreadsheet compatibility
 */
export function generateCustomersCsv(customers: Array<{
  name: string;
  company: string | null;
  phone: string;
  city: string | null;
  source: string;
  status: string;
  last: Date | null;
  next: Date | null;
  notes: string | null;
  consent: boolean;
  consentDate: Date;
  createdAt: Date;
}>): string {
  const headers = [
    'Name',
    'Company',
    'Phone',
    'City',
    'Source',
    'Status',
    'Last Contact',
    'Next Follow-Up',
    'Notes',
    'Consent',
    'Consent Date',
    'Created At',
  ];

  const rows = customers.map((c) => [
    escapeCsvValue(c.name),
    escapeCsvValue(c.company || ''),
    escapeCsvValue(c.phone),
    escapeCsvValue(c.city || ''),
    escapeCsvValue(c.source),
    escapeCsvValue(c.status),
    escapeCsvValue(c.last ? c.last.toISOString().split('T')[0] : ''),
    escapeCsvValue(c.next ? c.next.toISOString().split('T')[0] : ''),
    escapeCsvValue(c.notes || ''),
    escapeCsvValue(c.consent ? 'Yes' : 'No'),
    escapeCsvValue(c.consentDate ? c.consentDate.toISOString().split('T')[0] : ''),
    escapeCsvValue(c.createdAt ? c.createdAt.toISOString() : ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  return '\uFEFF' + csvContent;
}

/**
 * Parses raw CSV string to structured customer records
 */
export function parseCustomersCsv(csvText: string): CustomerCsvRow[] {
  // Strip BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header line to find column indices
  const headerTokens = parseCsvLine(lines[0]);
  const colIndexMap: Record<string, number> = {};

  headerTokens.forEach((token, index) => {
    const lower = token.toLowerCase().trim();
    if (lower.includes('name') || lower.includes('\u0627\u0644\u0627\u0633\u0645')) colIndexMap['name'] = index;
    else if (lower.includes('company') || lower.includes('\u0627\u0644\u0634\u0631\u0643\u0629')) colIndexMap['company'] = index;
    else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('\u062C\u0648\u0627\u0644') || lower.includes('\u0647\u0627\u062A\u0641')) colIndexMap['phone'] = index;
    else if (lower.includes('city') || lower.includes('\u0627\u0644\u0645\u062F\u064A\u0646\u0629')) colIndexMap['city'] = index;
    else if (lower.includes('source') || lower.includes('\u0627\u0644\u0645\u0635\u062F\u0631')) colIndexMap['source'] = index;
    else if (lower.includes('status') || lower.includes('\u0627\u0644\u062D\u0627\u0644\u0629')) colIndexMap['status'] = index;
    else if (lower.includes('last') || lower.includes('\u0622\u062E\u0631')) colIndexMap['last'] = index;
    else if (lower.includes('next') || lower.includes('\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629')) colIndexMap['next'] = index;
    else if (lower.includes('notes') || lower.includes('\u0645\u0644\u0627\u062D\u0638\u0627\u062A')) colIndexMap['notes'] = index;
    else if (lower.includes('consent') || lower.includes('\u0645\u0648\u0627\u0641\u0642\u0629')) colIndexMap['consent'] = index;
  });

  const parsedRows: CustomerCsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const tokens = parseCsvLine(lines[i]);
    if (tokens.length === 0) continue;

    const name = colIndexMap['name'] !== undefined ? tokens[colIndexMap['name']] : tokens[0];
    const phone = colIndexMap['phone'] !== undefined ? tokens[colIndexMap['phone']] : tokens[2];

    if (!name || !phone) continue;

    parsedRows.push({
      name: name.trim(),
      company: colIndexMap['company'] !== undefined ? tokens[colIndexMap['company']]?.trim() : undefined,
      phone: phone.trim(),
      city: colIndexMap['city'] !== undefined ? tokens[colIndexMap['city']]?.trim() : undefined,
      source: colIndexMap['source'] !== undefined ? tokens[colIndexMap['source']]?.trim() : 'WhatsApp',
      status: colIndexMap['status'] !== undefined ? tokens[colIndexMap['status']]?.trim() : 'New',
      last: colIndexMap['last'] !== undefined ? tokens[colIndexMap['last']]?.trim() : undefined,
      next: colIndexMap['next'] !== undefined ? tokens[colIndexMap['next']]?.trim() : undefined,
      notes: colIndexMap['notes'] !== undefined ? tokens[colIndexMap['notes']]?.trim() : undefined,
      consent: colIndexMap['consent'] !== undefined ? tokens[colIndexMap['consent']]?.trim() : 'yes',
    });
  }

  return parsedRows;
}

/**
 * Standard CSV Line parser handling quotes and commas
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
