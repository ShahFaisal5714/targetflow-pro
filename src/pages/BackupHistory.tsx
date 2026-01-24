import { useState, useMemo } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { 
  Download, 
  Trash2, 
  RotateCcw, 
  Database, 
  FileJson, 
  FileText,
  Calendar,
  HardDrive,
  RefreshCw,
  Filter,
  Search,
  X
} from 'lucide-react';
import { useBackupHistory, BackupRecord } from '@/hooks/useBackupHistory';
import { useDatabaseImport } from '@/hooks/useDatabaseImport';
import { format } from 'date-fns';
import ImportConfirmDialog from '@/components/settings/ImportConfirmDialog';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function BackupHistory() {
  const { backups, loading, deleteBackup, downloadBackup, refreshBackups } = useBackupHistory();
  const { importFromContent, importing } = useDatabaseImport();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreBackup, setRestoreBackup] = useState<BackupRecord | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter backups by company and search query
  const filteredBackups = useMemo(() => {
    return backups.filter(backup => {
      // Company filter
      if (companyFilter === 'target' && backup.company_name !== 'Target Specialties') return false;
      if (companyFilter === 'alhadaf' && backup.company_name !== 'Al Hadaf Al Kabeer') return false;
      
      // Search filter (filename or date)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesFilename = backup.filename.toLowerCase().includes(query);
        const matchesDate = format(new Date(backup.created_at), 'MMM d, yyyy HH:mm').toLowerCase().includes(query);
        const matchesDateAlt = format(new Date(backup.created_at), 'yyyy-MM-dd').toLowerCase().includes(query);
        if (!matchesFilename && !matchesDate && !matchesDateAlt) return false;
      }
      
      return true;
    });
  }, [backups, companyFilter, searchQuery]);

  const handleDeleteClick = (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedBackup) {
      await deleteBackup(selectedBackup.id);
    }
    setDeleteDialogOpen(false);
    setSelectedBackup(null);
  };

  const handleRestoreClick = (backup: BackupRecord) => {
    if (!backup.content) return;
    setRestoreBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async (clearBefore: boolean, selectedTables: string[]) => {
    if (!restoreBackup?.content) return;
    
    await importFromContent(restoreBackup.content, restoreBackup.format, clearBefore, selectedTables);
    setRestoreDialogOpen(false);
    setRestoreBackup(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Backup History</h1>
            <p className="text-muted-foreground">
              View, download, and restore from previous backups
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search filename or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[220px]"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  <SelectItem value="target">Target Specialties</SelectItem>
                  <SelectItem value="alhadaf">Al Hadaf Al Kabeer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={refreshBackups}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredBackups.length}
                {companyFilter !== 'all' && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    of {backups.length}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(filteredBackups.reduce((acc, b) => acc + b.size_bytes, 0))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredBackups.length > 0 
                  ? format(new Date(filteredBackups[0].created_at), 'MMM d, yyyy')
                  : 'Never'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup List */}
        <Card>
          <CardHeader>
            <CardTitle>All Backups</CardTitle>
            <CardDescription>
              Click on a backup to download or restore it
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBackups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {companyFilter !== 'all' ? 'No backups for this company' : 'No backups yet'}
                </p>
                <p className="text-sm">
                  {companyFilter !== 'all' 
                    ? 'Try selecting a different company filter'
                    : 'Create your first backup from the Settings page'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Filename</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Tables</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBackups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {backup.format === 'json' ? (
                            <FileJson className="h-4 w-4 text-primary" />
                          ) : (
                            <FileText className="h-4 w-4 text-secondary-foreground" />
                          )}
                          {backup.filename}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {backup.company_name || 'All Companies'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {backup.format}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={backup.backup_type === 'scheduled' ? 'default' : 'secondary'}
                        >
                          {backup.backup_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBytes(backup.size_bytes)}</TableCell>
                      <TableCell>{backup.record_count.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {backup.tables_included.length} tables
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(backup.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadBackup(backup)}
                            disabled={!backup.content}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreClick(backup)}
                            disabled={!backup.content || importing}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(backup)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBackup?.filename}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      {restoreBackup && (
        <ImportConfirmDialog
          open={restoreDialogOpen}
          onOpenChange={setRestoreDialogOpen}
          onConfirm={handleConfirmRestore}
          fileContent={restoreBackup.content || ''}
          fileName={restoreBackup.filename}
        />
      )}
    </MainLayout>
  );
}
