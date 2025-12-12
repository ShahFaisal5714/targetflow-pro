import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';
import { Quotation, QuotationItem, ProductCategory, ProductUnit } from '@/types/crm';
import { mockProjects, mockProducts } from '@/data/mockData';

interface QuotationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: Quotation;
  onSubmit?: (quotation: Partial<Quotation>) => void;
  initialProjectId?: string;
}

export default function QuotationFormDialog({ open, onOpenChange, quotation, onSubmit, initialProjectId }: QuotationFormDialogProps) {
  const [projectId, setProjectId] = useState(quotation?.projectId || initialProjectId || '');
  const [items, setItems] = useState<Partial<QuotationItem>[]>(
    quotation?.items || [{ productId: '', quantity: 0, unitPrice: 0 }]
  );
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>(quotation?.discount?.type || 'percentage');
  const [discountValue, setDiscountValue] = useState(quotation?.discount?.value || 0);
  const [validDays, setValidDays] = useState(30);

  useEffect(() => {
    if (quotation) {
      setProjectId(quotation.projectId || '');
      setItems(quotation.items || [{ productId: '', quantity: 0, unitPrice: 0 }]);
      setDiscountType(quotation.discount?.type || 'percentage');
      setDiscountValue(quotation.discount?.value || 0);
    } else if (open) {
      setProjectId(initialProjectId || '');
      setItems([{ productId: '', quantity: 0, unitPrice: 0 }]);
      setDiscountType('percentage');
      setDiscountValue(0);
    }
  }, [quotation, open, initialProjectId]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 0, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = mockProducts.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: product.name,
          category: product.category,
          unit: product.unit,
          unitPrice: product.prices.project,
          margin: 25
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    
    // Calculate total
    const item = newItems[index];
    if (item.quantity && item.unitPrice) {
      item.total = item.quantity * item.unitPrice;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    let discountAmount = 0;
    
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const tax = afterDiscount * 0.05; // 5% VAT
    const total = afterDiscount + tax;
    
    return { subtotal, discountAmount, tax, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { subtotal, tax, total } = calculateTotals();
    const project = mockProjects.find(p => p.id === projectId);
    
    const quotationData: Partial<Quotation> = {
      projectId,
      projectName: project?.name || '',
      items: items as QuotationItem[],
      subtotal,
      discount: { type: discountType, value: discountValue },
      tax: { type: 'VAT', rate: 5 },
      total,
      validUntil: new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: quotation?.status || 'draft'
    };

    if (onSubmit) {
      onSubmit(quotationData);
    }

    toast({
      title: quotation ? 'Quotation Updated' : 'Quotation Created',
      description: `Quotation for ${project?.name} has been ${quotation ? 'updated' : 'created'} successfully.`
    });

    onOpenChange(false);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation ? 'Edit Quotation' : 'New Quotation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valid For (Days)</Label>
              <Input
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
                min={1}
              />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Items</Label>
              <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-start p-4 bg-secondary/20 rounded-lg">
                  <div className="flex-1 grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                      <Label className="text-xs">Product *</Label>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleItemChange(index, 'productId', value)}
                        required
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockProducts.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Quantity *</Label>
                      <Input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="mt-1"
                        min={0}
                        step={0.01}
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Unit Price *</Label>
                      <Input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                        className="mt-1"
                        min={0}
                        step={0.01}
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Total</Label>
                      <Input
                        type="number"
                        value={item.total?.toFixed(2) || '0.00'}
                        className="mt-1 bg-muted"
                        readOnly
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(index)}
                    className="mt-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Totals */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Discount</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={discountType} onValueChange={(value: 'percentage' | 'flat') => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 bg-muted p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">AED {totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount:</span>
                <span className="text-destructive">- AED {totals.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (5%):</span>
                <span className="font-semibold">AED {totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold">Total Payable:</span>
                <span className="font-bold text-lg text-primary">AED {totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {quotation ? 'Update' : 'Create'} Quotation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
