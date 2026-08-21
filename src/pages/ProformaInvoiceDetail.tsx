import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Printer, Loader2, Receipt, MessageCircle } from 'lucide-react';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { useProformaInvoices } from '@/hooks/useProformaInvoices';
import { useProjects } from '@/hooks/useProjects';
import { useInvoices } from '@/hooks/useInvoices';
import { useCompanies, Company } from '@/hooks/useCompanies';
import StatusBadge from '@/components/shared/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SecondaryOfficeBlock from '@/components/shared/SecondaryOfficeBlock';
import { getLogoForCompanyName } from '@/lib/companyLogos';
import { drawPdfHeader, drawDocumentFooter } from '@/lib/pdfTemplate';

import { useDocumentPdfUpload } from '@/hooks/useDocumentPdfUpload';
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

export default function ProformaInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  
  const { proformaInvoices, loading: proformaLoading } = useProformaInvoices();
  const { projects, loading: projectsLoading } = useProjects();
  const { createInvoice } = useInvoices();
  const { activeCompanyId, getCompanyById, loading: companiesLoading } = useCompanies();
  
  const { uploadPdfForSharing } = useDocumentPdfUpload();

  const proforma = proformaInvoices.find(pi => pi.id === id);
  const project = proforma ? projects.find(p => p.id === proforma.project_id) : null;


  const getProformaCompany = (): { company: Company; logo: string } => {
    const company = getCompanyById(proforma?.company_id ?? activeCompanyId);
    return { company, logo: getLogoForCompanyName(company.name) };
  };

  if (proformaLoading || projectsLoading || companiesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!proforma) {
    return (
      <MainLayout>
        <div className="p-6">
          <p>Proforma invoice not found</p>
        </div>
      </MainLayout>
    );
  }

  const { company, logo } = getProformaCompany();

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    
    // Per-company header template (logo, contact block, offices, TRN, title)
    const metrics = drawPdfHeader(doc, {
      company,
      logo,
      title: 'PROFORMA INVOICE',
      margin,
      showTrn: true,
      detailsGap: 10,
      tableGap: 37,
    });

    // Details - Centered layout
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const centerX = pageWidth / 2;
    const colGap = 70;
    const leftColLabel = centerX - colGap;
    const leftColValue = centerX - colGap + 25;
    const rightColLabel = centerX + 10;
    const rightColValue = centerX + 10 + 25;
    
    let detailsY = metrics.detailsY;

    
    doc.setFont('helvetica', 'bold');
    doc.text('PI No:', leftColLabel, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(proforma.proforma_number, leftColValue, detailsY);

    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', rightColLabel, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(proforma.created_at).toLocaleDateString('en-GB'), rightColValue, detailsY);

    doc.setFont('helvetica', 'bold');
    doc.text('Client:', leftColLabel, detailsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(proforma.client_name, leftColValue, detailsY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Valid Until:', rightColLabel, detailsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(proforma.valid_until ? new Date(proforma.valid_until).toLocaleDateString('en-GB') : '30 Days', rightColValue, detailsY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Project:', leftColLabel, detailsY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.name || 'N/A', leftColValue, detailsY + 14);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', rightColLabel, detailsY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(proforma.status.toUpperCase(), rightColValue, detailsY + 14);

    // Items table
    const tableStartY = metrics.tableStartY;
    const tableData = proforma.items.map((item, index) => [
      index + 1,
      item.description.toUpperCase(),
      item.quantity.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['S No', 'Description', 'Quantity', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { 
        fillColor: [41, 98, 255], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 80 },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalsLabelX = pageWidth - margin - 70;
    const totalsValueX = pageWidth - margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Sub Total (AED):', totalsLabelX, finalY);
    doc.text(proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY, { align: 'right' });

    doc.text(`VAT ${proforma.tax_rate}%:`, totalsLabelX, finalY + 7);
    doc.text(proforma.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 7, { align: 'right' });

    doc.setFontSize(10);
    doc.text('Total Amount (AED):', totalsLabelX, finalY + 15);
    doc.text(proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 15, { align: 'right' });

    // Note
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('This is a proforma invoice for reference purposes only. A tax invoice will be issued upon order confirmation.', margin, finalY + 30);

    drawDocumentFooter(doc, company, margin);

    return doc;
  };

  const handleExportPDF = async () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const filename = `${proforma.proforma_number}.pdf`;
    
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(pdfBlob);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    doc.save(filename);
  };

  const handlePrint = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };


  const handleWhatsAppShare = async () => {
    if (!proforma) return;
    
    setSharingWhatsApp(true);
    try {
      // Generate and upload PDF with short URL
      const doc = generatePDF();
      const pdfBlob = doc.output('blob');
      const pdfUrl = await uploadPdfForSharing(pdfBlob, proforma.proforma_number, 'Proforma Invoice');
      
      const message = encodeURIComponent(
        `Dear ${proforma.client_name},\n\n` +
        `Please find your Proforma Invoice details:\n\n` +
        `📄 PI No: ${proforma.proforma_number}\n` +
        `💰 Total Amount: AED ${proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
        `${proforma.valid_until ? `📅 Valid Until: ${new Date(proforma.valid_until).toLocaleDateString('en-GB')}\n` : ''}` +
        `${pdfUrl ? `\n📎 Download PDF: ${pdfUrl}\n` : ''}` +
        `\nPlease contact us if you have any questions.\n\n` +
        `Best regards,\n${company.name}`
      );
      
      const clientPhone = (project as any)?.client_contact || '';
      const phoneNumber = clientPhone.replace(/\D/g, '');
      
      const whatsappUrl = phoneNumber 
        ? `https://wa.me/${phoneNumber}?text=${message}`
        : `https://wa.me/?text=${message}`;
      
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare document for sharing',
        variant: 'destructive',
      });
    } finally {
      setSharingWhatsApp(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!proforma) return;
    
    setConverting(true);
    try {
      const invoiceData = {
        project_id: proforma.project_id,
        client_name: proforma.client_name,
        items: proforma.items,
        subtotal: proforma.subtotal,
        tax_rate: proforma.tax_rate,
        tax_amount: proforma.tax_amount,
        total: proforma.total,
        status: 'draft',
        notes: `Converted from Proforma Invoice: ${proforma.proforma_number}`,
        company_id: proforma.company_id,
      };
      
      const newInvoice = await createInvoice(invoiceData);
      
      if (newInvoice) {
        toast({
          title: 'Success',
          description: `Tax Invoice ${newInvoice.invoice_number} created successfully`,
        });
        navigate(`/invoices/${newInvoice.id}`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert to tax invoice',
        variant: 'destructive',
      });
    } finally {
      setConverting(false);
      setConvertDialogOpen(false);
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="p-6">
          <Breadcrumb 
            items={[
              { label: 'Proforma Invoices', href: '/proforma-invoices' },
              { label: proforma.proforma_number }
            ]} 
            className="mb-4"
          />
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{proforma.proforma_number}</h1>
                <StatusBadge status={proforma.status as any} />
              </div>
              <p className="text-muted-foreground mt-1">{proforma.client_name}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="default" 
                onClick={() => setConvertDialogOpen(true)}
                className="bg-success hover:bg-success/90"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Convert to Tax Invoice
              </Button>
              <Button 
                variant="outline" 
                onClick={handleWhatsAppShare}
                disabled={sharingWhatsApp}
                className="text-success hover:text-success"
              >
                {sharingWhatsApp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                WhatsApp
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Proforma Invoice Preview */}
      <div className="p-6">
        <Card className="max-w-5xl mx-auto">
          {/* Company Header */}
          <div className="p-4 sm:p-8 border-b bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-start justify-between mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-border/30 flex items-center justify-center" style={{ minWidth: '180px', minHeight: '100px' }}>
                <img 
                  src={logo} 
                  alt={company.name} 
                  className="max-h-24 max-w-[220px] object-contain"
                />
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p className="font-semibold text-foreground text-lg">{company.name}</p>
                {company.address && <p className="mt-1">{company.address}</p>}
                {company.email && <p className="mt-2">Email: {company.email}</p>}
                {company.website && <p>Web: {company.website}</p>}
                {company.phone && <p className="mt-2">Contact: {company.phone}</p>}
                <SecondaryOfficeBlock company={company} />
                {company.taxInfo?.trn && (
                  <p className="mt-2 font-semibold text-foreground">TRN: {company.taxInfo.trn}</p>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                PROFORMA INVOICE
              </h2>
            </div>
          </div>

          {/* Details Section - Centered */}
          <div className="p-4 sm:p-8 border-b flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-3">
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">PI Number:</p>
                <p className="text-sm text-foreground font-mono font-semibold">{proforma.proforma_number}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Issue Date:</p>
                <p className="text-sm text-foreground">{new Date(proforma.created_at).toLocaleDateString('en-GB')}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Client:</p>
                <p className="text-sm text-foreground">{proforma.client_name}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Valid Until:</p>
                <p className="text-sm text-foreground">{proforma.valid_until ? new Date(proforma.valid_until).toLocaleDateString('en-GB') : '30 Days'}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Project:</p>
                <p className="text-sm text-foreground font-semibold">{project?.name || 'N/A'}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Status:</p>
                <StatusBadge status={proforma.status as any} />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-4 sm:p-8 border-b">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-4 py-3 text-left text-xs font-semibold">S No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {proforma.items.map((item, index) => (
                    <tr key={item.productId} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.description.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.quantity.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="p-4 sm:p-8">
            <div className="flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">AED {proforma.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({proforma.tax_rate}%):</span>
                  <span className="font-medium">AED {proforma.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">AED {proforma.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground italic">
                This is a proforma invoice for reference purposes only. A tax invoice will be issued upon order confirmation.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Convert to Invoice Confirmation Dialog */}
      <AlertDialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to Tax Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new Tax Invoice from proforma "{proforma.proforma_number}" with all the same items and amounts. The proforma invoice will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConvertToInvoice} 
              disabled={converting}
              className="bg-success hover:bg-success/90"
            >
              {converting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Convert
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </MainLayout>
  );
}
