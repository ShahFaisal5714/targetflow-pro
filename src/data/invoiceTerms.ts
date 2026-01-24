// Predefined terms and conditions for invoices
export interface InvoiceTerm {
  id: string;
  text: string;
  category: 'general' | 'payment' | 'delivery' | 'warranty' | 'liability';
  defaultChecked: boolean;
}

export const INVOICE_TERMS: InvoiceTerm[] = [
  {
    id: 'civil-work',
    text: 'Our offer excludes any civil work/electrical work/mechanical work/protection work, floor leveling & other enablement works.',
    category: 'general',
    defaultChecked: true,
  },
  {
    id: 'property-rights',
    text: 'All products remain property of the company until paid in full.',
    category: 'payment',
    defaultChecked: true,
  },
  {
    id: 'quantity-variation',
    text: 'The prices are on the basis of above mentioned quantities, any variation shall subject to revise the commercial offer.',
    category: 'general',
    defaultChecked: true,
  },
  {
    id: 'finance-cost',
    text: 'Our cost of finance is 3% of the invoice value per month. Any payments that are not paid on the due date & or late payment, charges of 3% per month will be charged to cover our finance costs.',
    category: 'payment',
    defaultChecked: true,
  },
  {
    id: 'warranty-standard',
    text: 'Products are covered under manufacturer warranty as per the product specifications.',
    category: 'warranty',
    defaultChecked: false,
  },
  {
    id: 'delivery-terms',
    text: 'Delivery timeline is subject to material availability and site readiness.',
    category: 'delivery',
    defaultChecked: false,
  },
  {
    id: 'installation',
    text: 'Installation charges are not included in this quotation unless specifically mentioned.',
    category: 'general',
    defaultChecked: false,
  },
  {
    id: 'price-validity',
    text: 'Prices are valid for 30 days from the date of this invoice.',
    category: 'payment',
    defaultChecked: false,
  },
  {
    id: 'force-majeure',
    text: 'The company shall not be liable for delays or failures in performance caused by circumstances beyond its reasonable control.',
    category: 'liability',
    defaultChecked: false,
  },
  {
    id: 'dispute-resolution',
    text: 'Any disputes arising from this invoice shall be resolved through arbitration in accordance with UAE law.',
    category: 'liability',
    defaultChecked: false,
  },
];

export const getTermsByCategory = (category: InvoiceTerm['category']) => {
  return INVOICE_TERMS.filter(term => term.category === category);
};

export const getDefaultTerms = () => {
  return INVOICE_TERMS.filter(term => term.defaultChecked).map(term => term.id);
};
