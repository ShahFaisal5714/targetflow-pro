import type jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import qrcode from 'qrcode-generator';
import type { Company } from '@/contexts/CompaniesContext';

/**
 * TS WPC DOORS quotation layout.
 *
 * Mirrors the printed WPC quotation format: branded header bar, boxed details
 * grid, dark items table with multi-line door descriptions, stacked
 * subtotal/VAT/total rows, terms & conditions block and a fixed
 * QR-code + signature footer area.
 */

export interface WpcQuotationItem {
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface WpcQuotationData {
  company: Company;
  logo: string;
  attention: string;
  quotationNo: string;
  project: string;
  scopeOfWork: string;
  location: string;
  issueDate: string;
  preparedBy: string;
  phoneNo: string;
  validity: string;
  items: WpcQuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  terms?: string[];
  /** Optional custom QR payload; defaults to a quotation summary line. */
  qrData?: string;
}

const DARK: [number, number, number] = [46, 46, 46];
const ACCENT: [number, number, number] = [138, 96, 48];
const TITLE: [number, number, number] = [214, 130, 34];

const money = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Draws a QR code as vector rectangles (no raster image needed). */
const drawQrCode = (doc: jsPDF, text: string, x: number, y: number, size: number) => {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const cell = size / count;
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, 'F');
  doc.setFillColor(0, 0, 0);
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        doc.rect(x + c * cell, y + r * cell, cell, cell, 'F');
      }
    }
  }
};


export const buildWpcQuotationPdf = (doc: jsPDF, data: WpcQuotationData): void => {
  const { company } = data;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // ---- Brand header ---------------------------------------------------
  let logoInput: unknown = data.logo;
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.src = data.logo;
    logoInput = img;
  }
  doc.addImage(logoInput as HTMLImageElement, 'PNG', margin, 8, 26, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...DARK);
  doc.text(company.name.toUpperCase(), pageWidth - margin, 17, { align: 'right' });
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(...ACCENT);
  doc.text('Waterproof Composite Door Solutions', pageWidth - margin, 23, { align: 'right' });

  // Legal / contact bar
  const barY = 28;
  doc.setFillColor(...DARK);
  doc.rect(margin, barY, contentWidth, 13, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const office = company.offices?.[0];
  doc.text(
    (office?.name || company.name).toUpperCase() +
      (company.address ? `  |  ${company.address.toUpperCase()}` : ''),
    margin + 3,
    barY + 5,
  );
  doc.setFont('helvetica', 'normal');
  const contactLine = [
    company.phone ? `Phone: ${company.phone}` : null,
    company.taxInfo?.trn ? `TRN: ${company.taxInfo.trn}` : null,
    company.email ? `Email: ${company.email}` : null,
    company.website ? `Web: ${company.website}` : null,
  ]
    .filter(Boolean)
    .join('  |  ');
  doc.text(contactLine, margin + 3, barY + 10);

  // ---- Title ----------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...TITLE);
  doc.text('QUOTATION', pageWidth / 2, barY + 24, { align: 'center' });

  // ---- Details grid ---------------------------------------------------
  const detailRows: string[][] = [
    ['Attention', data.attention, 'Issue Date', data.issueDate],
    ['Quotation No', data.quotationNo, 'Prepared by', data.preparedBy],
    ['Project', data.project, 'Phone No', data.phoneNo],
    ['Scope of Work', data.scopeOfWork, 'Quotation Validity', data.validity],
    ['Location', data.location, '', ''],
  ];

  autoTable(doc, {
    startY: barY + 30,
    body: detailRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.8, textColor: DARK, lineColor: [190, 190, 190] },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },
      1: { cellWidth: 62 },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: contentWidth - 124 },
    },
  });

  // ---- Items ----------------------------------------------------------
  const itemsStartY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  const body = data.items.map((item, index) => [
    String(index + 1),
    [item.name, item.description].filter(Boolean).join('\n'),
    (item.unit || '').toUpperCase(),
    item.quantity.toLocaleString('en-US'),
    money(item.unitPrice),
    money(item.total),
  ]);

  const numericWidth = 26;
  const descWidth = contentWidth - 10 - 16 - numericWidth * 3;

  autoTable(doc, {
    startY: itemsStartY,
    head: [['S.No', 'Item / Door Description', 'UNIT', 'QTY', 'Unit Price AED', 'Amount AED']],
    body,
    foot: [
      [{ content: 'Subtotal', colSpan: 5, styles: { halign: 'right' } }, money(data.subtotal)],
      [{ content: `VAT ${data.taxRate}%`, colSpan: 5, styles: { halign: 'right' } }, money(data.taxAmount)],
      [{ content: 'TOTAL', colSpan: 5, styles: { halign: 'right' } }, money(data.total)],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2, textColor: DARK, lineColor: [170, 170, 170], valign: 'middle' },
    headStyles: { fillColor: DARK, textColor: 255, fontStyle: 'bold', halign: 'center' },
    footStyles: { fillColor: [240, 236, 230], textColor: DARK, fontStyle: 'bold', halign: 'right' },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: descWidth },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: numericWidth, halign: 'center' },
      4: { cellWidth: numericWidth, halign: 'right' },
      5: { cellWidth: numericWidth, halign: 'right' },
    },
  });

  // ---- Terms & conditions --------------------------------------------
  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const pageHeight = doc.internal.pageSize.getHeight();

  // Footer rule sits at pageHeight - 15, so content must stay above that.
  const contentBottom = pageHeight - 18;

  const ensureSpace = (needed: number) => {
    if (y + needed > contentBottom) {
      doc.addPage();
      y = 20;
    }
  };


  ensureSpace(14);
  doc.setFillColor(...DARK);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TERMS & CONDITIONS', margin + 3, y + 5);
  y += 12;

  doc.setTextColor(...DARK);
  doc.setFontSize(8);
  const terms = data.terms ?? [];
  terms.forEach((term) => {
    const lines = doc.splitTextToSize(term, contentWidth - 4);
    ensureSpace(lines.length * 4.2 + 2);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, margin + 2, y);
    y += lines.length * 4.2 + 1.5;
  });

  // ---- QR code + signature area ---------------------------------------
  // Fixed geometry: signature lines on the left, QR block on the right.
  const qrSize = 24;
  const blockHeight = qrSize + 8;
  y += 4;
  ensureSpace(blockHeight);


  const blockTop = y;
  const qrX = pageWidth - margin - qrSize;

  // QR code (verification payload)
  const qrPayload =
    data.qrData ||
    [
      `Quotation: ${data.quotationNo}`,
      `Project: ${data.project}`,
      `Total: AED ${money(data.total)}`,
      company.website || company.email || '',
    ]
      .filter(Boolean)
      .join(' | ');
  drawQrCode(doc, qrPayload, qrX, blockTop, qrSize);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...DARK);
  doc.text('Scan to verify quotation', qrX + qrSize / 2, blockTop + qrSize + 4, { align: 'center' });

  // Signature area (left)
  const sigWidth = 62;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Prepared By', margin, blockTop + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(data.preparedBy || '', margin, blockTop + 9);
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);
  doc.line(margin, blockTop + qrSize - 8, margin + sigWidth, blockTop + qrSize - 8);
  doc.setFontSize(7);
  doc.text('Authorised Signature', margin, blockTop + qrSize - 4);

  const acceptX = margin + sigWidth + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Accepted By (Client)', acceptX, blockTop + 4);
  doc.line(acceptX, blockTop + qrSize - 8, acceptX + sigWidth, blockTop + qrSize - 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Name / Signature / Date', acceptX, blockTop + qrSize - 4);

  doc.setTextColor(0, 0, 0);
};

