import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';
import { useCompanies } from '@/hooks/useCompanies';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSubmit?: (data: Partial<Project>) => void;
}

interface ExtendedFormData {
  companyId: string;
  name: string;
  contractorName: string;
  buyerTrn: string;
  consultantName: string;
  developerName: string;
  attnTo: string;
  clientEmail: string;
  clientContact: string;
  salesManagerName: string;
  salesManagerContact: string;
}

export default function ProjectFormDialog({ open, onOpenChange, project, onSubmit }: ProjectFormDialogProps) {
  const { toast } = useToast();
  const { targetSpecialties, alhadafCompany, tswpcCompany, activeCompanyId } = useCompanies();
  const isEdit = !!project;

  const [formData, setFormData] = useState<ExtendedFormData>({
    companyId: '',
    name: '',
    contractorName: '',
    buyerTrn: '',
    consultantName: '',
    developerName: '',
    attnTo: '',
    clientEmail: '',
    clientContact: '',
    salesManagerName: '',
    salesManagerContact: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        companyId: project.companyId || activeCompanyId,
        name: project.name,
        contractorName: project.contractor?.name || '',
        buyerTrn: (project as any).buyerTrn || '',
        consultantName: project.consultant?.name || '',
        developerName: (project as any).developer?.name || '',
        attnTo: (project as any).attnTo || '',
        clientEmail: (project as any).clientEmail || '',
        clientContact: (project as any).clientContact || '',
        salesManagerName: project.salesManager || '',
        salesManagerContact: (project as any).salesManagerContact || '',
      });
    } else {
      setFormData({
        companyId: activeCompanyId,
        name: '',
        contractorName: '',
        buyerTrn: '',
        consultantName: '',
        developerName: '',
        attnTo: '',
        clientEmail: '',
        clientContact: '',
        salesManagerName: '',
        salesManagerContact: '',
      });
    }
  }, [project, open, activeCompanyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData: Partial<Project> & Record<string, any> = {
      name: formData.name,
      category: 'commercial', // Default category
      status: 'lead', // Default status
      value: 0, // Will be calculated from quotations
      contractor: {
        id: project?.contractor?.id || `CONT-${Date.now()}`,
        name: formData.contractorName,
        contact: formData.attnTo,
        email: formData.clientEmail,
        phone: formData.clientContact,
      },
      client: {
        id: project?.client?.id || `CLI-${Date.now()}`,
        name: formData.contractorName,
        contact: formData.attnTo,
        email: formData.clientEmail,
        phone: formData.clientContact,
      },
      consultant: formData.consultantName ? {
        id: project?.consultant?.id || `CONS-${Date.now()}`,
        name: formData.consultantName,
        contact: '',
        email: '',
        phone: '',
      } : undefined,
      salesManager: formData.salesManagerName,
      timeline: {
        startDate: '',
        endDate: '',
        milestones: project?.timeline?.milestones || [],
      },
      // Don't pass the hardcoded IDs to the database - they expect UUIDs or null
      companyId: undefined, // Company info stored in project fields, not as FK
      buyerTrn: formData.buyerTrn,
      developer: formData.developerName ? { name: formData.developerName } : null,
      attnTo: formData.attnTo,
      clientEmail: formData.clientEmail,
      clientContact: formData.clientContact,
      salesManagerContact: formData.salesManagerContact,
      updatedAt: new Date().toISOString(),
    };

    onSubmit?.(projectData);
    
    toast({
      title: isEdit ? 'Project Updated' : 'Project Created',
      description: isEdit 
        ? `${formData.name} has been updated successfully.`
        : 'New project has been created successfully.',
    });
    onOpenChange(false);
  };

  // Build company options
  const companyOptions = [
    { id: targetSpecialties.id, name: 'Target Specialties Building Material Trading LLC' },
    { id: alhadafCompany.id, name: 'Al Hadaf Al Kabeer Metal Contracting' },
    { id: tswpcCompany.id, name: 'TS WPC DOORS' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Company */}
          <div>
            <Label htmlFor="company">1. Company *</Label>
            <Select 
              value={formData.companyId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
            >
              <SelectTrigger id="company">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                {companyOptions.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Project Name */}
          <div>
            <Label htmlFor="name">2. Project Name *</Label>
            <Input 
              id="name" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name" 
              required 
            />
          </div>

          {/* 3. Client / Contractor */}
          <div>
            <Label htmlFor="contractor">3. Client / Contractor *</Label>
            <Input 
              id="contractor" 
              value={formData.contractorName}
              onChange={(e) => setFormData(prev => ({ ...prev, contractorName: e.target.value }))}
              placeholder="Enter client or contractor company name" 
              required 
            />
          </div>

          {/* 4. Buyer TRN No */}
          <div>
            <Label htmlFor="buyerTrn">4. Buyer TRN No:</Label>
            <Input 
              id="buyerTrn" 
              value={formData.buyerTrn}
              onChange={(e) => setFormData(prev => ({ ...prev, buyerTrn: e.target.value }))}
              placeholder="Tax Registration Number" 
            />
          </div>

          {/* 5. Consultant (Optional) */}
          <div>
            <Label htmlFor="consultant">5. Consultant (Optional) <span className="text-xs text-muted-foreground">- Not shown on quotation</span></Label>
            <Input 
              id="consultant" 
              value={formData.consultantName}
              onChange={(e) => setFormData(prev => ({ ...prev, consultantName: e.target.value }))}
              placeholder="Consultant name (optional)" 
            />
          </div>

          {/* 6. Developer (Optional) */}
          <div>
            <Label htmlFor="developer">6. Developer (Optional) <span className="text-xs text-muted-foreground">- Not shown on quotation</span></Label>
            <Input 
              id="developer" 
              value={formData.developerName}
              onChange={(e) => setFormData(prev => ({ ...prev, developerName: e.target.value }))}
              placeholder="Developer name (optional)" 
            />
          </div>

          {/* 7. Attn. To */}
          <div>
            <Label htmlFor="attnTo">7. Attn. To:</Label>
            <Input 
              id="attnTo" 
              value={formData.attnTo}
              onChange={(e) => setFormData(prev => ({ ...prev, attnTo: e.target.value }))}
              placeholder="Attention to (contact person)" 
            />
          </div>

          {/* 8. Client Email (Optional) */}
          <div>
            <Label htmlFor="clientEmail">8. Client Email (Optional) <span className="text-xs text-muted-foreground">- Not shown on quotation</span></Label>
            <Input 
              id="clientEmail" 
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
              placeholder="client@example.com" 
            />
          </div>

          {/* 9. Client Contact No */}
          <div>
            <Label htmlFor="clientContact">9. Client Contact No:</Label>
            <Input 
              id="clientContact" 
              value={formData.clientContact}
              onChange={(e) => setFormData(prev => ({ ...prev, clientContact: e.target.value }))}
              placeholder="+971 XX XXX XXXX" 
            />
          </div>

          {/* 10. Sales Manager */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salesManager">10. Sales Manager Name:</Label>
              <Input 
                id="salesManager" 
                value={formData.salesManagerName}
                onChange={(e) => setFormData(prev => ({ ...prev, salesManagerName: e.target.value }))}
                placeholder="Sales manager name" 
              />
            </div>
            <div>
              <Label htmlFor="salesManagerContact">Contact No:</Label>
              <Input 
                id="salesManagerContact" 
                value={formData.salesManagerContact}
                onChange={(e) => setFormData(prev => ({ ...prev, salesManagerContact: e.target.value }))}
                placeholder="+971 XX XXX XXXX" 
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEdit ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
