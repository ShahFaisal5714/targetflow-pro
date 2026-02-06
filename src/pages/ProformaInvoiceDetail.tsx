import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Printer, Loader2 } from 'lucide-react';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { useProformaInvoices } from '@/hooks/useProformaInvoices';
import { useProjects } from '@/hooks/useProjects';
import { useCompanies, TARGET_SPECIALTIES, ALHADAF_PROJECTS, Company } from '@/hooks/useCompanies';
import StatusBadge from '@/components/shared/StatusBadge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import targetLogo from '@/assets/target-logo.jpg';
import alhadafLogo from '@/assets/alhadaf-logo.png';

export default function ProformaInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { proformaInvoices, loading: proformaLoading } = useProformaInvoices();
  const { projects, loading: projectsLoading } = useProjects();
  const { activeCompanyId, alhadafCompany, loading: companiesLoading } = useCompanies();

  const proforma = proformaInvoices.find(pi => pi.id === id);
  const project = proforma ? projects.find(p => p.id === proforma.project_id) : null;

  const getProformaCompany = (): { company: Company; logo: string } => {
    const proformaCompanyId = proforma?.company_id;
    
    if (proformaCompanyId === 'alhadaf-projects' || 
        (proformaCompanyId && proformaCompanyId !== 'target-specialties')) {
      return { 
        company: { ...ALHADAF_PROJECTS, ...alhadafCompany },
        logo: alhadafLogo 
      };
    }
    
    if (proformaCompanyId === 'target-specialties') {
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
    
    // Add logo
    const img = new Image();
    img.src = logo;
    const isAlhadaf = company.name.toLowerCase().includes('hadaf');
    const logoWidth = isAlhadaf ? 65 : 55;
    const logoHeight = isAlhadaf ? 42 : 35;
    doc.addImage(img, 'PNG', margin, 8, logoWidth, logoHeight);

    // Company Header
    const rightAlignX = pageWidth - margin;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(company.name, rightAlignX, 15, { align: 'right' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(company.address || '', rightAlignX, 22, { align: 'right' });
    doc.text(`Email: ${company.email || 'N/A'}`, rightAlignX, 29, { align: 'right' });
    doc.text(`Web: ${company.website || 'N/A'}`, rightAlignX, 36, { align: 'right' });
    doc.text(`Contact No: ${company.phone || 'N/A'}`, rightAlignX, 43, { align: 'right' });
    if (company.taxInfo?.trn) {
      doc.text(`TRN: ${company.taxInfo.trn}`, rightAlignX, 50, { align: 'right' });
    }

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('PROFORMA INVOICE', pageWidth / 2, 58, { align: 'center' });

    // Details - Centered layout
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const centerX = pageWidth / 2;
    const colGap = 70;
    const leftColLabel = centerX - colGap;
    const leftColValue = centerX - colGap + 25;
    const rightColLabel = centerX + 10;
    const rightColValue = centerX + 10 + 25;
    
    let detailsY = 68;
    
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
    const tableStartY = 95;
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
            <div className="flex gap-2">
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
          <div className="p-8 border-b bg-gradient-to-br from-primary/5 to-accent/5">
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
          <div className="p-8 border-b flex justify-center">
            <div className="grid grid-cols-2 gap-x-16 gap-y-3">
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
          <div className="p-8">
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
    </MainLayout>
  );
}
