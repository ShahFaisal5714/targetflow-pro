import { useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';

interface ImportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  onConfirm: (clearExisting: boolean) => void;
}

export default function ImportConfirmDialog({
  open,
  onOpenChange,
  fileName,
  onConfirm,
}: ImportConfirmDialogProps) {
  const [clearExisting, setClearExisting] = useState(false);

  const handleConfirm = () => {
    onConfirm(clearExisting);
    setClearExisting(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setClearExisting(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Confirm Database Import
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              You are about to import data from <strong className="text-foreground">{fileName}</strong>.
            </p>
            <p>
              This will add new records to your database. If the import file contains records 
              that already exist, you may see duplicate entries or errors.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 border-y my-2">
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
                delivery orders, companies, and settings before importing. This action cannot be undone.
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

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={clearExisting ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {clearExisting ? 'Clear & Import' : 'Import Data'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
