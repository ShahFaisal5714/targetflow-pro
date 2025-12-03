import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import DataTable from '@/components/shared/DataTable';
import StatusBadge from '@/components/shared/StatusBadge';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import { mockProjects } from '@/data/mockData';
import { Project, ProjectStatus, ProjectCategory } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Building, Calendar, User, Edit, Trash2, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
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

const categoryLabels: Record<ProjectCategory, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
};

export default function Projects() {
  const navigate = useNavigate();
  const { toast, dismiss } = useToast();
  const [activeTab, setActiveTab] = useState<ProjectStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleUndoDelete = (project: Project, toastId: string) => {
    // Clear the timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    // Remove from deleted projects
    setDeletedProjects(prev => prev.filter(p => p.id !== project.id));
    
    // Dismiss the delete toast
    dismiss(toastId);
    
    // Show restore confirmation
    toast({
      title: 'Project Restored',
      description: `${project.name} has been restored successfully.`,
    });
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      const deletedProject = projectToDelete;
      
      // Add to deleted projects (soft delete)
      setDeletedProjects(prev => [...prev, deletedProject]);
      
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      
      // Show toast with undo option
      const { id: toastId } = toast({
        title: 'Project Deleted',
        description: `${deletedProject.name} has been deleted.`,
        duration: 8000,
        action: (
          <ToastAction 
            altText="Undo delete" 
            onClick={() => handleUndoDelete(deletedProject, toastId)}
            className="gap-1"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </ToastAction>
        ),
      });
      
      // Set timeout to permanently delete after toast disappears
      undoTimeoutRef.current = setTimeout(() => {
        // In a real app, this would make an API call to permanently delete
        console.log(`Permanently deleted project: ${deletedProject.id}`);
      }, 8000);
    }
  };

  const filteredProjects = mockProjects.filter((project) => {
    // Exclude soft-deleted projects
    if (deletedProjects.some(dp => dp.id === project.id)) {
      return false;
    }
    const matchesStatus = activeTab === 'all' || project.status === activeTab;
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.contractor.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const columns = [
    {
      key: 'id',
      header: 'Project ID',
      render: (project: Project) => (
        <span className="font-mono text-sm text-muted-foreground">{project.id}</span>
      ),
    },
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
            <p className="text-sm text-muted-foreground">{project.contractor.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (project: Project) => (
        <span className="module-badge bg-secondary text-secondary-foreground">
          {categoryLabels[project.category]}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (project: Project) => <StatusBadge status={project.status} />,
    },
    {
      key: 'value',
      header: 'Value',
      render: (project: Project) => (
        <span className="font-semibold text-foreground">
          AED {project.value.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'salesManager',
      header: 'Sales Manager',
      render: (project: Project) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{project.salesManager}</span>
        </div>
      ),
    },
    {
      key: 'timeline',
      header: 'Timeline',
      render: (project: Project) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {new Date(project.timeline.startDate).toLocaleDateString()} -{' '}
          {new Date(project.timeline.endDate).toLocaleDateString()}
        </div>
      ),
    },
    {
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
    },
  ];

  return (
    <MainLayout>
      <Header
        title="Projects"
        subtitle={`${filteredProjects.length} projects found`}
        action={{
          label: 'New Project',
          onClick: () => setIsCreateDialogOpen(true),
        }}
      />

      <ProjectFormDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen}
      />

      <ProjectFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        project={selectedProject}
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
        <DataTable
          columns={columns}
          data={filteredProjects}
          onRowClick={(project) => navigate(`/projects/${project.id}`)}
          emptyMessage="No projects found matching your criteria"
        />
      </div>
    </MainLayout>
  );
}
