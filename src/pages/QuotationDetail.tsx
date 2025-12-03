import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react';
import { mockQuotations, mockProjects } from '@/data/mockData';
import StatusBadge from '@/components/shared/StatusBadge';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import targetLogo from '@/assets/target-logo.jpg';

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const quotation = mockQuotations.find(q => q.id === id);
  const project = quotation ? mockProjects.find(p => p.id === quotation.projectId) : null;

  if (!quotation || !project) {
    return (
      <MainLayout>
        <div className="p-6">
          <p>Quotation not found</p>
        </div>
      </MainLayout>
    );
  }

  const discountAmount = quotation.discount.type === 'percentage'
    ? (quotation.subtotal * quotation.discount.value) / 100
    : quotation.discount.value;

  const afterDiscount = quotation.subtotal - discountAmount;
  const taxAmount = (afterDiscount * quotation.tax.rate) / 100;

  const handlePrintPDF = () => {
    const doc = new jsPDF();
    
    // Add logo
    const img = new Image();
    img.src = targetLogo;
    doc.addImage(img, 'JPEG', 15, 10, 40, 15);

    // Company Header
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text('TARGET SPECIALTIES', 105, 15, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Building Rema plaza | Office no. 1 Aljurf 3 Ajman UAE', 105, 20, { align: 'center' });
    doc.text('Email: Info@targetspecialties.com | Web: targetspecialties.com', 105, 25, { align: 'center' });
    doc.text('Contact No: +971 50 958 7185', 105, 30, { align: 'center' });

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('QUOTATION', 105, 45, { align: 'center' });

    // Two column info section
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Attention:', 15, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(project.contractor.contact, 45, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Contractor:', 15, 67);
    doc.setFont('helvetica', 'normal');
    doc.text(project.contractor.name, 45, 67);

    doc.setFont('helvetica', 'bold');
    doc.text('Project:', 15, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(project.name, 45, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('Location:', 15, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(project.contractor.address || 'Dubai, UAE', 45, 81);

    doc.setFont('helvetica', 'bold');
    doc.text('Scope of Work:', 15, 88);
    doc.setFont('helvetica', 'normal');
    doc.text('Supply of Building Materials', 45, 88);

    // Right column
    doc.setFont('helvetica', 'bold');
    doc.text('Issue Date:', 115, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(quotation.createdAt).toLocaleDateString('en-GB'), 155, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('Prepared by:', 115, 67);
    doc.setFont('helvetica', 'normal');
    doc.text(project.salesManager, 155, 67);

    doc.setFont('helvetica', 'bold');
    doc.text('Quotation No:', 115, 74);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.id, 155, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('Phone No:', 115, 81);
    doc.setFont('helvetica', 'normal');
    doc.text(project.contractor.phone, 155, 81);

    doc.setFont('helvetica', 'bold');
    doc.text('Quotation validity:', 115, 88);
    doc.setFont('helvetica', 'normal');
    doc.text('30 Days', 155, 88);

    // Items table
    const tableData = quotation.items.map((item, index) => [
      index + 1,
      item.productName.toUpperCase(),
      item.unit.toUpperCase(),
      '-',
      item.quantity.toFixed(2),
      item.unitPrice.toFixed(2),
      item.total.toFixed(2)
    ]);

    autoTable(doc, {
      startY: 100,
      head: [['S No', 'Description', 'Unit', 'Drawing Ref.', 'Quantity', 'Unit Price', 'Amount']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 98, 255], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 70 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 25 }
      }
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Sub Total Amount (AED):', 120, finalY);
    doc.text(quotation.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), 185, finalY, { align: 'right' });

    doc.text(`VAT ${quotation.tax.rate}%:`, 120, finalY + 7);
    doc.text(taxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }), 185, finalY + 7, { align: 'right' });

    doc.setFontSize(11);
    doc.text('Total Payable Amount (AED):', 120, finalY + 15);
    doc.text(quotation.total.toLocaleString('en-US', { minimumFractionDigits: 2 }), 185, finalY + 15, { align: 'right' });

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
        '1. Our offer excludes any civil work/electrical work/mechanical work/protection work, floor leveling & other enablement works.',
        '2. All products remain property of Target Specialties until paid in full.',
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

    // Save PDF
    doc.save(`Quotation_${quotation.id}_${project.name.replace(/\s+/g, '_')}.pdf`);
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
                <StatusBadge status={quotation.status} />
              </div>
              <p className="text-muted-foreground mt-1">{project.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrintPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button onClick={handlePrintPDF}>
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
              <img src={targetLogo} alt="Target Specialties" className="h-20 w-auto object-contain" />
              <div className="text-right text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">TARGET SPECIALTIES</p>
                <p>Building Rema plaza | Office no. 1</p>
                <p>Aljurf 3 Ajman UAE</p>
                <p className="mt-2">Email: Info@targetspecialties.com</p>
                <p>Web: targetspecialties.com</p>
                <p className="mt-2">Contact: +971 50 958 7185</p>
                <p></p>
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
                <p className="text-sm text-foreground">{project.contractor.contact}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Contractor:</p>
                <p className="text-sm text-foreground">{project.contractor.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Project:</p>
                <p className="text-sm text-foreground font-semibold">{project.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Location:</p>
                <p className="text-sm text-foreground">{project.contractor.address || 'Dubai, UAE'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Scope of Work:</p>
                <p className="text-sm text-foreground">Supply of Building Materials</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Issue Date:</p>
                <p className="text-sm text-foreground">{new Date(quotation.createdAt).toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Prepared by:</p>
                <p className="text-sm text-foreground">{project.salesManager}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Quotation No:</p>
                <p className="text-sm text-foreground font-mono font-semibold">{quotation.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Phone No:</p>
                <p className="text-sm text-foreground">{project.contractor.phone}</p>
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
                    <th className="px-4 py-3 text-center text-xs font-semibold">Drawing Ref.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Quantity</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{item.productName.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-center">{item.unit.toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm text-center text-muted-foreground">-</td>
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
                <p>2. All products remain property of Target Specialties until paid in full.</p>
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
