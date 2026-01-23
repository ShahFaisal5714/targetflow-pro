import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

interface ImportResult {
  table: string;
  inserted: number;
  errors: number;
}

interface ParsedInsert {
  table: string;
  columns: string[];
  values: Record<string, unknown>;
}

// Tables in order of dependencies (profiles/user_roles first, then others)
const TABLE_ORDER = [
  'profiles',
  'user_roles', 
  'companies',
  'settings',
  'products',
  'projects',
  'quotations',
  'invoices',
  'delivery_orders'
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

function parseInsertStatement(sql: string): ParsedInsert | null {
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
  
  return { table, columns, values };
}

function parseSQL(content: string): Map<string, Record<string, unknown>[]> {
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

export function useDatabaseImport() {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const importDatabase = async (file: File): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to import data.',
        variant: 'destructive'
      });
      return false;
    }

    try {
      setImporting(true);
      setResults([]);
      
      const content = await file.text();
      const dataByTable = parseSQL(content);
      
      if (dataByTable.size === 0) {
        toast({
          title: 'No Data Found',
          description: 'No INSERT statements found in the SQL file.',
          variant: 'destructive'
        });
        return false;
      }
      
      const importResults: ImportResult[] = [];
      
      // Process tables in order
      for (const tableName of TABLE_ORDER) {
        const rows = dataByTable.get(tableName);
        if (!rows || rows.length === 0) continue;
        
        let inserted = 0;
        let errors = 0;
        
        for (const row of rows) {
          // Replace user_id with current user's ID for data ownership
          const rowData = { ...row };
          if ('user_id' in rowData) {
            rowData.user_id = user.id;
          }
          
          // Skip importing profiles and user_roles for the current user (they already exist)
          if (tableName === 'profiles' || tableName === 'user_roles') {
            // Check if record already exists
            const { data: existing } = await supabase
              .from(tableName)
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (existing) {
              // Update instead of insert
              const { id, ...updateData } = rowData;
              const { error } = await supabase
                .from(tableName)
                .update(updateData)
                .eq('user_id', user.id);
              
              if (error) {
                console.error(`Error updating ${tableName}:`, error);
                errors++;
              } else {
                inserted++;
              }
              continue;
            }
          }
          
          // Remove the id field to let database generate new ones
          const { id, ...insertData } = rowData;
          
          // Use type assertion for dynamic table insertion
          const { error } = await supabase
            .from(tableName as 'companies')
            .insert(insertData as never);
          
          if (error) {
            console.error(`Error inserting into ${tableName}:`, error);
            errors++;
          } else {
            inserted++;
          }
        }
        
        importResults.push({ table: tableName, inserted, errors });
      }
      
      setResults(importResults);
      
      const totalInserted = importResults.reduce((sum, r) => sum + r.inserted, 0);
      const totalErrors = importResults.reduce((sum, r) => sum + r.errors, 0);
      
      if (totalErrors === 0) {
        toast({
          title: 'Import Complete',
          description: `Successfully imported ${totalInserted} records.`
        });
      } else {
        toast({
          title: 'Import Completed with Errors',
          description: `Imported ${totalInserted} records, ${totalErrors} errors.`,
          variant: 'destructive'
        });
      }
      
      return totalErrors === 0;
    } catch (error) {
      logError('useDatabaseImport.importDatabase', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import database. Please check the file format.',
        variant: 'destructive'
      });
      return false;
    } finally {
      setImporting(false);
    }
  };

  return {
    importing,
    results,
    importDatabase
  };
}
