import { cn } from '@/lib/utils';
import { ArrowRight, Building, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const statusStyles: Record<string, string> = {
  lead: 'status-lead',
  active: 'status-active',
  quoted: 'status-quoted',
  in_progress: 'status-progress',
  delivered: 'status-delivered',
  closed: 'status-closed',
  completed: 'status-delivered',
  on_hold: 'status-quoted',
  cancelled: 'status-closed',
};

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  active: 'Active',
  quoted: 'Quoted',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  closed: 'Closed',
  completed: 'Completed',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
};

interface RecentProject {
  id: string;
  name: string;
  status: string;
  contractor: { name: string };
  value: number;
  salesManager: string;
  updatedAt: string;
}

interface RecentProjectsProps {
  projects: RecentProject[];
}

export default function RecentProjects({ projects }: RecentProjectsProps) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Projects</h3>
          <p className="text-sm text-muted-foreground">Latest project activities</p>
        </div>
        <Link
          to="/projects"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No projects yet. Create your first project to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div
              key={project.id}
              className="flex items-center gap-4 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground truncate">{project.name}</h4>
                  <span className={cn('module-badge', statusStyles[project.status] || 'status-lead')}>
                    {statusLabels[project.status] || project.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-sm text-muted-foreground">{project.contractor?.name || 'No contractor'}</span>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  AED {project.value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{project.salesManager || 'Not assigned'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
