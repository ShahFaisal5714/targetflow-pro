import type { Company } from '@/contexts/CompaniesContext';

interface SecondaryOfficeBlockProps {
  company: Company;
  className?: string;
}

/**
 * Renders the additional office (e.g. UK office) for companies with more than
 * one location. Renders nothing for single-office companies.
 */
export default function SecondaryOfficeBlock({ company, className }: SecondaryOfficeBlockProps) {
  const office = company.offices?.[1];
  if (!office) return null;

  return (
    <div className={`text-xs text-muted-foreground mt-3 ${className || ''}`}>
      <p className="font-semibold text-foreground/70 tracking-wide">{office.label}</p>
      <p className="font-medium">{office.name}</p>
      <p>{office.address}</p>
      {office.phone && <p>{office.phone}</p>}
      {office.email && <p>{office.email}</p>}
    </div>
  );
}
