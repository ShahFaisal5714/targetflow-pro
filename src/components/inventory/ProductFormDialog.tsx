import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product, ProductInput } from '@/hooks/useProducts';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: ProductInput) => void;
}

const categories = [
  { value: 'spc_flooring', label: 'SPC Flooring' },
  { value: 'tile_trims', label: 'Tile Trims' },
  { value: 'wpc_decking', label: 'WPC Decking' },
  { value: 'expansion_joints', label: 'Expansion Joints' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'other', label: 'Other' },
];

const units = [
  { value: 'piece', label: 'Piece' },
  { value: 'sqm', label: 'Square Meter' },
  { value: 'lm', label: 'Linear Meter' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'box', label: 'Box' },
  { value: 'set', label: 'Set' },
];

export default function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSubmit,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    sku: '',
    description: '',
    category: 'lighting',
    color: '',
    price: 0,
    cost: 0,
    stock_quantity: 0,
    reorder_level: 10,
    unit: 'piece',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        category: product.category,
        color: product.color || '',
        price: product.price,
        cost: product.cost,
        stock_quantity: product.stock_quantity,
        reorder_level: product.reorder_level,
        unit: product.unit,
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        category: 'lighting',
        color: '',
        price: 0,
        cost: 0,
        stock_quantity: 0,
        reorder_level: 10,
        unit: 'piece',
      });
    }
  }, [product, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU / Product ID *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                placeholder="e.g., PRD-001"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                placeholder="e.g., Black, White, Oak"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Stock Quantity *</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock_quantity: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                min="0"
                value={formData.reorder_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    reorder_level: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
