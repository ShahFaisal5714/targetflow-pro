import { mockProjects } from '@/data/mockData';
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
};

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  active: 'Active',
  quoted: 'Quoted',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  closed: 'Closed',
};

export default function RecentProjects() {
  const recentProjects = mockProjects.slice(0, 5);

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

      <div className="space-y-4">
        {recentProjects.map((project, index) => (
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
                <span className={cn('module-badge', statusStyles[project.status])}>
                  {statusLabels[project.status]}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-muted-foreground">{project.contractor.name}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">
                ${project.value.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{project.salesManager}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
