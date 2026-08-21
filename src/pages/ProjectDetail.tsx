import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Header from '@/components/layout/Header';
import StatusBadge from '@/components/shared/StatusBadge';
import ProjectFormDialog from '@/components/projects/ProjectFormDialog';
import QuotationFormDialog from '@/components/quotations/QuotationFormDialog';
import { mockSalesOrders } from '@/data/mockData';
import { useProjects } from '@/hooks/useProjects';
import { useQuotations } from '@/hooks/useQuotations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Plus,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryLabels: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
};

const statusLabels: Record<string, string> = {
  lead: 'Lead',
  active: 'Active',
  quoted: 'Quoted',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  closed: 'Closed',
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { projects, loading, updateProject } = useProjects();
  const { quotations, createQuotation, refetch: refetchQuotations } = useQuotations();
  const project = projects.find((p) => p.id === id);
  const projectQuotations = quotations.filter((q) => q.project_id === id);
  const projectOrders = mockSalesOrders.filter((so) => so.projectId === id);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);

  const handleUpdateProject = async (data: Partial<typeof project>) => {
    if (project && id) {
      await updateProject(id, data);
    }
  };

  const handleQuotationSubmit = async (quotationData: any) => {
    await createQuotation({
      project_id: quotationData.projectId,
      project_name: quotationData.projectName,
      items: quotationData.items,
      subtotal: quotationData.subtotal,
      discount: quotationData.discount,
      tax: quotationData.tax,
      total: quotationData.total,
      valid_until: quotationData.validUntil,
      status: quotationData.status,
    });
    refetchQuotations();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground">Project not found</h2>
            <Link to="/projects" className="text-primary hover:underline mt-2 inline-block">
              Back to Projects
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Header title={project.name} subtitle={`Project ID: ${project.id}`} />

      <ProjectFormDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        project={project}
        onSubmit={handleUpdateProject}
      />

      <QuotationFormDialog
        open={isQuotationDialogOpen}
        onOpenChange={setIsQuotationDialogOpen}
        initialProjectId={id}
        onSubmit={handleQuotationSubmit}
      />

      <div className="p-6 space-y-6">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <Link
            to="/projects"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>Edit Project</Button>
            <Button onClick={() => setIsQuotationDialogOpen(true)}>Create Quotation</Button>
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Overview</CardTitle>
              <StatusBadge status={project.status} />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium text-foreground">
                    {statusLabels[project.status] || project.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sales Manager</p>
                  <div className="flex flex-col mt-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{project.salesManager || 'Unassigned'}</span>
                    </div>
                    {(project as any).salesManagerContact && (
                      <span className="text-sm text-muted-foreground ml-6">{(project as any).salesManagerContact}</span>
                    )}
                  </div>
                </div>
                {(project as any).buyerTrn && (
                  <div>
                    <p className="text-sm text-muted-foreground">Buyer TRN No</p>
                    <p className="font-medium text-foreground">{(project as any).buyerTrn}</p>
                  </div>
                )}
                {(project as any).attnTo && (
                  <div>
                    <p className="text-sm text-muted-foreground">Attention To</p>
                    <p className="font-medium text-foreground">{(project as any).attnTo}</p>
                  </div>
                )}
              </div>

              {/* Milestones */}
              {project.timeline.milestones.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">Milestones</h4>
                  <div className="space-y-3">
                    {project.timeline.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30"
                      >
                        {milestone.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <p className={cn('font-medium', milestone.completed && 'line-through text-muted-foreground')}>
                            {milestone.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(milestone.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts */}
          <div className="space-y-6">
            {/* Contractor */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Contractor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-semibold text-foreground">{project.contractor.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {project.contractor.contact}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {project.contractor.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {project.contractor.phone}
                  </div>
                  {project.contractor.address && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {project.contractor.address}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Client */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Client
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-semibold text-foreground">{project.client.name}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {project.client.contact}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {project.client.email}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {project.client.phone}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultant */}
            {project.consultant && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Consultant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-semibold text-foreground">{project.consultant.name}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      {project.consultant.contact}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      {project.consultant.email}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs for Related Data */}
        <Tabs defaultValue="quotations" className="w-full">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="quotations" className="gap-2">
              <FileText className="h-4 w-4" />
              Quotations ({projectQuotations.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Sales Orders ({projectOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotations" className="mt-4">
            {projectQuotations.length > 0 ? (
              <div className="space-y-3">
                {projectQuotations.map((quotation) => (
                  <Card 
                    key={quotation.id} 
                    className="hover:border-primary/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/quotations/${quotation.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{quotation.id}</p>
                            <p className="text-sm text-muted-foreground">
                              Version {quotation.version} • {quotation.items.length} items
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              AED {quotation.total.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Valid until {quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <StatusBadge status={quotation.status as any} />
                          <Button size="sm" variant="outline">View</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No quotations yet</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quotation
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            {projectOrders.length > 0 ? (
              <div className="space-y-3">
                {projectOrders.map((order) => (
                  <Card key={order.id} className="hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                            <ShoppingCart className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.items.length} items • {order.deliverySchedule.length} deliveries
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-foreground">
                              AED {order.total.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 sm:p-8 text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No sales orders yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
