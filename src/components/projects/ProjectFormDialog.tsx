import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project, ProjectCategory, ProjectStatus } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
  onSubmit?: (data: Partial<Project>) => void;
}

export default function ProjectFormDialog({ open, onOpenChange, project, onSubmit }: ProjectFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!project;

  const [formData, setFormData] = useState({
    name: '',
    category: 'residential' as ProjectCategory,
    status: 'lead' as ProjectStatus,
    value: 0,
    contractorName: '',
    contractorContact: '',
    contractorEmail: '',
    contractorPhone: '',
    salesManager: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        category: project.category,
        status: project.status,
        value: project.value,
        contractorName: project.contractor.name,
        contractorContact: project.contractor.contact,
        contractorEmail: project.contractor.email,
        contractorPhone: project.contractor.phone,
        salesManager: project.salesManager,
        startDate: project.timeline.startDate,
        endDate: project.timeline.endDate,
      });
    } else {
      setFormData({
        name: '',
        category: 'residential',
        status: 'lead',
        value: 0,
        contractorName: '',
        contractorContact: '',
        contractorEmail: '',
        contractorPhone: '',
        salesManager: '',
        startDate: '',
        endDate: '',
      });
    }
  }, [project, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const projectData: Partial<Project> = {
      name: formData.name,
      category: formData.category,
      status: formData.status,
      value: formData.value,
      contractor: {
        id: project?.contractor.id || `CONT-${Date.now()}`,
        name: formData.contractorName,
        contact: formData.contractorContact,
        email: formData.contractorEmail,
        phone: formData.contractorPhone,
      },
      salesManager: formData.salesManager,
      timeline: {
        startDate: formData.startDate,
        endDate: formData.endDate,
        milestones: project?.timeline.milestones || [],
      },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Project Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name" 
                required 
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: ProjectCategory) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: ProjectStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="value">Project Value (AED)</Label>
              <Input 
                id="value" 
                type="number" 
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00" 
                required 
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="contractor">Contractor Company</Label>
              <Input 
                id="contractor" 
                value={formData.contractorName}
                onChange={(e) => setFormData(prev => ({ ...prev, contractorName: e.target.value }))}
                placeholder="Enter contractor company name" 
                required 
              />
            </div>

            <div>
              <Label htmlFor="contractorContact">Contractor Contact Person</Label>
              <Input 
                id="contractorContact" 
                value={formData.contractorContact}
                onChange={(e) => setFormData(prev => ({ ...prev, contractorContact: e.target.value }))}
                placeholder="Contact person name" 
              />
            </div>

            <div>
              <Label htmlFor="contractorEmail">Contractor Email</Label>
              <Input 
                id="contractorEmail" 
                type="email"
                value={formData.contractorEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, contractorEmail: e.target.value }))}
                placeholder="email@example.com" 
              />
            </div>

            <div>
              <Label htmlFor="contractorPhone">Contractor Phone</Label>
              <Input 
                id="contractorPhone" 
                value={formData.contractorPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, contractorPhone: e.target.value }))}
                placeholder="+971 XX XXX XXXX" 
              />
            </div>

            <div>
              <Label htmlFor="salesManager">Sales Manager</Label>
              <Input 
                id="salesManager" 
                value={formData.salesManager}
                onChange={(e) => setFormData(prev => ({ ...prev, salesManager: e.target.value }))}
                placeholder="Assigned sales manager" 
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required 
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required 
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
