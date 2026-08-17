import type jsPDF from 'jspdf';
import type { Company } from '@/contexts/CompaniesContext';

/**
 * Draws the secondary (e.g. UK) office details under the logo for companies
 * that operate from more than one office. No-op for single-office companies.
 */
export const drawSecondaryOffice = (doc: jsPDF, company: Company, x: number) => {
  const office = company.offices?.[1];
  if (!office) return;

  const prevSize = doc.getFontSize();
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.setFont('helvetica', 'bold');
  doc.text(office.label, x, 43.5);
  doc.setFont('helvetica', 'normal');
  doc.text(office.name, x, 47);
  doc.text(office.address, x, 50.5);
  doc.text([office.phone, office.email].filter(Boolean).join(' | '), x, 54);
  doc.setFontSize(prevSize);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
};
