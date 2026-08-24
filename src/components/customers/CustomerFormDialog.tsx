import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Customer, CustomerInput } from '@/hooks/useCustomers';

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (input: CustomerInput) => void | Promise<void>;
}

const emptyForm: CustomerInput = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  trn: '',
  notes: '',
  payment_terms: '',
  credit_limit: 0,
};

export default function CustomerFormDialog({ open, onOpenChange, customer, onSubmit }: CustomerFormDialogProps) {
  const [form, setForm] = useState<CustomerInput>(emptyForm);

  useEffect(() => {
    if (!open) return;
    if (customer) {
      setForm({
        name: customer.name,
        contact_person: customer.contact_person || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        trn: customer.trn || '',
        notes: customer.notes || '',
        payment_terms: customer.payment_terms || '',
        credit_limit: customer.credit_limit || 0,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, customer]);

  const set = (key: keyof CustomerInput, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ ...form, name: (form.name || '').trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? 'Edit Customer' : 'New Customer'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cust-name">Customer / Company Name *</Label>
              <Input
                id="cust-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Al Futtaim Contracting LLC"
                className="min-h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-contact">Contact Person</Label>
              <Input
                id="cust-contact"
                value={form.contact_person || ''}
                onChange={(e) => set('contact_person', e.target.value)}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                type="tel"
                inputMode="tel"
                value={form.phone || ''}
                onChange={(e) => set('phone', e.target.value)}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                inputMode="email"
                value={form.email || ''}
                onChange={(e) => set('email', e.target.value)}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-trn">TRN</Label>
              <Input
                id="cust-trn"
                inputMode="numeric"
                value={form.trn || ''}
                onChange={(e) => set('trn', e.target.value)}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-terms">Payment Terms</Label>
              <Input
                id="cust-terms"
                value={form.payment_terms || ''}
                onChange={(e) => set('payment_terms', e.target.value)}
                placeholder="e.g. 30 days from invoice date"
                className="min-h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust-credit">Credit Limit (AED)</Label>
              <Input
                id="cust-credit"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={form.credit_limit ?? 0}
                onChange={(e) => set('credit_limit', Number(e.target.value))}
                className="min-h-11"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cust-address">Address</Label>
              <Textarea
                id="cust-address"
                value={form.address || ''}
                onChange={(e) => set('address', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cust-notes">Notes</Label>
              <Textarea
                id="cust-notes"
                value={form.notes || ''}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
                placeholder="Internal notes about this customer"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-h-11">
              {customer ? 'Update' : 'Save'} Customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
