import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import { useProjects } from '@/hooks/useProjects';
import { useCustomers } from '@/hooks/useCustomers';
import { Project, ProjectStatus } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Building, User, Edit, Trash2, Undo2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';
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

const statusTabs: { key: ProjectStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All Projects' },
  { key: 'lead', label: 'Leads' },
  { key: 'active', label: 'Active' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'closed', label: 'Closed' },
];

export default function Projects() {
  const navigate = useNavigate();
  const { toast, dismiss } = useToast();
  const { role } = useAuth();
  const canEdit = role !== 'viewer';
  const { projects, loading, createProject, updateProject, deleteProject, refetch } = useProjects();
  const [activeTab, setActiveTab] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const handleProjectUpdate = async (updatedProject: Partial<Project>) => {
    if (selectedProject) {
      await updateProject(selectedProject.id, updatedProject);
    }
  };

  const handleProjectCreate = async (newProject: Partial<Project>) => {
    await createProject(newProject);

    const party = newProject.client?.name ? newProject.client : newProject.contractor;
    if (party?.name) {
      await captureCustomer({
        name: party.name,
        contact_person: party.contact || null,
        email: party.email || null,
        phone: party.phone || null,
        address: party.address || null,
      });
    }
  };

  const handleDeleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleUndoDelete = async (project: Project, toastId: string) => {
    dismiss(toastId);
    
    // Re-create the project in the database
    const restored = await createProject({
      name: project.name,
      category: project.category,
      status: project.status,
      value: project.value,
      salesManager: project.salesManager,
      contractor: project.contractor,
      client: project.client,
      consultant: project.consultant,
      timeline: project.timeline,
    });
    
    if (restored) {
      toast({
        title: 'Project Restored',
        description: `${project.name} has been restored successfully.`,
      });
    }
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      const deletedProject = projectToDelete;
      
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      
      // Delete immediately from database
      const success = await deleteProject(deletedProject.id);
      
      if (success) {
        toast({
          title: 'Project Deleted',
          description: `${deletedProject.name} has been deleted.`,
          duration: 8000,
          action: (
            <ToastAction 
              altText="Undo delete" 
              onClick={(e) => {
                e.preventDefault();
                handleUndoDelete(deletedProject, '');
              }}
              className="gap-1"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </ToastAction>
          ),
        });
      }
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesStatus = activeTab === 'all' || project.status === activeTab;
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.contractor.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      key: 'name',
      header: 'Project',
      render: (project: Project) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Building className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{project.name}</p>
            <p className="text-sm text-muted-foreground">{project.contractor?.name || 'No contractor'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client / Contractor',
      render: (project: Project) => (
        <span className="text-foreground">{project.contractor?.name || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project: Project) => <StatusBadge status={project.status} />,
    },
    {
      key: 'salesManager',
      header: 'Sales Manager',
      render: (project: Project) => {
        const extProject = project as Project & { salesManagerContact?: string };
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{project.salesManager || 'Unassigned'}</span>
            </div>
            {extProject.salesManagerContact && (
              <span className="text-xs text-muted-foreground ml-6">{extProject.salesManagerContact}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'quotations',
      header: 'Quotations',
      render: (project: Project) => (
        <span className="text-sm text-muted-foreground">View in detail</span>
      ),
    },
    ...(canEdit ? [{
      key: 'actions',
      header: '',
      render: (project: Project) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={(e) => handleEditProject(project, e)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={(e) => handleDeleteProject(project, e)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <MainLayout>
      <Header
        title="Projects"
        subtitle={`${filteredProjects.length} projects found`}
        action={canEdit ? {
          label: 'New Project',
          onClick: () => setIsCreateDialogOpen(true),
        } : undefined}
      />

      <ProjectFormDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleProjectCreate}
      />

      <ProjectFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        project={selectedProject}
        onSubmit={handleProjectUpdate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-6 space-y-6">
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

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredProjects}
            onRowClick={(project) => navigate(`/projects/${project.id}`)}
            emptyMessage="No projects found matching your criteria"
          />
        )}
      </div>
    </MainLayout>
  );
}
