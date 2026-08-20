import type jsPDF from 'jspdf';
import type { Company } from '@/contexts/CompaniesContext';

/**
 * Per-company PDF template system.
 *
 * Every document type (quotation, proforma, tax invoice, delivery order) uses
 * these helpers so logos, office blocks, terms and signature areas render with
 * the correct geometry for each company — including multi-office companies
 * such as TS WPC DOORS whose square logo and second office block need more
 * vertical space than the single-office companies.
 */

export interface CompanyPdfTemplate {
  /** Logo box geometry in mm. */
  logo: { width: number; height: number; x?: number; y: number };
  /** Font size for the company name in the right-hand header block. */
  nameFontSize: number;
  /** Whether a secondary office block is drawn under the logo. */
  hasSecondaryOffice: boolean;
  /** Minimum Y for the document title so short headers keep their old layout. */
  minTitleY: number;
}

const normalize = (name?: string | null) => (name || '').toLowerCase();

export const getCompanyPdfTemplate = (company: Company, showTrn = false): CompanyPdfTemplate => {
  const name = normalize(company.name);
  const isWpc = name.includes('wpc');
  const isAlhadaf = !isWpc && (name.includes('hadaf') || name.includes('kabeer'));
  const hasSecondaryOffice = (company.offices?.length ?? 0) > 1;

  return {
    logo: {
      width: isWpc ? 36 : isAlhadaf ? 65 : 55,
      height: isWpc ? 36 : isAlhadaf ? 42 : 35,
      y: 8,
    },
    nameFontSize: isWpc ? 13 : 12,
    hasSecondaryOffice,
    minTitleY: showTrn ? 58 : 56,
  };
};

/** Draws the secondary office block (e.g. UK office) and returns its bottom Y. */
export const drawSecondaryOffice = (doc: jsPDF, company: Company, x: number, startY: number): number => {
  const office = company.offices?.[1];
  if (!office) return startY;

  const prevSize = doc.getFontSize();
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);

  let y = startY;
  doc.setFont('helvetica', 'bold');
  doc.text(office.label, x, y);
  doc.setFont('helvetica', 'normal');
  y += 3.5;
  doc.text(office.name, x, y);
  y += 3.5;
  doc.text(office.address, x, y);
  const contact = [office.phone, office.email].filter(Boolean).join(' | ');
  if (contact) {
    y += 3.5;
    doc.text(contact, x, y);
  }

  doc.setFontSize(prevSize);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  return y;
};

export interface PdfHeaderOptions {
  company: Company;
  /** Logo image source (data URL or imported asset URL). */
  logo: string;
  title: string;
  margin?: number;
  /** Show the company TRN in the header (tax documents). */
  showTrn?: boolean;
  /** Gap between title and the first details row. */
  detailsGap?: number;
  /** Gap between title and the items table. */
  tableGap?: number;
}

export interface PdfHeaderMetrics {
  headerBottomY: number;
  titleY: number;
  detailsY: number;
  tableStartY: number;
}

/**
 * Draws the company header (logo, contact block, secondary office, TRN) and the
 * centered document title, returning the layout metrics the caller should use
 * for the details rows and items table.
 */
export const drawPdfHeader = (doc: jsPDF, options: PdfHeaderOptions): PdfHeaderMetrics => {
  const { company, logo, title, showTrn = false, detailsGap = 12, tableGap = 39 } = options;
  const margin = options.margin ?? 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const template = getCompanyPdfTemplate(company, showTrn);

  // Logo (left)
  let logoInput: unknown = logo;
  if (typeof Image !== 'undefined') {
    const img = new Image();
    img.src = logo;
    logoInput = img;
  }
  doc.addImage(
    logoInput as HTMLImageElement,
    'PNG',
    template.logo.x ?? margin,
    template.logo.y,
    template.logo.width,
    template.logo.height,
  );
  const logoBottom = template.logo.y + template.logo.height;

  // Company details (right)
  const rightAlignX = pageWidth - margin;
  doc.setFontSize(template.nameFontSize);
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
  let rightBottom = 43;
  if (showTrn && company.taxInfo?.trn) {
    doc.text(`TRN: ${company.taxInfo.trn}`, rightAlignX, 50, { align: 'right' });
    rightBottom = 50;
  }

  // Secondary office under the logo
  const officeBottom = template.hasSecondaryOffice
    ? drawSecondaryOffice(doc, company, margin, logoBottom + 4)
    : logoBottom;

  const headerBottomY = Math.max(logoBottom, rightBottom, officeBottom);
  const titleY = Math.max(template.minTitleY, headerBottomY + 6);

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, titleY, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  return {
    headerBottomY,
    titleY,
    detailsY: titleY + detailsGap,
    tableStartY: titleY + tableGap,
  };
};

/** Signature / acknowledgement area used by delivery orders and quotations. */
export const drawSignatureBlock = (
  doc: jsPDF,
  y: number,
  options: { margin?: number; labels?: { receiver: string; date: string; signature: string } } = {},
) => {
  const margin = options.margin ?? 14;
  const pageWidth = doc.internal.pageSize.getWidth();
  const labels = options.labels ?? { receiver: 'Received By:', date: 'Date:', signature: 'Signature:' };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(labels.receiver, margin, y);
  doc.line(margin + 25, y, margin + 80, y);
  doc.text(labels.date, pageWidth / 2, y);
  doc.line(pageWidth / 2 + 15, y, pageWidth / 2 + 60, y);
  doc.text(labels.signature, margin, y + 15);
  doc.line(margin + 25, y + 15, margin + 80, y + 15);
};

/**
 * Draws the per-company footer on every page: a rule, the company identity line
 * and page numbering. Call once, right before returning the document.
 */
export const drawDocumentFooter = (doc: jsPDF, company: Company, margin = 14) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 10;
  const pageCount = doc.getNumberOfPages();

  const primaryOffice = company.offices?.[0];
  const identity = [
    primaryOffice?.name || company.name,
    company.phone || primaryOffice?.phone,
    company.email || primaryOffice?.email,
    company.website,
  ]
    .filter(Boolean)
    .join('  |  ');

  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(identity, margin, footerY);
    doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);
};
