import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Printer, Loader2 } from 'lucide-react';
import { useQuotations } from '@/hooks/useQuotations';
import { useProjects } from '@/hooks/useProjects';
import { useCompanies, TARGET_SPECIALTIES, ALHADAF_PROJECTS, Company } from '@/hooks/useCompanies';
import StatusBadge from '@/components/shared/StatusBadge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import targetLogo from '@/assets/target-logo.jpg';
import alhadafLogo from '@/assets/alhadaf-logo.png';

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quotations, loading: quotationsLoading } = useQuotations();
  const { projects, loading: projectsLoading } = useProjects();
  const { activeCompanyId, alhadafCompany, loading: companiesLoading } = useCompanies();
  
  const quotation = quotations.find(q => q.id === id);
  const project = quotation ? projects.find(p => p.id === quotation.project_id) : null;

  // Determine which company to use for this quotation
  // Priority: quotation's company_id > active company
  const getQuotationCompany = (): { company: Company; logo: string } => {
    const quotationCompanyId = quotation?.company_id;
    
    // Check if quotation has a specific company assigned
    if (quotationCompanyId === 'alhadaf-projects' || 
        (quotationCompanyId && quotationCompanyId !== 'target-specialties')) {
      return { 
        company: { ...ALHADAF_PROJECTS, ...alhadafCompany },
        logo: alhadafLogo 
      };
    }
    
    if (quotationCompanyId === 'target-specialties') {
      return { company: TARGET_SPECIALTIES, logo: targetLogo };
    }
    
    // Fall back to active company
    if (activeCompanyId === 'alhadaf-projects') {
      return { 
        company: { ...ALHADAF_PROJECTS, ...alhadafCompany },
        logo: alhadafLogo 
      };
    }
    
    return { company: TARGET_SPECIALTIES, logo: targetLogo };
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

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add logo - larger and more visible
    const img = new Image();
    img.src = logo;
    doc.addImage(img, 'PNG', margin, 8, 50, 30);

    // Company Header - positioned to the right of logo
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

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('QUOTATION', pageWidth / 2, 45, { align: 'center' });

    // Two column info section
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const leftColLabel = margin;
    const leftColValue = margin + 30;
    const rightColLabel = pageWidth / 2 + 5;
    const rightColValue = pageWidth / 2 + 35;
    
    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Attention:', leftColLabel, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.contact || 'N/A', leftColValue, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('Contractor:', leftColLabel, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.name || 'N/A', leftColValue, 65);

    doc.setFont('helvetica', 'bold');
    doc.text('Project:', leftColLabel, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.project_name, leftColValue, 72);

    doc.setFont('helvetica', 'bold');
    doc.text('Location:', leftColLabel, 79);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.address || 'Dubai, UAE', leftColValue, 79);

    doc.setFont('helvetica', 'bold');
    doc.text('Scope of Work:', leftColLabel, 86);
    doc.setFont('helvetica', 'normal');
    doc.text('Supply of Building Materials', leftColValue + 5, 86);

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', rightColLabel, 58);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(quotation.created_at).toLocaleDateString('en-GB'), rightColValue, 58);

    doc.setFont('helvetica', 'bold');
    doc.text('Prepared by:', rightColLabel, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.salesManager || 'N/A', rightColValue, 65);

    doc.setFont('helvetica', 'bold');
    doc.text('Quotation No:', rightColLabel, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.id, rightColValue, 72);

    doc.setFont('helvetica', 'bold');
    doc.text('Phone No:', rightColLabel, 79);
    doc.setFont('helvetica', 'normal');
    doc.text(project?.contractor?.phone || 'N/A', rightColValue, 79);

    doc.setFont('helvetica', 'bold');
    doc.text('Quotation validity:', rightColLabel, 86);
    doc.setFont('helvetica', 'normal');
    doc.text('30 Days', rightColValue, 86);

    // Items table with proper column widths that fit the page
    const tableData = quotation.items.map((item, index) => [
      index + 1,
      item.productName.toUpperCase(),
      item.unit.toUpperCase(),
      item.quantity.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: 95,
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

    // Terms & Conditions
    if (finalY + 60 < 270) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Terms & Conditions', 15, finalY + 55);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const terms = [
        `1. Our offer excludes any civil work/electrical work/mechanical work/protection work, floor leveling & other enablement works.`,
        `2. All products remain property of ${company.name} until paid in full.`,
        '3. The prices are on the basis of above mentioned quantities, any variation shall subject to revise the commercial offer.',
        '4. Our cost of finance is 3% of the invoice value per month. Any payments that are not paid on the due date & or late payment, charges of 3% per month will be charged.'
      ];
      
      let yPos = finalY + 62;
      terms.forEach(term => {
        const lines = doc.splitTextToSize(term, 180);
        doc.text(lines, 15, yPos);
        yPos += lines.length * 5;
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{quotation.id}</h1>
                <StatusBadge status={quotation.status as any} />
              </div>
              <p className="text-muted-foreground mt-1">{quotation.project_name}</p>
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

      {/* Quotation Preview */}
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
                  style={{ width: 'auto', height: 'auto' }}
                />
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p className="font-semibold text-foreground text-lg">{company.name}</p>
                {company.address && <p className="mt-1">{company.address}</p>}
                {company.email && <p className="mt-2">Email: {company.email}</p>}
                {company.website && <p>Web: {company.website}</p>}
                {company.phone && <p className="mt-2">Contact: {company.phone}</p>}
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                QUOTATION
              </h2>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 grid grid-cols-2 gap-8 border-b">
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
                <p className="text-sm text-foreground font-mono font-semibold">{quotation.id}</p>
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
          <div className="p-8 border-b">
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
                      <td className="px-4 py-3 text-sm font-medium">{item.productName.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.unit.toUpperCase()}</td>
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
          <div className="p-8 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
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
    </MainLayout>
  );
}
