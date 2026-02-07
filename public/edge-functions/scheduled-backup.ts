import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tables to export in dependency order
const TABLE_ORDER = [
  'companies',
  'profiles',
  'products',
  'projects',
  'quotations',
  'invoices',
  'delivery_orders',
  'custom_invoice_terms',
  'backup_history',
  'settings'
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with scheduled backups enabled
    const { data: scheduleSettings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', 'backup_schedule');

    if (settingsError) {
      console.error('Error fetching backup schedules:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch backup schedules' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const now = new Date();
    let backupsCreated = 0;

    for (const setting of scheduleSettings || []) {
      const schedule = setting.value as {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly';
        retentionDays: number;
        lastBackup: string | null;
        nextBackup: string | null;
        format: 'sql' | 'json';
      };

      if (!schedule.enabled || !schedule.nextBackup) continue;

      const nextBackupTime = new Date(schedule.nextBackup);
      
      // Check if backup is due
      if (now >= nextBackupTime) {
        const userId = setting.user_id;
        
        // Export data for this user
        const exportData: Record<string, unknown[]> = {};
        let totalRecords = 0;

        for (const tableName of TABLE_ORDER) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq('user_id', userId);

            if (!error && data && data.length > 0) {
              exportData[tableName] = data;
              totalRecords += data.length;
            }
          } catch (e) {
            console.log(`Skipping table ${tableName}:`, e);
          }
        }

        // Generate backup content
        const content = schedule.format === 'json' 
          ? JSON.stringify(exportData, null, 2)
          : generateSQL(exportData);

        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `scheduled-backup-${timestamp}.${schedule.format}`;

        // Save backup to history
        const { error: backupError } = await supabase
          .from('backup_history')
          .insert({
            user_id: userId,
            filename,
            format: schedule.format,
            size_bytes: new Blob([content]).size,
            tables_included: Object.keys(exportData),
            record_count: totalRecords,
            backup_type: 'scheduled',
            status: 'completed',
            content,
            company_id: null,
            company_name: 'All Companies',
          });

        if (backupError) {
          console.error('Error saving backup:', backupError);
          continue;
        }

        // Calculate next backup time
        const nextBackup = calculateNextBackup(schedule.frequency);

        // Update schedule with new times
        await supabase
          .from('settings')
          .update({
            value: {
              ...schedule,
              lastBackup: now.toISOString(),
              nextBackup,
            },
            updated_at: now.toISOString(),
          })
          .eq('id', setting.id);

        // Clean up old backups based on retention
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - schedule.retentionDays);
        await supabase
          .from('backup_history')
          .delete()
          .eq('user_id', userId)
          .eq('backup_type', 'scheduled')
          .lt('created_at', cutoffDate.toISOString());

        backupsCreated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true, 
        backupsCreated,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scheduled backup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateNextBackup(frequency: 'daily' | 'weekly' | 'monthly'): string {
  const now = new Date();
  const next = new Date(now);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(2, 0, 0, 0);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 - next.getDay()));
      next.setHours(2, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1, 1);
      next.setHours(2, 0, 0, 0);
      break;
  }
  
  return next.toISOString();
}

function generateSQL(data: Record<string, unknown[]>): string {
  let sql = `-- Scheduled Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
  
  for (const [table, rows] of Object.entries(data)) {
    if (rows.length === 0) continue;
    
    for (const row of rows) {
      const columns = Object.keys(row as object);
      const values = columns.map(col => {
        const val = (row as Record<string, unknown>)[col];
        if (val === null) return 'NULL';
        if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
        if (typeof val === 'number') return val.toString();
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return `'${String(val).replace(/'/g, "''")}'`;
      });
      
      sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
    }
    sql += '\n';
  }
  
  return sql;
}
