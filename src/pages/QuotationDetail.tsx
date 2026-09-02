import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, FileText, Printer, Loader2, Truck, Pencil, Trash2, Receipt, MessageCircle, Eye } from 'lucide-react';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { useQuotations } from '@/hooks/useQuotations';
import { useProjects } from '@/hooks/useProjects';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { useProformaInvoices } from '@/hooks/useProformaInvoices';
import { getCompanyPrefix } from '@/lib/companyPrefix';
import { useCompanies, Company } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import StatusBadge from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QuotationFormDialog from '@/components/quotations/QuotationFormDialog';

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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SecondaryOfficeBlock from '@/components/shared/SecondaryOfficeBlock';
import { getLogoForCompanyName } from '@/lib/companyLogos';
import { drawPdfHeader, drawDocumentFooter } from '@/lib/pdfTemplate';
import { buildWpcQuotationPdf } from '@/lib/wpcQuotationPdf';


export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotations, loading: quotationsLoading, updateQuotation, deleteQuotation } = useQuotations();
  const { projects, loading: projectsLoading } = useProjects();
  const { createDeliveryOrder } = useDeliveryOrders();
  const { createProformaInvoice } = useProformaInvoices();
  const { activeCompanyId, getCompanyById, getSlugForId, loading: companiesLoading } = useCompanies();
  const { role } = useAuth();
  
  const { uploadPdfForSharing } = useDocumentPdfUpload();
  
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [proformaDialogOpen, setProformaDialogOpen] = useState(false);
  const [isCreatingProforma, setIsCreatingProforma] = useState(false);
  const [deliveryItems, setDeliveryItems] = useState<{ productId: string; productName: string; unit: string; orderedQuantity: number; deliveryQuantity: number }[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  
  const canEdit = role === 'admin' || role === 'sales_manager';
  
  const quotation = quotations.find(q => q.id === id);
  const project = quotation ? projects.find(p => p.id === quotation.project_id) : null;


  // Determine which company to use for this quotation
  // Priority: quotation's company_id > active company
  const getQuotationCompany = (): { company: Company; logo: string } => {
    const company = getCompanyById(quotation?.company_id ?? activeCompanyId);
    return { company, logo: getLogoForCompanyName(company.name) };
  };

  if (quotationsLoading || projectsLoading || companiesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!quotation) {
    return (
      <MainLayout>
        <div className="p-6">
          <p>Quotation not found</p>
        </div>
      </MainLayout>
    );
  }

  const { company, logo } = getQuotationCompany();

  const discountAmount = quotation.discount.type === 'percentage'
    ? (quotation.subtotal * quotation.discount.value) / 100
    : quotation.discount.value;

  const afterDiscount = quotation.subtotal - discountAmount;
  const taxAmount = (afterDiscount * quotation.tax.rate) / 100;

  const handleOpenDeliveryDialog = () => {
    // Pre-populate items from quotation
    setDeliveryItems(quotation.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      orderedQuantity: item.quantity,
      deliveryQuantity: item.quantity, // Default to full quantity
    })));
    setDeliveryDialogOpen(true);
  };

  const handleCreateDeliveryOrder = async () => {
    const result = await createDeliveryOrder({
      project_id: quotation.project_id || null,
      items: deliveryItems,
      status: 'pending',
      notes: `Generated from quotation ${quotation.id}`,
    });

    if (result) {
      setDeliveryDialogOpen(false);
      toast({
        title: 'Delivery Order Created',
        description: `Delivery order ${result.delivery_number} has been created`,
      });
      navigate('/delivery-orders');
    }
  };

  const handleDeleteQuotation = async () => {
    setIsDeleting(true);
    const success = await deleteQuotation(quotation!.id);
    setIsDeleting(false);
    if (success) {
      toast({
        title: 'Quotation Deleted',
        description: `Quotation ${getQuotationNumber()} has been deleted`,
      });
      navigate('/quotations');
    }
  };

  const handleUpdateQuotation = async (data: any) => {
    await updateQuotation(quotation!.id, data);
    setEditDialogOpen(false);
  };

  const handleCreateProformaInvoice = async () => {
    if (!quotation) return;
    
    setIsCreatingProforma(true);
    
    // Convert quotation items to proforma invoice items
    const proformaItems = quotation.items.map(item => ({
      productId: item.productId,
      description: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));
    
    // Calculate tax amount
    const discountAmount = quotation.discount.type === 'percentage'
      ? (quotation.subtotal * quotation.discount.value) / 100
      : quotation.discount.value;
    const afterDiscount = quotation.subtotal - discountAmount;
    const taxAmount = (afterDiscount * quotation.tax.rate) / 100;
    
    const result = await createProformaInvoice({
      quotation_id: quotation.id,
      project_id: quotation.project_id || null,
      client_name: project?.contractor?.name || quotation.project_name,
      items: proformaItems,
      subtotal: quotation.subtotal,
      tax_rate: quotation.tax.rate,
      tax_amount: taxAmount,
      total: quotation.total,
      valid_until: quotation.valid_until || null,
      status: 'draft',
      notes: `Generated from quotation ${getQuotationNumber()}`,
    });
    
    setIsCreatingProforma(false);
    setProformaDialogOpen(false);
    
    if (result) {
      toast({
        title: 'Proforma Invoice Created',
        description: `Proforma invoice ${result.proforma_number} has been created`,
      });
      navigate(`/proforma-invoices/${result.id}`);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);

    // TS WPC DOORS uses its own branded quotation layout
    if (company.name.toLowerCase().includes('wpc')) {
      const wpcPrefix = getCompanyPrefix(getSlugForId(quotation.company_id));
      buildWpcQuotationPdf(doc, {
        company,
        logo,
        attention: project?.contractor?.contact || 'N/A',
        quotationNo: `${wpcPrefix}-QT-${quotation.id.slice(0, 8).toUpperCase()}`,
        project: quotation.project_name,
        scopeOfWork: 'Supply of WPC Doors',
        location: project?.contractor?.address || 'Dubai, UAE',
        issueDate: new Date(quotation.created_at).toLocaleDateString('en-GB'),
        preparedBy: project?.salesManager || 'N/A',
        phoneNo: project?.contractor?.phone || company.phone || 'N/A',
        validity: quotation.valid_until
          ? new Date(quotation.valid_until).toLocaleDateString('en-GB')
          : '7 Days',
        items: quotation.items.map((item: any) => ({
          name: item.productName,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        subtotal: quotation.subtotal,
        taxRate: quotation.tax.rate,
        taxAmount,
        total: quotation.total,
        terms: [
          'Delivery terms: Delivery to site',
          'Delivery lag time from the date of LPO: 2-3 weeks from advance payment',
          'Payment terms: 50% advance | 50% prior delivery of material at site / collection from our warehouse',
          'Terms & Conditions:',
          `1. All products remain property of ${company.name} until paid in full.`,
          '2. Our offer excludes any civil work / electrical work / mechanical work / protection work, floor leveling & enablement works.',
          '3. The prices are on the basis of above mentioned quantities, any variation shall be subject to revise the commercial offer.',
          '4. Our cost of finance is 3% of the invoice value per month. Any payment not paid on the due date will be charged 3% per month.',
          '5. Upon confirmation of the order with advance payment, the order shall be deemed firm and non-cancellable.',
          '6. Our offer does not include the dismantling, removal, disposal or associated handling of any existing / previously installed doors at the site.',
        ],
      });
      drawDocumentFooter(doc, company, margin);
      return doc;
    }

    
    // Per-company header template (logo, contact block, offices, title)
    const metrics = drawPdfHeader(doc, {
      company,
      logo,
      title: 'QUOTATION',
      margin,
      detailsGap: 14,
      tableGap: 51,
    });

    // Two column info section - adjusted Y positions
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const leftColLabel = margin;
    const leftColValue = margin + 30;
    const rightColLabel = pageWidth / 2 + 5;
    const rightColValue = pageWidth / 2 + 35;
    const detailsY = metrics.detailsY;
    
    // Left column - adjusted Y positions for larger header
    doc.setFont('helvetica', 'bold');
    doc.text('Attention:', leftColLabel, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.contact || 'N/A', leftColValue, detailsY);

    doc.setFont('helvetica', 'bold');
    doc.text('Contractor:', leftColLabel, detailsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.name || 'N/A', leftColValue, detailsY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Project:', leftColLabel, detailsY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.project_name, leftColValue, detailsY + 14);

    doc.setFont('helvetica', 'bold');
    doc.text('Location:', leftColLabel, detailsY + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.address || 'Dubai, UAE', leftColValue, detailsY + 21);

    doc.setFont('helvetica', 'bold');
    doc.text('Scope of Work:', leftColLabel, detailsY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text('Supply of Building Materials', leftColValue + 5, detailsY + 28);

    // Right column - adjusted Y positions
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', rightColLabel, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(quotation.created_at).toLocaleDateString('en-GB'), rightColValue, detailsY);

    doc.setFont('helvetica', 'bold');
    doc.text('Prepared by:', rightColLabel, detailsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.salesManager || 'N/A', rightColValue, detailsY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Quotation No:', rightColLabel, detailsY + 14);
    doc.setFont('helvetica', 'normal');
    // Use company-prefixed quotation number
    const companyPrefix = getCompanyPrefix(getSlugForId(quotation.company_id));
    const quotationNo = `${companyPrefix}-QT-${quotation.id.slice(0, 8).toUpperCase()}`;
    doc.text(quotationNo, rightColValue, detailsY + 14);

    doc.setFont('helvetica', 'bold');
    doc.text('Phone No:', rightColLabel, detailsY + 21);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.phone || 'N/A', rightColValue, detailsY + 21);

    doc.setFont('helvetica', 'bold');
    doc.text('Quotation validity:', rightColLabel, detailsY + 28);
    doc.setFont('helvetica', 'normal');
    doc.text('30 Days', rightColValue, detailsY + 28);

    // Items table with proper column widths that fit the page
    const tableData = quotation.items.map((item, index) => [
      index + 1,
      (item.productName ?? "").toUpperCase(),
      (item.unit ?? "").toUpperCase(),
      item.quantity.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: metrics.tableStartY,
      head: [['S No', 'Description', 'Unit', 'Quantity', 'Unit Price', 'Amount']],
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
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 28, halign: 'right' }
      }
    });

    // Totals - aligned with table
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalsLabelX = pageWidth - margin - 70;
    const totalsValueX = pageWidth - margin;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Sub Total Amount (AED):', totalsLabelX, finalY);
    doc.text(quotation.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY, { align: 'right' });

    doc.text(`VAT ${quotation.tax.rate}%:`, totalsLabelX, finalY + 7);
    doc.text(taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 7, { align: 'right' });

    doc.setFontSize(10);
    doc.text('Total Payable Amount (AED):', totalsLabelX, finalY + 15);
    doc.text(quotation.total.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 15, { align: 'right' });

    // Additional terms
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Terms:', 15, finalY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text('Delivery to site.', 45, finalY + 30);

    doc.setFont('helvetica', 'bold');
    doc.text('Delivery Lag Time:', 15, finalY + 37);
    doc.setFont('helvetica', 'normal');
    doc.text('Material In Stock 01 Week Delivery Time', 55, finalY + 37);

    doc.setFont('helvetica', 'bold');
    doc.text('Payment Terms:', 15, finalY + 44);
    doc.setFont('helvetica', 'normal');
    doc.text('100% CDC Upon Material Delivery at Site', 45, finalY + 44);

    // Bank Details Section
    let bankY = finalY + 55;
    if (company.bankDetails && bankY < 250) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Bank Details for Payment', 15, bankY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      bankY += 7;
      doc.text(`Bank Name: ${company.bankDetails.bankName}`, 15, bankY);
      bankY += 5;
      doc.text(`Account Title: ${company.bankDetails.accountTitle}`, 15, bankY);
      bankY += 5;
      doc.text(`Account Number: ${company.bankDetails.accountNumber}`, 15, bankY);
      bankY += 5;
      doc.text(`IBAN: ${company.bankDetails.iban}`, 15, bankY);
      bankY += 5;
      doc.text(`Swift Code: ${company.bankDetails.swiftCode}`, 15, bankY);
      if (company.bankDetails.branch) {
        bankY += 5;
        doc.text(`Branch: ${company.bankDetails.branch}`, 15, bankY);
      }
      bankY += 10;
    } else {
      bankY = finalY + 55;
    }

    // Terms & Conditions
    if (bankY < 262) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Terms & Conditions', 15, bankY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const terms = [
        `1. Our offer excludes any civil work/electrical work/mechanical work/protection work, floor leveling & other enablement works.`,
        `2. All products remain property of ${company.name} until paid in full.`,
        '3. The prices are on the basis of above mentioned quantities, any variation shall subject to revise the commercial offer.',
        '4. Our cost of finance is 3% of the invoice value per month. Any payments that are not paid on the due date & or late payment, charges of 3% per month will be charged.'
      ];
      
      let yPos = bankY + 7;
      terms.forEach(term => {
        const lines = doc.splitTextToSize(term, 180);
        doc.text(lines, 15, yPos);
        yPos += lines.length * 5;
      });
    }

    drawDocumentFooter(doc, company, margin);

    return doc;
  };

  // Generate quotation number with company prefix
  const getQuotationNumber = () => {
    const companyPrefix = getCompanyPrefix(getSlugForId(quotation.company_id));
    return `${companyPrefix}-QT-${quotation.id.slice(0, 8).toUpperCase()}`;
  };

  const quotationNumber = getQuotationNumber();

  const handleExportPDF = async () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const filename = `${quotationNumber}.pdf`;
    
    // Try to use File System Access API for save-as dialog
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
        toast({
          title: 'Success',
          description: `PDF saved successfully`,
        });
        return;
      } catch (err: any) {
        // User cancelled or API not supported - fall back to download
        if (err.name === 'AbortError') return;
      }
    }
    // Fallback for browsers without File System Access API
    doc.save(filename);
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const handleOpenPreview = () => {
    const doc = generatePDF();
    const url = URL.createObjectURL(doc.output('blob'));
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleDownloadPreview = () => {
    generatePDF().save(`${quotationNumber}-preview.pdf`);
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
    if (!quotation) return;
    
    setSharingWhatsApp(true);
    try {
      // Generate and upload PDF with short URL
      const doc = generatePDF();
      const pdfBlob = doc.output('blob');
      const pdfUrl = await uploadPdfForSharing(pdfBlob, quotationNumber, 'Quotation');
      
      const message = encodeURIComponent(
        `Dear ${project?.contractor?.name || quotation.project_name},\n\n` +
        `Please find your Quotation details:\n\n` +
        `📄 Quotation No: ${quotationNumber}\n` +
        `💰 Total Amount: AED ${quotation.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
        `📅 Valid Until: ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString('en-GB') : '30 Days'}\n` +
        `${pdfUrl ? `\n📎 Download PDF: ${pdfUrl}\n` : ''}` +
        `\nPlease contact us if you have any questions.\n\n` +
        `Best regards,\n${company.name}`
      );
      
      const clientPhone = project?.contractor?.phone || '';
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

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="p-4 sm:p-6">

          <Breadcrumb 
            items={[
              { label: 'Projects', href: '/projects' },
              { label: quotation.project_name, href: quotation.project_id ? `/projects/${quotation.project_id}` : undefined },
              { label: quotationNumber }
            ]} 
            className="mb-4"
          />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-all">{quotationNumber}</h1>
                <StatusBadge status={quotation.status as any} />
              </div>
              <p className="text-muted-foreground mt-1 break-words">{quotation.project_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end [&_button]:min-h-11 [&_button]:w-full sm:[&_button]:w-auto">

              {canEdit && (
                <>
                  <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              {(quotation.status === 'approved' || quotation.status === 'submitted') && (
                <>
                  <Button variant="outline" onClick={handleOpenDeliveryDialog}>
                    <Truck className="h-4 w-4 mr-2" />
                    Generate Delivery Order
                  </Button>
                  <Button variant="outline" onClick={() => setProformaDialogOpen(true)}>
                    <Receipt className="h-4 w-4 mr-2" />
                    Create Proforma Invoice
                  </Button>
                </>
              )}
              <Button 
                variant="outline" 
                onClick={handleWhatsAppShare}
                disabled={sharingWhatsApp}
                className="text-success hover:text-success"
              >
                {sharingWhatsApp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                WhatsApp
              </Button>
              <Button variant="outline" onClick={handleOpenPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview PDF
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

      {/* Quotation Preview */}
      <div className="p-4 sm:p-6">
        <Card className="max-w-5xl mx-auto print-container">
          {/* Company Header */}
          <div className="p-4 sm:p-8 border-b bg-gradient-to-br from-primary/5 to-accent/5 print-header print-no-break">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 mb-6">
              <div className="print-logo-container bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-border/30 flex items-center justify-center" style={{ minWidth: '120px', minHeight: '60px' }}>
                <img 
                  src={logo} 
                  alt={company.name} 
                  className="print-logo max-h-14 sm:max-h-16 max-w-[140px] sm:max-w-[160px] object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="text-center sm:text-right text-xs sm:text-sm text-muted-foreground break-words">
                <p className="font-semibold text-foreground text-base sm:text-lg">{company.name}</p>
                {company.address && <p className="mt-1">{company.address}</p>}
                {company.email && <p className="mt-2 break-all">Email: {company.email}</p>}
                {company.website && <p className="break-all">Web: {company.website}</p>}
                {company.phone && <p className="mt-2">Contact: {company.phone}</p>}
                <SecondaryOfficeBlock company={company} />
              </div>
            </div>

            
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                QUOTATION
              </h2>
            </div>

          </div>

          {/* Details Section */}
          <div className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Attention:</p>
                <p className="text-sm text-foreground">{project?.contractor?.contact || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Contractor:</p>
                <p className="text-sm text-foreground">{project?.contractor?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Project:</p>
                <p className="text-sm text-foreground font-semibold">{quotation.project_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Location:</p>
                <p className="text-sm text-foreground">{project?.contractor?.address || 'Dubai, UAE'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Scope of Work:</p>
                <p className="text-sm text-foreground">Supply of Building Materials</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Issue Date:</p>
                <p className="text-sm text-foreground">{new Date(quotation.created_at).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Prepared by:</p>
                <p className="text-sm text-foreground">{project?.salesManager || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Quotation No:</p>
                <p className="text-sm text-foreground font-mono font-semibold">{quotationNumber}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Phone No:</p>
                <p className="text-sm text-foreground">{project?.contractor?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Quotation validity:</p>
                <p className="text-sm text-foreground">30 Days</p>
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
                    <th className="px-4 py-3 text-center text-xs font-semibold">Unit</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={item.productId} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{(item.productName ?? "").toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-center">{(item.unit ?? "").toUpperCase()}</td>
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
          <div className="p-4 sm:p-8 border-b bg-muted/30">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">Sub Total Amount (AED):</span>
                <span className="font-mono">{quotation.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">VAT {quotation.tax.rate}%:</span>
                <span className="font-mono">{taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total Payable Amount (AED):</span>
                <span className="font-mono text-primary">{quotation.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="p-4 sm:p-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-1">Delivery Terms:</p>
                <p className="text-muted-foreground">Delivery to site.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Delivery Lag Time:</p>
                <p className="text-muted-foreground">Material In Stock 01 Week Delivery Time</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Payment Terms:</p>
                <p className="text-muted-foreground">100% CDC Upon Material Delivery at Site</p>
              </div>
            </div>

            {/* Bank Details */}
            {company.bankDetails && (
              <div className="pt-6 border-t">
                <h3 className="font-bold text-foreground mb-3">Bank Details for Payment</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Bank Name</p>
                    <p className="font-medium">{company.bankDetails.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Title</p>
                    <p className="font-medium">{company.bankDetails.accountTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-medium font-mono">{company.bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="font-medium font-mono">{company.bankDetails.iban}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Swift Code</p>
                    <p className="font-medium font-mono">{company.bankDetails.swiftCode}</p>
                  </div>
                  {company.bankDetails.branch && (
                    <div>
                      <p className="text-xs text-muted-foreground">Branch</p>
                      <p className="font-medium">{company.bankDetails.branch}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 border-t">
              <h3 className="font-bold text-foreground mb-3">Terms & Conditions</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>1. Our offer excludes any civil work/electrical work/mechanical work/protection work, floor leveling & other enablement works.</p>
                <p>2. All products remain property of {company.name} until paid in full.</p>
                <p>3. The prices are on the basis of above mentioned quantities, any variation shall subject to revise the commercial offer.</p>
                <p>4. Our cost of finance is 3% of the invoice value per month. Any payments that are not paid on the due date & or late payment, charges of 3% per month will be charged to cover our finance costs.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Delivery Order Dialog */}
      <Dialog open={deliveryDialogOpen} onOpenChange={setDeliveryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Delivery Order from Quotation</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adjust delivery quantities below. You can deliver partial quantities if the client requested partial material.
            </p>
            
            <div className="space-y-3">
              {deliveryItems.map((item, index) => (
                <Card key={item.productId}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-sm text-muted-foreground">{item.unit}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Ordered Quantity</Label>
                        <Input value={item.orderedQuantity} readOnly className="bg-muted" />
                      </div>
                      <div>
                        <Label className="text-xs">Delivering Quantity</Label>
                        <Input 
                          type="number"
                          value={item.deliveryQuantity}
                          onChange={(e) => {
                            const newItems = [...deliveryItems];
                            newItems[index].deliveryQuantity = Math.min(
                              parseFloat(e.target.value) || 0,
                              item.orderedQuantity
                            );
                            setDeliveryItems(newItems);
                          }}
                          max={item.orderedQuantity}
                        />
                      </div>
                    </div>
                    {item.deliveryQuantity < item.orderedQuantity && (
                      <p className="text-xs text-warning mt-2">
                        Partial delivery: {item.deliveryQuantity} of {item.orderedQuantity} {item.unit}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliveryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeliveryOrder}>
              <Truck className="h-4 w-4 mr-2" />
              Create Delivery Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - pass converted quotation type */}
      <QuotationFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        quotation={quotation ? {
          id: quotation.id,
          projectId: quotation.project_id || '',
          projectName: quotation.project_name,
          companyId: quotation.company_id || '',
          items: quotation.items.map((item, idx) => ({
            id: item.productId || String(idx),
            productId: item.productId,
            productName: item.productName,
            category: item.category as any,
            unit: item.unit as any,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            margin: item.margin,
            total: item.total,
          })),
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          tax: quotation.tax,
          total: quotation.total,
          status: quotation.status as 'draft' | 'submitted' | 'approved' | 'rejected',
          validUntil: quotation.valid_until || '',
          version: quotation.version,
          createdAt: quotation.created_at,
          updatedAt: quotation.updated_at,
        } : undefined}
        onSubmit={handleUpdateQuotation}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete quotation {quotationNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuotation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Proforma Invoice Confirmation Dialog */}
      <AlertDialog open={proformaDialogOpen} onOpenChange={setProformaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Proforma Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a proforma invoice from quotation {quotationNumber} with all items and pricing. 
              The proforma invoice can be shared with the customer before the final tax invoice is issued.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Client</p>
                <p className="font-medium">{project?.contractor?.name || quotation?.project_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-medium">AED {quotation?.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Items</p>
                <p className="font-medium">{quotation?.items.length} item(s)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax Rate</p>
                <p className="font-medium">{quotation?.tax.rate}% VAT</p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreatingProforma}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateProformaInvoice}
              disabled={isCreatingProforma}
            >
              {isCreatingProforma ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Create Proforma Invoice
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF preview */}
      <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) closePreview(); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Preview — {quotationNumber}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <iframe
              src={previewUrl}
              title={`Quotation ${quotationNumber} preview`}
              className="w-full h-[60vh] rounded-md border border-border bg-muted"
            />
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="min-h-11" onClick={handleDownloadPreview}>
              <Download className="h-4 w-4 mr-2" />
              Download preview
            </Button>
            <Button className="min-h-11" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </MainLayout>

  );
}
