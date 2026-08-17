import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Truck, Plus, Edit, Trash2, Package, Calendar, Loader2, Download, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/useProjects';
import { useCompanies, Company } from '@/hooks/useCompanies';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLogoForCompanyName } from '@/lib/companyLogos';
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

interface DeliveryOrderItem {
  id: string;
  productName: string;
  quantity: number;
  deliveredQuantity: number;
  unit: string;
}

interface DeliveryOrder {
  id: string;
  delivery_number: string;
  project_id: string | null;
  project_name?: string;
  status: 'pending' | 'dispatched' | 'delivered';
  items: DeliveryOrderItem[];
  delivery_date: string | null;
  notes: string | null;
  created_at: string;
  company_id: string | null;
}

// Helper to get company for a delivery order
const getDeliveryCompany = (
  order: DeliveryOrder,
  activeCompanyId: string,
  alhadafCompany: Partial<Company> | undefined
): { company: Company; logo: string } => {
  const isAlhadaf = order.company_id && order.company_id !== 'target-specialties';
  
  if (isAlhadaf) {
    return { 
      company: { ...ALHADAF_PROJECTS, ...alhadafCompany } as Company,
      logo: alhadafLogo 
    };
  }
  
  return { company: TARGET_SPECIALTIES, logo: targetLogo };
};

const statusTabs: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered', label: 'Delivered' },
];

export default function DeliveryOrders() {
  const { user, role } = useAuth();
  const { projects } = useProjects();
  const { activeCompanyId, alhadafCompany, getActiveCompanyDbId } = useCompanies();
  const { toast } = useToast();
  const canEdit = role !== 'viewer';

  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<DeliveryOrder | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<DeliveryOrder | null>(null);

  const [formData, setFormData] = useState({
    projectId: '',
    deliveryDate: '',
    notes: '',
    items: [] as DeliveryOrderItem[],
  });

  const fetchDeliveryOrders = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('delivery_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithProjects = (data || []).map(order => {
        const project = projects.find(p => p.id === order.project_id);
        const items = Array.isArray(order.items) ? order.items as unknown as DeliveryOrderItem[] : [];
        const status = order.status as 'pending' | 'dispatched' | 'delivered';
        return {
          id: order.id,
          delivery_number: order.delivery_number,
          project_id: order.project_id,
          project_name: project?.name || 'Unknown Project',
          status,
          items,
          delivery_date: order.delivery_date,
          notes: order.notes,
          created_at: order.created_at,
          company_id: order.company_id,
        } as DeliveryOrder;
      });

      setDeliveryOrders(ordersWithProjects);
    } catch (error) {
      console.error('Error fetching delivery orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryOrders();
  }, [user, projects]);

  const generateDeliveryNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DO-${year}${month}-${random}`;
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        id: `item-${Date.now()}`,
        productName: '',
        quantity: 0,
        deliveredQuantity: 0,
        unit: 'pcs',
      }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: keyof DeliveryOrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingOrder) {
        const { error } = await supabase
          .from('delivery_orders')
          .update({
            project_id: formData.projectId || null,
            delivery_date: formData.deliveryDate || null,
            notes: formData.notes || null,
            items: formData.items as any,
          })
          .eq('id', editingOrder.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Delivery order updated' });
      } else {
        const companyDbId = getActiveCompanyDbId();
        const { error } = await supabase
          .from('delivery_orders')
          .insert({
            user_id: user.id,
            delivery_number: generateDeliveryNumber(),
            project_id: formData.projectId || null,
            delivery_date: formData.deliveryDate || null,
            notes: formData.notes || null,
            items: formData.items as any,
            status: 'pending',
            company_id: companyDbId,
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'Delivery order created' });
      }

      setIsFormOpen(false);
      setEditingOrder(null);
      setFormData({ projectId: '', deliveryDate: '', notes: '', items: [] });
      fetchDeliveryOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (order: DeliveryOrder) => {
    setEditingOrder(order);
    setFormData({
      projectId: order.project_id || '',
      deliveryDate: order.delivery_date || '',
      notes: order.notes || '',
      items: order.items,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;

    try {
      const { error } = await supabase
        .from('delivery_orders')
        .delete()
        .eq('id', deletingOrder.id);

      if (error) throw error;
      toast({ title: 'Deleted', description: 'Delivery order removed' });
      setDeletingOrder(null);
      fetchDeliveryOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleStatusChange = async (order: DeliveryOrder, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      toast({ title: 'Status Updated', description: `Order marked as ${newStatus}` });
      fetchDeliveryOrders();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // PDF Generation for Delivery Order
  const generateDeliveryPDF = (order: DeliveryOrder) => {
    const { company, logo } = getDeliveryCompany(order, activeCompanyId, alhadafCompany);
    const project = projects.find(p => p.id === order.project_id);
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add logo - on the left side (larger for Alhadaf)
    const img = new Image();
    img.src = logo;
    const isAlhadaf = company.name.toLowerCase().includes('hadaf');
    const logoWidth = isAlhadaf ? 65 : 55;
    const logoHeight = isAlhadaf ? 42 : 35;
    doc.addImage(img, 'PNG', margin, 8, logoWidth, logoHeight);

    // Company Header - on the right side with BOLD text
    const rightAlignX = pageWidth - margin;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(company.name, rightAlignX, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(company.address || '', rightAlignX, 22, { align: 'right' });
    doc.text(`Email: ${company.email || 'N/A'}`, rightAlignX, 29, { align: 'right' });
    doc.text(`Web: ${company.website || 'N/A'}`, rightAlignX, 36, { align: 'right' });
    doc.text(`Contact No: ${company.phone || 'N/A'}`, rightAlignX, 43, { align: 'right' });

    // Title - centered below header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('DELIVERY ORDER', pageWidth / 2, 56, { align: 'center' });

    // Order details section
    doc.setFontSize(9);
    const leftColLabel = margin;
    const leftColValue = margin + 35;
    const rightColLabel = pageWidth / 2 + 5;
    const rightColValue = pageWidth / 2 + 35;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery No:', leftColLabel, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(order.delivery_number, leftColValue, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('Project:', leftColLabel, 77);
    doc.setFont('helvetica', 'normal');
    doc.text(order.project_name || 'N/A', leftColValue, 77);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', leftColLabel, 84);
    doc.setFont('helvetica', 'normal');
    doc.text(order.status.toUpperCase(), leftColValue, 84);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', rightColLabel, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(order.created_at).toLocaleDateString('en-GB'), rightColValue, 70);

    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Date:', rightColLabel, 77);
    doc.setFont('helvetica', 'normal');
    doc.text(order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB') : 'Not set', rightColValue, 77);

    if (project?.contractor?.name) {
      doc.setFont('helvetica', 'bold');
      doc.text('Contractor:', rightColLabel, 84);
      doc.setFont('helvetica', 'normal');
      doc.text(project.contractor.name, rightColValue, 84);
    }

    // Items table
    const tableData = order.items.map((item, index) => [
      index + 1,
      item.productName.toUpperCase(),
      item.unit,
      item.quantity.toString(),
      item.deliveredQuantity.toString(),
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['S No', 'Product Name', 'Unit', 'Ordered Qty', 'Delivering Qty']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { 
        fillColor: [41, 98, 255], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      }
    });

    // Notes section
    if (order.notes) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Notes:', margin, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(order.notes, contentWidth);
      doc.text(splitNotes, margin, finalY + 7);
    }

    // Signature section
    const signatureY = (doc as any).lastAutoTable.finalY + (order.notes ? 40 : 20);
    if (signatureY < 260) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Received By:', margin, signatureY);
      doc.line(margin + 25, signatureY, margin + 80, signatureY);
      
      doc.text('Date:', pageWidth / 2, signatureY);
      doc.line(pageWidth / 2 + 15, signatureY, pageWidth / 2 + 60, signatureY);
      
      doc.text('Signature:', margin, signatureY + 15);
      doc.line(margin + 25, signatureY + 15, margin + 80, signatureY + 15);
    }

    return doc;
  };

  const handleExportPDF = async (order: DeliveryOrder) => {
    const doc = generateDeliveryPDF(order);
    const pdfBlob = doc.output('blob');
    const filename = `${order.delivery_number}.pdf`;
    
    // Try to use File System Access API for save-as dialog
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        toast({
          title: 'Success',
          description: `PDF saved successfully`,
        });
        return;
      } catch (err: any) {
        // User cancelled or API not supported - fall back to download
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback for browsers without File System Access API
    doc.save(filename);
  };

  const handlePrintPDF = (order: DeliveryOrder) => {
    const doc = generateDeliveryPDF(order);
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const filteredOrders = deliveryOrders.filter(order => {
    const matchesStatus = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = 
      order.delivery_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.project_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      key: 'delivery_number',
      header: 'Delivery Order',
      render: (order: DeliveryOrder) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-foreground">{order.delivery_number}</p>
            <p className="text-xs text-muted-foreground">{order.project_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (order: DeliveryOrder) => (
        <div className="text-sm">
          <p className="font-medium text-foreground">{order.items.length} item(s)</p>
          <p className="text-xs text-muted-foreground">
            {order.items.slice(0, 2).map(i => i.productName).join(', ')}
            {order.items.length > 2 && '...'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: DeliveryOrder) => <StatusBadge status={order.status} />,
    },
    {
      key: 'delivery_date',
      header: 'Delivery Date',
      render: (order: DeliveryOrder) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'Not set'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (order: DeliveryOrder) => (
        <div className="flex items-center gap-2">
          {canEdit && order.status === 'pending' && (
            <Button size="sm" onClick={() => handleStatusChange(order, 'dispatched')}>
              Dispatch
            </Button>
          )}
          {canEdit && order.status === 'dispatched' && (
            <Button size="sm" variant="outline" onClick={() => handleStatusChange(order, 'delivered')}>
              Mark Delivered
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => handleExportPDF(order)} title="Export PDF">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handlePrintPDF(order)} title="Print">
            <Printer className="h-4 w-4" />
          </Button>
          {canEdit && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleEdit(order)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-destructive hover:text-destructive"
                onClick={() => setDeletingOrder(order)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <MainLayout>
        <Header title="Delivery Orders" subtitle="Loading..." />
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header
        title="Delivery Orders"
        subtitle={`${filteredOrders.length} delivery orders`}
        action={canEdit ? {
          label: 'New Delivery Order',
          onClick: () => {
            setEditingOrder(null);
            setFormData({ projectId: '', deliveryDate: '', notes: '', items: [] });
            setIsFormOpen(true);
          },
        } : undefined}
      />

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOrder ? 'Edit Delivery Order' : 'Create Delivery Order'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Project</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Delivery Date</Label>
              <Input 
                type="date"
                value={formData.deliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items (Partial or Full Quantity)</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              {formData.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
                  No items added. Click "Add Item" to add products for delivery.
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <Card key={item.id}>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-4">
                            <Label className="text-xs">Product Name</Label>
                            <Input 
                              value={item.productName}
                              onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                              placeholder="Product name"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Total Qty</Label>
                            <Input 
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Delivering Qty</Label>
                            <Input 
                              type="number"
                              value={item.deliveredQuantity}
                              onChange={(e) => handleItemChange(index, 'deliveredQuantity', parseInt(e.target.value) || 0)}
                              max={item.quantity}
                            />
                          </div>
                          <div className="col-span-2">
                            <Label className="text-xs">Unit</Label>
                            <Select 
                              value={item.unit}
                              onValueChange={(value) => handleItemChange(index, 'unit', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pcs">pcs</SelectItem>
                                <SelectItem value="sqm">sqm</SelectItem>
                                <SelectItem value="lm">lm</SelectItem>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="box">box</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Button 
                              type="button" 
                              size="sm" 
                              variant="ghost" 
                              className="text-destructive"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {item.quantity > 0 && item.deliveredQuantity > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Delivering {item.deliveredQuantity} of {item.quantity} {item.unit} 
                            ({Math.round((item.deliveredQuantity / item.quantity) * 100)}%)
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes for delivery..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingOrder ? 'Update' : 'Create'} Delivery Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingOrder} onOpenChange={() => setDeletingOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Delivery Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingOrder?.delivery_number}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-warning" />
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <p className="text-2xl font-bold">{deliveryOrders.filter(o => o.status === 'pending').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-info" />
                <p className="text-sm text-muted-foreground">Dispatched</p>
              </div>
              <p className="text-2xl font-bold">{deliveryOrders.filter(o => o.status === 'dispatched').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-success" />
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
              <p className="text-2xl font-bold">{deliveryOrders.filter(o => o.status === 'delivered').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-2">Total Orders</p>
              <p className="text-2xl font-bold">{deliveryOrders.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search delivery orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredOrders}
          emptyMessage="No delivery orders found"
        />
      </div>
    </MainLayout>
  );
}
