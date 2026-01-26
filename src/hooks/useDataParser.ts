// Shared data parsing utilities for SQL and JSON formats

export interface ParsedTableData {
  table: string;
  records: Record<string, unknown>[];
}

export interface ParsedData {
  format: 'sql' | 'json';
  tables: ParsedTableData[];
  totalRecords: number;
}

// Tables in order of dependencies (profiles/user_roles first, then others)
export const TABLE_ORDER = [
  'profiles',
  'user_roles', 
  'companies',
  'settings',
  'products',
  'projects',
  'quotations',
  'invoices',
  'delivery_orders',
  'custom_invoice_terms',
  'backup_history'
];

// Tables that can be cleared (excluding profiles and user_roles which are managed by auth)
export const CLEARABLE_TABLES = [
  'backup_history',
  'custom_invoice_terms',
  'delivery_orders',
  'invoices',
  'quotations',
  'projects',
  'products',
  'settings',
  'companies'
];

function parseValue(value: string): unknown {
  value = value.trim();
  
  // NULL
  if (value.toUpperCase() === 'NULL') {
    return null;
  }
  
  // Boolean
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  
  // JSONB
  if (value.endsWith('::jsonb')) {
    const jsonStr = value.slice(0, -7).trim();
    // Remove surrounding quotes
    if (jsonStr.startsWith("'") && jsonStr.endsWith("'")) {
      const inner = jsonStr.slice(1, -1).replace(/''/g, "'");
      try {
        return JSON.parse(inner);
      } catch {
        return inner;
      }
    }
  }
  
  // String with quotes
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  
  // Number
  const num = parseFloat(value);
  if (!isNaN(num) && value === String(num)) {
    return num;
  }
  
  // Integer check
  const int = parseInt(value, 10);
  if (!isNaN(int) && value === String(int)) {
    return int;
  }
  
  return value;
}

function splitValues(valuesStr: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuote = false;
  let depth = 0;
  
  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    const prevChar = i > 0 ? valuesStr[i - 1] : '';
    
    if (char === "'" && prevChar !== "'") {
      inQuote = !inQuote;
    }
    
    if (!inQuote) {
      if (char === '(' || char === '{' || char === '[') depth++;
      if (char === ')' || char === '}' || char === ']') depth--;
      
      if (char === ',' && depth === 0) {
        values.push(current.trim());
        current = '';
        continue;
      }
    }
    
    current += char;
  }
  
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

function parseInsertStatement(sql: string): { table: string; values: Record<string, unknown> } | null {
  // Match: INSERT INTO public.tablename (col1, col2) VALUES (val1, val2);
  const regex = /INSERT\s+INTO\s+(?:public\.)?(\w+)\s*\(([^)]+)\)\s*VALUES\s*\((.+)\)\s*;?/is;
  const match = sql.match(regex);
  
  if (!match) return null;
  
  const table = match[1];
  const columns = match[2].split(',').map(c => c.trim());
  const valuesStr = match[3];
  
  const valuesList = splitValues(valuesStr);
  
  if (columns.length !== valuesList.length) {
    console.warn(`Column/value count mismatch for ${table}: ${columns.length} vs ${valuesList.length}`);
    return null;
  }
  
  const values: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    values[col] = parseValue(valuesList[i]);
  });
  
  return { table, values };
}

export function parseSQL(content: string): Map<string, Record<string, unknown>[]> {
  const dataByTable = new Map<string, Record<string, unknown>[]>();
  
  // Split by semicolons but be careful with strings
  const lines = content.split('\n');
  let currentStatement = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (trimmed.startsWith('--') || trimmed === '') {
      continue;
    }
    
    currentStatement += ' ' + line;
    
    // Check if statement is complete (ends with semicolon outside quotes)
    if (trimmed.endsWith(';')) {
      const stmt = currentStatement.trim();
      
      if (stmt.toUpperCase().startsWith('INSERT')) {
        const parsed = parseInsertStatement(stmt);
        if (parsed) {
          const existing = dataByTable.get(parsed.table) || [];
          existing.push(parsed.values);
          dataByTable.set(parsed.table, existing);
        }
      }
      
      currentStatement = '';
    }
  }
  
  return dataByTable;
}

export function parseJSON(content: string): Map<string, Record<string, unknown>[]> {
  const dataByTable = new Map<string, Record<string, unknown>[]>();
  
  try {
    const data = JSON.parse(content);
    
    if (data && typeof data === 'object') {
      for (const tableName of TABLE_ORDER) {
        if (data[tableName] && Array.isArray(data[tableName])) {
          dataByTable.set(tableName, data[tableName]);
        }
      }
    }
  } catch (error) {
    console.error('Failed to parse JSON:', error);
  }
  
  return dataByTable;
}

export function parseFileContent(content: string, fileName: string): ParsedData {
  const isJson = fileName.toLowerCase().endsWith('.json');
  const dataByTable = isJson ? parseJSON(content) : parseSQL(content);
  
  const tables: ParsedTableData[] = [];
  let totalRecords = 0;
  
  for (const tableName of TABLE_ORDER) {
    const records = dataByTable.get(tableName);
    if (records && records.length > 0) {
      tables.push({ table: tableName, records });
      totalRecords += records.length;
    }
  }
  
  return {
    format: isJson ? 'json' : 'sql',
    tables,
    totalRecords
  };
}
