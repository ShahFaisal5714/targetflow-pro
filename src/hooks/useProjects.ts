import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectCategory, ProjectStatus, Company, Milestone } from '@/types/crm';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

interface DbProject {
  id: string;
  name: string;
  category: string;
  status: string;
  value: number;
  sales_manager: string | null;
  contractor: unknown;
  client: unknown;
  consultant: unknown | null;
  timeline: unknown;
  company_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

const parseCompany = (data: unknown): Company => {
  const obj = data as Record<string, unknown> || {};
  return {
    id: String(obj.id || ''),
    name: String(obj.name || ''),
    contact: String(obj.contact || ''),
    email: String(obj.email || ''),
    phone: String(obj.phone || ''),
    address: obj.address ? String(obj.address) : undefined,
  };
};

const parseTimeline = (data: unknown): { startDate: string; endDate: string; milestones: Milestone[] } => {
  const obj = data as Record<string, unknown> || {};
  const milestones = Array.isArray(obj.milestones) 
    ? obj.milestones.map((m: unknown) => {
        const milestone = m as Record<string, unknown>;
        return {
          id: String(milestone.id || ''),
          name: String(milestone.name || ''),
          dueDate: String(milestone.dueDate || ''),
          completed: Boolean(milestone.completed),
        };
      })
    : [];
  return {
    startDate: String(obj.startDate || ''),
    endDate: String(obj.endDate || ''),
    milestones,
  };
};

const mapDbToProject = (row: DbProject): Project => ({
  id: row.id,
  name: row.name,
  category: row.category as ProjectCategory,
  status: row.status as ProjectStatus,
  value: Number(row.value),
  salesManager: row.sales_manager || '',
  contractor: parseCompany(row.contractor),
  client: parseCompany(row.client),
  consultant: row.consultant ? parseCompany(row.consultant) : undefined,
  timeline: parseTimeline(row.timeline),
  companyId: row.company_id || undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedProjects = (data as DbProject[]).map(mapDbToProject);
      setProjects(mappedProjects);
    } catch (error) {
      logError('useProjects.fetchProjects', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: Partial<Project>): Promise<Project | null> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a project',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const insertData = {
        name: projectData.name || '',
        category: projectData.category || 'residential',
        status: projectData.status || 'lead',
        value: projectData.value || 0,
        sales_manager: projectData.salesManager || null,
        contractor: JSON.parse(JSON.stringify(projectData.contractor || {})),
        client: JSON.parse(JSON.stringify(projectData.client || {})),
        consultant: projectData.consultant ? JSON.parse(JSON.stringify(projectData.consultant)) : null,
        timeline: JSON.parse(JSON.stringify(projectData.timeline || { startDate: '', endDate: '', milestones: [] })),
        company_id: projectData.companyId || null,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      const newProject = mapDbToProject(data as DbProject);
      setProjects(prev => [newProject, ...prev]);
      
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });
      
      return newProject;
    } catch (error) {
      logError('useProjects.createProject', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>): Promise<boolean> => {
    try {
      const updateData: Record<string, unknown> = {};
      
      if (projectData.name !== undefined) updateData.name = projectData.name;
      if (projectData.category !== undefined) updateData.category = projectData.category;
      if (projectData.status !== undefined) updateData.status = projectData.status;
      if (projectData.value !== undefined) updateData.value = projectData.value;
      if (projectData.salesManager !== undefined) updateData.sales_manager = projectData.salesManager;
      if (projectData.contractor !== undefined) updateData.contractor = projectData.contractor;
      if (projectData.client !== undefined) updateData.client = projectData.client;
      if (projectData.consultant !== undefined) updateData.consultant = projectData.consultant;
      if (projectData.timeline !== undefined) updateData.timeline = projectData.timeline;
      if (projectData.companyId !== undefined) updateData.company_id = projectData.companyId;

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...projectData, updatedAt: new Date().toISOString() } : p
      ));
      
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });
      
      return true;
    } catch (error) {
      logError('useProjects.updateProject', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      logError('useProjects.deleteProject', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
