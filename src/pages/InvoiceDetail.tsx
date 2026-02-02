import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Download, FileText, Printer, Loader2, CreditCard } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { useCompanies, TARGET_SPECIALTIES, ALHADAF_PROJECTS, Company } from '@/hooks/useCompanies';
import StatusBadge from '@/components/shared/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import targetLogo from '@/assets/target-logo.jpg';
import alhadafLogo from '@/assets/alhadaf-logo.png';
import { INVOICE_TERMS } from '@/data/invoiceTerms';
import { useCustomInvoiceTerms } from '@/hooks/useCustomInvoiceTerms';
export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, loading: invoicesLoading, recordPayment } = useInvoices();
  const { projects, loading: projectsLoading } = useProjects();
  const { activeCompanyId, alhadafCompany, loading: companiesLoading } = useCompanies();
  const { customTerms } = useCustomInvoiceTerms();
  
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);

  const invoice = invoices.find(inv => inv.id === id);
  const project = invoice ? projects.find(p => p.id === invoice.project_id) : null;

  // Get selected terms text for display/PDF
  const selectedTermsText = useMemo(() => {
    if (!invoice?.terms_conditions) return [];
    return invoice.terms_conditions.map(termId => {
      // Check if it's a custom term
      if (termId.startsWith('custom-')) {
        const customId = termId.replace('custom-', '');
        const customTerm = customTerms.find(t => t.id === customId);
        return customTerm?.text || null;
      }
      // Otherwise it's a predefined term
      const predefinedTerm = INVOICE_TERMS.find(t => t.id === termId);
      return predefinedTerm?.text || null;
    }).filter(Boolean) as string[];
  }, [invoice?.terms_conditions, customTerms]);

  const getInvoiceCompany = (): { company: Company; logo: string } => {
    const invoiceCompanyId = invoice?.company_id;
    
    if (invoiceCompanyId === 'alhadaf-projects' || 
        (invoiceCompanyId && invoiceCompanyId !== 'target-specialties')) {
      return { 
        company: { ...ALHADAF_PROJECTS, ...alhadafCompany },
        logo: alhadafLogo 
      };
    }
    
    if (invoiceCompanyId === 'target-specialties') {
      return { company: TARGET_SPECIALTIES, logo: targetLogo };
    }
    
    if (activeCompanyId === 'alhadaf-projects') {
      return { 
        company: { ...ALHADAF_PROJECTS, ...alhadafCompany },
        logo: alhadafLogo 
      };
    }
    
    return { company: TARGET_SPECIALTIES, logo: targetLogo };
  };

  if (invoicesLoading || projectsLoading || companiesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!invoice) {
    return (
      <MainLayout>
        <div className="p-6">
          <p>Invoice not found</p>
        </div>
      </MainLayout>
    );
  }

  const { company, logo } = getInvoiceCompany();
  const outstandingAmount = invoice.total - invoice.paid_amount;
  const paymentProgress = invoice.total > 0 ? (invoice.paid_amount / invoice.total) * 100 : 0;

  const handleRecordPayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setRecordingPayment(true);
    await recordPayment(invoice.id, amount);
    setRecordingPayment(false);
    setPaymentDialogOpen(false);
    setPaymentAmount('');
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add logo
    const img = new Image();
    img.src = logo;
    doc.addImage(img, 'PNG', margin, 8, 50, 30);

    // Company Header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(company.name, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(company.address || '', pageWidth / 2, 21, { align: 'center' });
    doc.text(`Email: ${company.email || 'N/A'} | Web: ${company.website || 'N/A'}`, pageWidth / 2, 26, { align: 'center' });
    doc.text(`Contact No: ${company.phone || 'N/A'}`, pageWidth / 2, 31, { align: 'center' });
    if (company.taxInfo?.trn) {
      doc.setFont('helvetica', 'bold');
      doc.text(`TRN: ${company.taxInfo.trn}`, pageWidth / 2, 36, { align: 'center' });
    }

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TAX INVOICE', pageWidth / 2, 48, { align: 'center' });

    // Invoice details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const leftColLabel = margin;
    const leftColValue = margin + 30;
    const rightColLabel = pageWidth / 2 + 5;
    const rightColValue = pageWidth / 2 + 35;
    
    let detailsY = 60;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No:', leftColLabel, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, leftColValue, detailsY);

    doc.setFont('helvetica', 'bold');
    doc.text('Client:', leftColLabel, detailsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.client_name, leftColValue, detailsY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Project:', leftColLabel, detailsY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.name || 'N/A', leftColValue, detailsY + 14);

    // Buyer TRN
    const buyerTrn = (project as any)?.buyerTrn;
    if (buyerTrn) {
      doc.setFont('helvetica', 'bold');
      doc.text('Buyer TRN:', leftColLabel, detailsY + 21);
      doc.setFont('helvetica', 'normal');
      doc.text(buyerTrn, leftColValue, detailsY + 21);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', rightColLabel, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.created_at).toLocaleDateString('en-GB'), rightColValue, detailsY);

    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', rightColLabel, detailsY + 7);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : 'N/A', rightColValue, detailsY + 7);

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', rightColLabel, detailsY + 14);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.status.toUpperCase(), rightColValue, detailsY + 14);

    // Items table
    const tableStartY = buyerTrn ? 90 : 85;
    const tableData = invoice.items.map((item, index) => [
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
    doc.text(invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY, { align: 'right' });

    doc.text(`VAT ${invoice.tax_rate}%:`, totalsLabelX, finalY + 7);
    doc.text(invoice.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 7, { align: 'right' });

    doc.setFontSize(10);
    doc.text('Total Amount (AED):', totalsLabelX, finalY + 15);
    doc.text(invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 15, { align: 'right' });

    doc.text('Paid Amount (AED):', totalsLabelX, finalY + 23);
    doc.text(invoice.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 23, { align: 'right' });

    doc.setFontSize(11);
    doc.setTextColor(220, 53, 69);
    doc.text('Outstanding (AED):', totalsLabelX, finalY + 32);
    doc.text(outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }), totalsValueX, finalY + 32, { align: 'right' });

    // Terms & Conditions
    if (selectedTermsText.length > 0) {
      let termsY = finalY + 50;
      
      // Check if we need a new page
      const pageHeight = doc.internal.pageSize.getHeight();
      if (termsY + (selectedTermsText.length * 5) + 20 > pageHeight - 20) {
        doc.addPage();
        termsY = 20;
      }
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', margin, termsY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      
      selectedTermsText.forEach((term, index) => {
        const termY = termsY + 8 + (index * 6);
        // Wrap long text
        const splitText = doc.splitTextToSize(`${index + 1}. ${term}`, contentWidth);
        doc.text(splitText, margin, termY);
      });
    }

    return doc;
  };

  const handleExportPDF = () => {
    const doc = generatePDF();
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
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

  return (
    <MainLayout>
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/invoices')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{invoice.invoice_number}</h1>
                <StatusBadge status={invoice.status as any} />
              </div>
              <p className="text-muted-foreground mt-1">{invoice.client_name}</p>
            </div>
            <div className="flex gap-2">
              {invoice.status !== 'paid' && (
                <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Record Payment
                </Button>
              )}
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

      {/* Invoice Preview */}
      <div className="p-6">
        <Card className="max-w-5xl mx-auto">
          {/* Company Header */}
          <div className="p-8 border-b bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-start justify-between mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm border border-border/30 flex items-center justify-center" style={{ minWidth: '120px', minHeight: '60px' }}>
                <img 
                  src={logo} 
                  alt={company.name} 
                  className="max-h-16 max-w-[160px] object-contain"
                />
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p className="font-semibold text-foreground text-lg">{company.name}</p>
                {company.address && <p className="mt-1">{company.address}</p>}
                {company.email && <p className="mt-2">Email: {company.email}</p>}
                {company.website && <p>Web: {company.website}</p>}
                {company.phone && <p className="mt-2">Contact: {company.phone}</p>}
                {company.taxInfo?.trn && (
                  <p className="mt-2 font-semibold text-foreground">TRN: {company.taxInfo.trn}</p>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                TAX INVOICE
              </h2>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 grid grid-cols-2 gap-8 border-b">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Invoice Number:</p>
                <p className="text-sm text-foreground font-mono font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Client:</p>
                <p className="text-sm text-foreground">{invoice.client_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Project:</p>
                <p className="text-sm text-foreground font-semibold">{project?.name || 'N/A'}</p>
              </div>
              {(project as any)?.buyerTrn && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Buyer TRN:</p>
                  <p className="text-sm text-foreground font-semibold">{(project as any).buyerTrn}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Issue Date:</p>
                <p className="text-sm text-foreground">{new Date(invoice.created_at).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Due Date:</p>
                <p className="text-sm text-foreground">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-GB') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Status:</p>
                <StatusBadge status={invoice.status as any} />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-8 border-b">
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
                  {invoice.items.map((item, index) => (
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
          <div className="p-8 border-b bg-muted/30">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">AED {invoice.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT ({invoice.tax_rate}%)</span>
                <span className="font-medium">AED {invoice.tax_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total</span>
                <span>AED {invoice.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          {invoice.terms_conditions && invoice.terms_conditions.length > 0 && (
            <div className="p-8 border-b">
              <h3 className="font-bold text-foreground mb-3">Terms & Conditions</h3>
              <div className="space-y-2 text-xs text-muted-foreground">
                {invoice.terms_conditions.map((termId, index) => {
                  const term = INVOICE_TERMS.find(t => t.id === termId);
                  if (!term) return null;
                  return (
                    <p key={termId}>{index + 1}. {term.text}</p>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Status */}
          <div className="p-8">
            <h3 className="font-semibold mb-4">Payment Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Paid Amount</span>
                <span className="font-semibold text-green-600">AED {invoice.paid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-semibold text-destructive">AED {outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-primary h-3 rounded-full transition-all"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">{paymentProgress.toFixed(1)}% Paid</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Outstanding Amount</Label>
              <p className="text-2xl font-bold text-destructive">AED {outstandingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount (AED)</Label>
              <Input 
                id="paymentAmount"
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordingPayment}>
              {recordingPayment && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
