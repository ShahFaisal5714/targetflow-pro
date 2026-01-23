import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Database, FileJson, FileCode, Loader2 } from 'lucide-react';
import { parseFileContent, type ParsedData, type ParsedTableData } from '@/hooks/useDataParser';
import { Badge } from '@/components/ui/badge';

interface ImportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileContent: string | null;
  onConfirm: (clearExisting: boolean, selectedTables: string[]) => void;
}

function TablePreview({ 
  tableData, 
  selected, 
  onToggle 
}: { 
  tableData: ParsedTableData; 
  selected: boolean;
  onToggle: (table: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const previewCount = 3;
  const records = tableData.records;
  const showMore = records.length > previewCount;
  
  // Get column names from first record
  const columns = records.length > 0 ? Object.keys(records[0]).filter(col => 
    !['id', 'user_id', 'created_at', 'updated_at'].includes(col)
  ).slice(0, 4) : [];
  
  const displayRecords = expanded ? records : records.slice(0, previewCount);
  
  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${selected ? 'bg-card border-primary/50' : 'bg-muted/30 border-muted'}`}>
      <div 
        className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b cursor-pointer"
        onClick={() => onToggle(tableData.table)}
      >
        <div className="flex items-center gap-2">
          <Checkbox 
            checked={selected}
            onCheckedChange={() => onToggle(tableData.table)}
            onClick={(e) => e.stopPropagation()}
          />
          <Database className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={`font-mono text-sm font-medium ${!selected ? 'text-muted-foreground' : ''}`}>
            {tableData.table}
          </span>
        </div>
        <Badge variant={selected ? "secondary" : "outline"} className="text-xs">
          {records.length} {records.length === 1 ? 'record' : 'records'}
        </Badge>
      </div>
      
      {records.length > 0 && selected && (
        <div className="p-2">
          <div className="space-y-1">
            {displayRecords.map((record, idx) => {
              const displayValues = columns.map(col => {
                const val = record[col];
                if (val === null || val === undefined) return null;
                if (typeof val === 'object') return JSON.stringify(val).slice(0, 30);
                return String(val).slice(0, 30);
              }).filter(Boolean).join(' • ');
              
              return (
                <div key={idx} className="text-xs text-muted-foreground truncate px-2 py-1 bg-muted/30 rounded">
                  {displayValues || 'Record ' + (idx + 1)}
                </div>
              );
            })}
          </div>
          
          {showMore && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline mt-2 px-2"
            >
              {expanded ? 'Show less' : `Show ${records.length - previewCount} more...`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ImportConfirmDialog({
  open,
  onOpenChange,
  fileName,
  fileContent,
  onConfirm,
}: ImportConfirmDialogProps) {
  const [clearExisting, setClearExisting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [parsing, setParsing] = useState(false);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && fileContent && fileName) {
      setParsing(true);
      // Parse asynchronously to not block UI
      setTimeout(() => {
        const data = parseFileContent(fileContent, fileName);
        setParsedData(data);
        // Select all tables by default
        setSelectedTables(new Set(data.tables.map(t => t.table)));
        setParsing(false);
      }, 0);
    } else {
      setParsedData(null);
      setSelectedTables(new Set());
    }
  }, [open, fileContent, fileName]);

  const handleToggleTable = (table: string) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(table)) {
        next.delete(table);
      } else {
        next.add(table);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (parsedData) {
      setSelectedTables(new Set(parsedData.tables.map(t => t.table)));
    }
  };

  const handleSelectNone = () => {
    setSelectedTables(new Set());
  };

  const handleConfirm = () => {
    onConfirm(clearExisting, Array.from(selectedTables));
    setClearExisting(false);
    setParsedData(null);
    setSelectedTables(new Set());
  };

  const handleCancel = () => {
    onOpenChange(false);
    setClearExisting(false);
    setParsedData(null);
    setSelectedTables(new Set());
  };

  const FormatIcon = parsedData?.format === 'json' ? FileJson : FileCode;
  
  const selectedRecordCount = parsedData?.tables
    .filter(t => selectedTables.has(t.table))
    .reduce((sum, t) => sum + t.records.length, 0) || 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Confirm Database Import
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <div className="flex items-center gap-2">
              <FormatIcon className="h-4 w-4" />
              <span>
                Importing from <strong className="text-foreground">{fileName}</strong>
              </span>
              {parsedData && (
                <Badge variant="outline" className="ml-auto">
                  {parsedData.format.toUpperCase()}
                </Badge>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Data Preview */}
        <div className="flex-1 min-h-0 my-4">
          {parsing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Parsing file...</span>
            </div>
          ) : parsedData ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">Select Tables to Import</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSelectAll}
                      className="text-xs text-primary hover:underline"
                    >
                      Select all
                    </button>
                    <span className="text-muted-foreground">•</span>
                    <button 
                      onClick={handleSelectNone}
                      className="text-xs text-primary hover:underline"
                    >
                      Select none
                    </button>
                  </div>
                </div>
                <span className="text-muted-foreground">
                  {selectedRecordCount} of {parsedData.totalRecords} records selected
                </span>
              </div>
              
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-2">
                  {parsedData.tables.map((tableData) => (
                    <TablePreview 
                      key={tableData.table} 
                      tableData={tableData}
                      selected={selectedTables.has(tableData.table)}
                      onToggle={handleToggleTable}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No data found in file
            </div>
          )}
        </div>

        <div className="py-3 border-y">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="clear-existing"
              checked={clearExisting}
              onCheckedChange={(checked) => setClearExisting(checked === true)}
            />
            <div className="space-y-1">
              <Label
                htmlFor="clear-existing"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Clear existing data before import
              </Label>
              <p className="text-xs text-muted-foreground">
                This will delete all your current projects, quotations, invoices, products, 
                delivery orders, companies, and settings before importing.
              </p>
            </div>
          </div>
        </div>

        {clearExisting && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">
              <strong>Warning:</strong> All existing data will be permanently deleted. 
              Make sure you have a backup before proceeding.
            </p>
          </div>
        )}

        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!parsedData || selectedTables.size === 0}
            className={clearExisting ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {clearExisting ? 'Clear & Import' : `Import ${selectedTables.size} Tables`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
