import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ArrowRight, FolderKanban, FileText, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCompanies, TARGET_SPECIALTIES_DISPLAY, ALHADAF_PROJECTS_DISPLAY } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';

interface BulkTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferComplete: () => void;
}

interface TransferableItem {
  id: string;
  name: string;
  type: 'project' | 'quotation' | 'product';
  company_id: string | null;
}

export default function BulkTransferDialog({ open, onOpenChange, onTransferComplete }: BulkTransferDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { alhadafDbId } = useCompanies();
  
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [items, setItems] = useState<TransferableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [targetCompany, setTargetCompany] = useState<'target' | 'alhadaf'>('alhadaf');
  const [activeTab, setActiveTab] = useState<'projects' | 'quotations' | 'products'>('projects');

  const fetchItems = async (type: 'projects' | 'quotations' | 'products') => {
    if (!user) return;
    
    setLoading(true);
    setSelectedItems([]);
    
    try {
      let query;
      if (type === 'quotations') {
        query = supabase
          .from(type)
          .select('id, project_name, company_id')
          .order('created_at', { ascending: false });
      } else {
        query = supabase
          .from(type)
          .select('id, name, company_id')
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const mappedItems: TransferableItem[] = (data || []).map(item => ({
        id: item.id,
        name: type === 'quotations' ? `Quotation for ${(item as any).project_name || 'Unknown'}` : (item as any).name,
        type: type.slice(0, -1) as 'project' | 'quotation' | 'product',
        company_id: item.company_id,
      }));

      setItems(mappedItems);
    } catch (error) {
      console.error('Failed to fetch items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load items',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as 'projects' | 'quotations' | 'products');
    fetchItems(tab as 'projects' | 'quotations' | 'products');
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      fetchItems('projects');
    }
    onOpenChange(isOpen);
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const filteredItems = getFilteredItems();
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const getFilteredItems = () => {
    // Show items from the opposite company (source)
    const sourceCompanyId = targetCompany === 'alhadaf' ? null : alhadafDbId;
    return items.filter(item => item.company_id === sourceCompanyId);
  };

  const handleTransfer = async () => {
    if (selectedItems.length === 0) return;
    
    setTransferring(true);
    
    try {
      const newCompanyId = targetCompany === 'alhadaf' ? alhadafDbId : null;
      const tableName = activeTab;

      const { error } = await supabase
        .from(tableName)
        .update({ company_id: newCompanyId })
        .in('id', selectedItems);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedItems.length} ${activeTab} transferred successfully`,
      });

      setSelectedItems([]);
      onTransferComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to transfer items:', error);
      toast({
        title: 'Error',
        description: 'Failed to transfer items',
        variant: 'destructive',
      });
    } finally {
      setTransferring(false);
    }
  };

  const filteredItems = getFilteredItems();
  const sourceCompany = targetCompany === 'alhadaf' ? TARGET_SPECIALTIES_DISPLAY.name : ALHADAF_PROJECTS_DISPLAY.name;
  const destCompany = targetCompany === 'alhadaf' ? ALHADAF_PROJECTS_DISPLAY.name : TARGET_SPECIALTIES_DISPLAY.name;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Transfer</DialogTitle>
          <DialogDescription>
            Transfer projects, quotations, or products between companies
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transfer Direction */}
          <div className="space-y-2">
            <Label>Transfer to:</Label>
            <RadioGroup 
              value={targetCompany} 
              onValueChange={(v) => {
                setTargetCompany(v as 'target' | 'alhadaf');
                setSelectedItems([]);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alhadaf" id="alhadaf" />
                <Label htmlFor="alhadaf" className="cursor-pointer">Al Hadaf Al Kabeer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="target" id="target" />
                <Label htmlFor="target" className="cursor-pointer">Target Specialties</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Transfer Flow Indicator */}
          <div className="flex items-center justify-center gap-2 py-2 px-4 bg-muted rounded-lg text-sm">
            <span className="font-medium truncate max-w-[200px]">{sourceCompany}</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate max-w-[200px]">{destCompany}</span>
          </div>

          {/* Item Type Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full">
              <TabsTrigger value="projects" className="flex-1 gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="quotations" className="flex-1 gap-2">
                <FileText className="h-4 w-4" />
                Quotations
              </TabsTrigger>
              <TabsTrigger value="products" className="flex-1 gap-2">
                <Package className="h-4 w-4" />
                Products
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {activeTab} found in {sourceCompany}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedItems.length} of {filteredItems.length} selected
                    </span>
                  </div>
                  <ScrollArea className="h-[250px] border rounded-lg p-2">
                    <div className="space-y-1">
                      {filteredItems.map(item => (
                        <div 
                          key={item.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                          onClick={() => toggleItem(item.id)}
                        >
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                          <span className="text-sm truncate">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer} 
            disabled={selectedItems.length === 0 || transferring}
          >
            {transferring && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Transfer {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
