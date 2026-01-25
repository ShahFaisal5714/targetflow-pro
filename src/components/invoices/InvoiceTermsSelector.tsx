import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { INVOICE_TERMS, InvoiceTerm } from '@/data/invoiceTerms';
import { useCustomInvoiceTerms } from '@/hooks/useCustomInvoiceTerms';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceTermsSelectorProps {
  selectedTerms: string[];
  onTermsChange: (terms: string[]) => void;
}

const categoryLabels: Record<InvoiceTerm['category'], string> = {
  general: 'General',
  payment: 'Payment',
  delivery: 'Delivery',
  warranty: 'Warranty',
  liability: 'Liability',
};

const categoryColors: Record<InvoiceTerm['category'], string> = {
  general: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  payment: 'bg-green-500/10 text-green-500 border-green-500/20',
  delivery: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  warranty: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  liability: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function InvoiceTermsSelector({ 
  selectedTerms, 
  onTermsChange 
}: InvoiceTermsSelectorProps) {
  const { customTerms, loading, createCustomTerm, deleteCustomTerm } = useCustomInvoiceTerms();
  const [newTermText, setNewTermText] = useState('');
  const [newTermCategory, setNewTermCategory] = useState<string>('general');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = (termId: string) => {
    if (selectedTerms.includes(termId)) {
      onTermsChange(selectedTerms.filter(id => id !== termId));
    } else {
      onTermsChange([...selectedTerms, termId]);
    }
  };

  const handleAddCustomTerm = async () => {
    if (!newTermText.trim()) return;
    setIsAdding(true);
    const result = await createCustomTerm(newTermText.trim(), newTermCategory);
    if (result) {
      setNewTermText('');
      setNewTermCategory('general');
    }
    setIsAdding(false);
  };

  const handleDeleteCustomTerm = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedTerms.includes(`custom-${id}`)) {
      onTermsChange(selectedTerms.filter(termId => termId !== `custom-${id}`));
    }
    await deleteCustomTerm(id);
  };

  const groupedTerms = INVOICE_TERMS.reduce((acc, term) => {
    if (!acc[term.category]) acc[term.category] = [];
    acc[term.category].push(term);
    return acc;
  }, {} as Record<InvoiceTerm['category'], InvoiceTerm[]>);

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Terms & Conditions</Label>
      <p className="text-xs text-muted-foreground">
        Select which terms to include on this invoice
      </p>
      
      <ScrollArea className="h-64 pr-2">
        <div className="space-y-4">
          {/* Predefined Terms */}
          {Object.entries(groupedTerms).map(([category, terms]) => (
            <div key={category} className="space-y-2">
              <Badge 
                variant="outline" 
                className={cn('text-xs', categoryColors[category as InvoiceTerm['category']])}
              >
                {categoryLabels[category as InvoiceTerm['category']]}
              </Badge>
              
              <div className="space-y-2 pl-1">
                {terms.map((term) => (
                  <div key={term.id} className="flex items-start gap-2">
                    <Checkbox
                      id={term.id}
                      checked={selectedTerms.includes(term.id)}
                      onCheckedChange={() => handleToggle(term.id)}
                      className="mt-0.5"
                    />
                    <Label 
                      htmlFor={term.id} 
                      className="text-xs text-muted-foreground cursor-pointer leading-relaxed"
                    >
                      {term.text}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Terms Section */}
          <div className="space-y-2 border-t pt-4">
            <Badge variant="outline" className="text-xs bg-chart-4/10 text-chart-4 border-chart-4/20">
              Custom Terms
            </Badge>
            
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <div className="space-y-2 pl-1">
                  {customTerms.map((term) => (
                    <div key={term.id} className="flex items-start gap-2 group">
                      <Checkbox
                        id={`custom-${term.id}`}
                        checked={selectedTerms.includes(`custom-${term.id}`)}
                        onCheckedChange={() => handleToggle(`custom-${term.id}`)}
                        className="mt-0.5"
                      />
                      <Label
                        htmlFor={`custom-${term.id}`}
                        className="text-xs text-muted-foreground cursor-pointer leading-relaxed flex-1"
                      >
                        {term.text}
                      </Label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteCustomTerm(term.id, e)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  {customTerms.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">No custom terms yet</p>
                  )}
                </div>

                {/* Add New Custom Term */}
                <div className="mt-3 space-y-2 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">Add Custom Term</p>
                  <div className="flex gap-2">
                    <Select value={newTermCategory} onValueChange={setNewTermCategory}>
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key} className="text-xs">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Enter custom term..."
                      value={newTermText}
                      onChange={(e) => setNewTermText(e.target.value)}
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTerm()}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddCustomTerm}
                      disabled={!newTermText.trim() || isAdding}
                      className="h-8"
                    >
                      {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </ScrollArea>
      
      <p className="text-xs text-muted-foreground border-t pt-2">
        {selectedTerms.length} term{selectedTerms.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
