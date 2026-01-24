import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { INVOICE_TERMS, InvoiceTerm } from '@/data/invoiceTerms';
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
  const handleToggle = (termId: string) => {
    if (selectedTerms.includes(termId)) {
      onTermsChange(selectedTerms.filter(id => id !== termId));
    } else {
      onTermsChange([...selectedTerms, termId]);
    }
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
      
      <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
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
      </div>
      
      <p className="text-xs text-muted-foreground border-t pt-2">
        {selectedTerms.length} term{selectedTerms.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
