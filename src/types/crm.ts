// Project Types
export type ProjectStatus = 'lead' | 'active' | 'quoted' | 'in_progress' | 'delivered' | 'closed';
export type ProjectCategory = 'residential' | 'commercial' | 'industrial';

export interface Project {
  id: string;
  name: string;
  contractor: Company;
  consultant?: Company;
  client: Company;
  category: ProjectCategory;
  status: ProjectStatus;
  salesManager: string;
  timeline: {
    startDate: string;
    endDate: string;
    milestones: Milestone[];
  };
  value: number;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address?: string;
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
}

// Quotation Types
export type QuotationStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Quotation {
  id: string;
  projectId: string;
  projectName: string;
  version: number;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  discount: {
    type: 'percentage' | 'flat';
    value: number;
  };
  tax: {
    type: string;
    rate: number;
  };
  total: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  unit: ProductUnit;
  quantity: number;
  unitPrice: number;
  margin: number;
  total: number;
}

export type ProductCategory = 'spc_flooring' | 'tile_trims' | 'expansion_joints' | 'wpc_decking' | 'other';
export type ProductUnit = 'sqm' | 'pcs' | 'lm' | 'kg' | 'box';
export type PricingTier = 'dealer' | 'contractor' | 'project';

// Sales Order Types
export type SalesOrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed';

export interface SalesOrder {
  id: string;
  quotationId: string;
  projectId: string;
  projectName: string;
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  deliverySchedule: DeliverySchedule[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  deliveredQuantity: number;
  unitPrice: number;
  total: number;
}

export interface DeliverySchedule {
  id: string;
  scheduledDate: string;
  items: { productId: string; quantity: number }[];
  status: 'pending' | 'dispatched' | 'delivered';
}

// Invoice Types
export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  salesOrderId: string;
  projectId: string;
  projectName: string;
  clientName: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paidAmount: number;
  dueDate: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Inventory Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  prices: {
    dealer: number;
    contractor: number;
    project: number;
  };
  stock: number;
  reorderLevel: number;
  createdAt: string;
}

// Analytics Types
export interface DashboardStats {
  totalSales: number;
  pendingQuotations: number;
  outstandingPayments: number;
  activeProjects: number;
  conversionRate: number;
  stockAlerts: number;
}

export interface SalesData {
  month: string;
  revenue: number;
  orders: number;
}

// User Types
export type UserRole = 'admin' | 'sales_manager' | 'sales_executive' | 'accountant' | 'warehouse' | 'management';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  lastActive: string;
}
