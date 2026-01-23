import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';
import { parseSQL, parseJSON, TABLE_ORDER, CLEARABLE_TABLES } from './useDataParser';

export interface ImportResult {
  table: string;
  inserted: number;
  errors: number;
}

export function useDatabaseImport() {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);

  const clearExistingData = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Delete in reverse order of dependencies
      for (const tableName of CLEARABLE_TABLES) {
        const { error } = await supabase
          .from(tableName as 'companies')
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error(`Error clearing ${tableName}:`, error);
        }
      }
      return true;
    } catch (error) {
      logError('useDatabaseImport.clearExistingData', error);
      return false;
    }
  };

  const importDatabase = async (
    file: File, 
    clearBefore: boolean = false,
    selectedTables?: string[]
  ): Promise<boolean> => {
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
      const isJson = file.name.toLowerCase().endsWith('.json');
      const dataByTable = isJson ? parseJSON(content) : parseSQL(content);
      
      if (dataByTable.size === 0) {
        toast({
          title: 'No Data Found',
          description: `No valid data found in the ${isJson ? 'JSON' : 'SQL'} file.`,
          variant: 'destructive'
        });
        return false;
      }

      // Clear existing data if requested
      if (clearBefore) {
        const cleared = await clearExistingData();
        if (!cleared) {
          toast({
            title: 'Clear Failed',
            description: 'Failed to clear existing data. Import cancelled.',
            variant: 'destructive'
          });
          return false;
        }
      }
      
      const importResults: ImportResult[] = [];
      
      // Filter to selected tables if provided
      const tablesToImport = selectedTables 
        ? TABLE_ORDER.filter(t => selectedTables.includes(t))
        : TABLE_ORDER;
      
      // Process tables in order
      for (const tableName of tablesToImport) {
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
