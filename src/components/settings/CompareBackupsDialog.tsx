import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitCompare, 
  Plus, 
  Minus, 
  Equal, 
  Database,
  FileJson,
  FileText,
  AlertCircle
} from 'lucide-react';
import { BackupRecord } from '@/hooks/useBackupHistory';
import { parseFileContent, ParsedTableData } from '@/hooks/useDataParser';
import { format } from 'date-fns';

interface CompareBackupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backups: BackupRecord[];
}

interface TableDiff {
  table: string;
  leftCount: number;
  rightCount: number;
  difference: number;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
}

function getRecordKey(record: Record<string, unknown>): string {
  // Use id if available, otherwise stringify all values
  if (record.id) return String(record.id);
  return JSON.stringify(record);
}

function compareBackupContents(
  leftContent: string | null, 
  leftFilename: string,
  rightContent: string | null,
  rightFilename: string
): TableDiff[] {
  if (!leftContent || !rightContent) return [];
  
  const leftData = parseFileContent(leftContent, leftFilename);
  const rightData = parseFileContent(rightContent, rightFilename);
  
  const allTables = new Set<string>();
  leftData.tables.forEach(t => allTables.add(t.table));
  rightData.tables.forEach(t => allTables.add(t.table));
  
  const diffs: TableDiff[] = [];
  
  allTables.forEach(table => {
    const leftTable = leftData.tables.find(t => t.table === table);
    const rightTable = rightData.tables.find(t => t.table === table);
    
    const leftCount = leftTable?.records.length || 0;
    const rightCount = rightTable?.records.length || 0;
    const difference = rightCount - leftCount;
    
    let status: TableDiff['status'] = 'unchanged';
    if (leftCount === 0 && rightCount > 0) {
      status = 'added';
    } else if (leftCount > 0 && rightCount === 0) {
      status = 'removed';
    } else if (difference !== 0) {
      status = 'changed';
    }
    
    diffs.push({ table, leftCount, rightCount, difference, status });
  });
  
  return diffs.sort((a, b) => {
    const order = { added: 0, removed: 1, changed: 2, unchanged: 3 };
    return order[a.status] - order[b.status];
  });
}

export default function CompareBackupsDialog({
  open,
  onOpenChange,
  backups,
}: CompareBackupsDialogProps) {
  const [leftBackupId, setLeftBackupId] = useState<string>('');
  const [rightBackupId, setRightBackupId] = useState<string>('');
  
  const leftBackup = backups.find(b => b.id === leftBackupId);
  const rightBackup = backups.find(b => b.id === rightBackupId);
  
  const comparison = useMemo(() => {
    if (!leftBackup?.content || !rightBackup?.content) return [];
    return compareBackupContents(
      leftBackup.content, 
      leftBackup.filename,
      rightBackup.content,
      rightBackup.filename
    );
  }, [leftBackup, rightBackup]);
  
  const summary = useMemo(() => {
    const added = comparison.filter(d => d.status === 'added').length;
    const removed = comparison.filter(d => d.status === 'removed').length;
    const changed = comparison.filter(d => d.status === 'changed').length;
    const unchanged = comparison.filter(d => d.status === 'unchanged').length;
    const totalDiff = comparison.reduce((sum, d) => sum + d.difference, 0);
    return { added, removed, changed, unchanged, totalDiff };
  }, [comparison]);

  const getStatusIcon = (status: TableDiff['status']) => {
    switch (status) {
      case 'added': return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed': return <Minus className="h-4 w-4 text-destructive" />;
      case 'changed': return <GitCompare className="h-4 w-4 text-warning" />;
      case 'unchanged': return <Equal className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TableDiff['status']) => {
    switch (status) {
      case 'added': return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">New</Badge>;
      case 'removed': return <Badge variant="destructive">Removed</Badge>;
      case 'changed': return <Badge className="bg-warning/10 text-warning border-warning/20">Changed</Badge>;
      case 'unchanged': return <Badge variant="outline">Unchanged</Badge>;
    }
  };

  const FormatIcon = ({ format }: { format: string }) => 
    format === 'json' ? <FileJson className="h-4 w-4" /> : <FileText className="h-4 w-4" />;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Backups
          </DialogTitle>
          <DialogDescription>
            Select two backups to compare their contents and see what changed between them.
          </DialogDescription>
        </DialogHeader>

        {/* Backup Selectors */}
        <div className="grid grid-cols-2 gap-4 flex-shrink-0">
          <div className="space-y-2">
            <label className="text-sm font-medium">Older Backup (Base)</label>
            <Select value={leftBackupId} onValueChange={setLeftBackupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select backup..." />
              </SelectTrigger>
              <SelectContent>
                {backups.filter(b => b.content && b.id !== rightBackupId).map(backup => (
                  <SelectItem key={backup.id} value={backup.id}>
                    <div className="flex items-center gap-2">
                      <FormatIcon format={backup.format} />
                      <span className="truncate max-w-[180px]">{backup.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(backup.created_at), 'MMM d')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Newer Backup (Compare)</label>
            <Select value={rightBackupId} onValueChange={setRightBackupId}>
              <SelectTrigger>
                <SelectValue placeholder="Select backup..." />
              </SelectTrigger>
              <SelectContent>
                {backups.filter(b => b.content && b.id !== leftBackupId).map(backup => (
                  <SelectItem key={backup.id} value={backup.id}>
                    <div className="flex items-center gap-2">
                      <FormatIcon format={backup.format} />
                      <span className="truncate max-w-[180px]">{backup.filename}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(backup.created_at), 'MMM d')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Comparison Results */}
        <div className="flex-1 min-h-0 overflow-hidden mt-4">
          {!leftBackupId || !rightBackupId ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select two backups to compare</p>
              <p className="text-sm">Choose an older and newer backup from the dropdowns above</p>
            </div>
          ) : comparison.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Database className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No data found to compare</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">{summary.added} New Tables</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{summary.removed} Removed</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2">
                    <GitCompare className="h-4 w-4 text-warning" />
                    <span className="text-sm font-medium text-warning">{summary.changed} Changed</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <Equal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{summary.unchanged} Unchanged</span>
                  </div>
                </div>
              </div>
              
              {/* Net change */}
              <div className="mb-4 p-3 rounded-lg border bg-card flex-shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Net Record Change</span>
                  <span className={`text-lg font-bold ${summary.totalDiff > 0 ? 'text-green-500' : summary.totalDiff < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {summary.totalDiff > 0 ? '+' : ''}{summary.totalDiff} records
                  </span>
                </div>
              </div>

              {/* Table Comparison */}
              <ScrollArea className="flex-1 min-h-0 pr-4">
                <div className="space-y-2">
                  {comparison.map((diff) => (
                    <div 
                      key={diff.table} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(diff.status)}
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium">{diff.table}</span>
                        </div>
                        {getStatusBadge(diff.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {diff.leftCount} → {diff.rightCount}
                        </span>
                        {diff.difference !== 0 && (
                          <Badge 
                            variant="outline"
                            className={diff.difference > 0 ? 'text-green-500 border-green-500/30' : 'text-destructive border-destructive/30'}
                          >
                            {diff.difference > 0 ? '+' : ''}{diff.difference}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
