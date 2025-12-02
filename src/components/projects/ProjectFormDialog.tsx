import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Project, ProjectCategory, ProjectStatus } from '@/types/crm';
import { useToast } from '@/hooks/use-toast';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project;
}

export default function ProjectFormDialog({ open, onOpenChange, project }: ProjectFormDialogProps) {
  const { toast } = useToast();
  const isEdit = !!project;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: isEdit ? 'Project Updated' : 'Project Created',
      description: isEdit 
        ? `${project.name} has been updated successfully.`
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
                defaultValue={project?.name}
                placeholder="Enter project name" 
                required 
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select defaultValue={project?.category || 'residential'}>
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
              <Select defaultValue={project?.status || 'lead'}>
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
              <Label htmlFor="value">Project Value</Label>
              <Input 
                id="value" 
                type="number" 
                defaultValue={project?.value}
                placeholder="0.00" 
                required 
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="contractor">Contractor Company</Label>
              <Input 
                id="contractor" 
                defaultValue={project?.contractor.name}
                placeholder="Enter contractor company name" 
                required 
              />
            </div>

            <div>
              <Label htmlFor="contractorContact">Contractor Contact Person</Label>
              <Input 
                id="contractorContact" 
                defaultValue={project?.contractor.contact}
                placeholder="Contact person name" 
              />
            </div>

            <div>
              <Label htmlFor="contractorEmail">Contractor Email</Label>
              <Input 
                id="contractorEmail" 
                type="email"
                defaultValue={project?.contractor.email}
                placeholder="email@example.com" 
              />
            </div>

            <div>
              <Label htmlFor="contractorPhone">Contractor Phone</Label>
              <Input 
                id="contractorPhone" 
                defaultValue={project?.contractor.phone}
                placeholder="+971 XX XXX XXXX" 
              />
            </div>

            <div>
              <Label htmlFor="salesManager">Sales Manager</Label>
              <Input 
                id="salesManager" 
                defaultValue={project?.salesManager}
                placeholder="Assigned sales manager" 
              />
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input 
                id="startDate" 
                type="date" 
                defaultValue={project?.timeline.startDate}
                required 
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input 
                id="endDate" 
                type="date" 
                defaultValue={project?.timeline.endDate}
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
