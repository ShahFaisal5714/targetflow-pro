import { 
  Project, 
  Quotation, 
  SalesOrder, 
  Invoice, 
  Product, 
  DashboardStats, 
  SalesData,
  User 
} from '@/types/crm';

export const mockProjects: Project[] = [
  {
    id: 'PRJ-001',
    name: 'Marina Bay Residences',
    contractor: {
      id: 'CON-001',
      name: 'BuildRight Construction LLC',
      contact: 'Ahmed Hassan',
      email: 'ahmed@buildright.ae',
      phone: '+971 50 123 4567',
      address: 'Dubai, UAE'
    },
    consultant: {
      id: 'CONS-001',
      name: 'Design Excellence Architects',
      contact: 'Sarah Mitchell',
      email: 'sarah@designexc.com',
      phone: '+971 50 234 5678'
    },
    client: {
      id: 'CLI-001',
      name: 'Marina Properties Group',
      contact: 'Mohammed Al Rashid',
      email: 'mohammed@marinaproperties.ae',
      phone: '+971 50 345 6789'
    },
    category: 'residential',
    status: 'in_progress',
    salesManager: 'John Smith',
    timeline: {
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      milestones: [
        { id: 'M1', name: 'Sample Approval', dueDate: '2024-02-01', completed: true },
        { id: 'M2', name: 'First Delivery', dueDate: '2024-03-15', completed: true },
        { id: 'M3', name: 'Installation Start', dueDate: '2024-04-01', completed: false }
      ]
    },
    value: 450000,
    createdAt: '2024-01-10',
    updatedAt: '2024-03-20'
  },
  {
    id: 'PRJ-002',
    name: 'City Center Mall Expansion',
    contractor: {
      id: 'CON-002',
      name: 'Al Futtaim Contractors',
      contact: 'Khalid Omar',
      email: 'khalid@alfuttaim.ae',
      phone: '+971 50 456 7890'
    },
    client: {
      id: 'CLI-002',
      name: 'City Center Holdings',
      contact: 'James Wilson',
      email: 'james@citycenter.ae',
      phone: '+971 50 567 8901'
    },
    category: 'commercial',
    status: 'quoted',
    salesManager: 'Emily Davis',
    timeline: {
      startDate: '2024-04-01',
      endDate: '2024-12-31',
      milestones: []
    },
    value: 1200000,
    createdAt: '2024-02-15',
    updatedAt: '2024-03-18'
  },
  {
    id: 'PRJ-003',
    name: 'Industrial Park Phase 2',
    contractor: {
      id: 'CON-003',
      name: 'Gulf Industrial Builders',
      contact: 'Raj Patel',
      email: 'raj@gulfbuilders.ae',
      phone: '+971 50 678 9012'
    },
    client: {
      id: 'CLI-003',
      name: 'Dubai Industrial Authority',
      contact: 'Fatima Al Maktoum',
      email: 'fatima@dia.gov.ae',
      phone: '+971 50 789 0123'
    },
    category: 'industrial',
    status: 'lead',
    salesManager: 'John Smith',
    timeline: {
      startDate: '2024-07-01',
      endDate: '2025-06-30',
      milestones: []
    },
    value: 2500000,
    createdAt: '2024-03-01',
    updatedAt: '2024-03-15'
  },
  {
    id: 'PRJ-004',
    name: 'Palm Jumeirah Villa',
    contractor: {
      id: 'CON-004',
      name: 'Luxury Homes UAE',
      contact: 'David Chen',
      email: 'david@luxuryhomes.ae',
      phone: '+971 50 890 1234'
    },
    client: {
      id: 'CLI-004',
      name: 'Private Client',
      contact: 'Alexander Petrov',
      email: 'alex.petrov@email.com',
      phone: '+971 50 901 2345'
    },
    category: 'residential',
    status: 'delivered',
    salesManager: 'Emily Davis',
    timeline: {
      startDate: '2023-09-01',
      endDate: '2024-02-28',
      milestones: [
        { id: 'M1', name: 'Sample Approval', dueDate: '2023-09-15', completed: true },
        { id: 'M2', name: 'All Deliveries', dueDate: '2024-01-30', completed: true },
        { id: 'M3', name: 'Final Inspection', dueDate: '2024-02-15', completed: true }
      ]
    },
    value: 180000,
    createdAt: '2023-08-20',
    updatedAt: '2024-02-28'
  },
  {
    id: 'PRJ-005',
    name: 'Business Bay Tower',
    contractor: {
      id: 'CON-005',
      name: 'Arabtec Construction',
      contact: 'Nasser Al Balushi',
      email: 'nasser@arabtec.ae',
      phone: '+971 50 012 3456'
    },
    client: {
      id: 'CLI-005',
      name: 'Business Bay Developments',
      contact: 'Lisa Wang',
      email: 'lisa@bbd.ae',
      phone: '+971 50 123 4567'
    },
    category: 'commercial',
    status: 'active',
    salesManager: 'John Smith',
    timeline: {
      startDate: '2024-02-01',
      endDate: '2024-08-31',
      milestones: [
        { id: 'M1', name: 'BOQ Finalization', dueDate: '2024-02-28', completed: true }
      ]
    },
    value: 890000,
    createdAt: '2024-01-25',
    updatedAt: '2024-03-10'
  }
];

export const mockQuotations: Quotation[] = [
  {
    id: 'QT-2024-001',
    projectId: 'PRJ-001',
    projectName: 'Marina Bay Residences',
    version: 3,
    status: 'approved',
    items: [
      { id: 'QI-001', productId: 'P-001', productName: 'Premium SPC Flooring - Oak', category: 'spc_flooring', unit: 'sqm', quantity: 2500, unitPrice: 45, margin: 25, total: 112500 },
      { id: 'QI-002', productId: 'P-002', productName: 'Aluminum Tile Trim - Silver', category: 'tile_trims', unit: 'lm', quantity: 800, unitPrice: 12, margin: 30, total: 9600 },
      { id: 'QI-003', productId: 'P-003', productName: 'WPC Decking - Teak', category: 'wpc_decking', unit: 'sqm', quantity: 400, unitPrice: 85, margin: 22, total: 34000 }
    ],
    subtotal: 156100,
    discount: { type: 'percentage', value: 5 },
    tax: { type: 'VAT', rate: 5 },
    total: 155804.75,
    validUntil: '2024-04-30',
    createdAt: '2024-01-20',
    updatedAt: '2024-02-15'
  },
  {
    id: 'QT-2024-002',
    projectId: 'PRJ-002',
    projectName: 'City Center Mall Expansion',
    version: 1,
    status: 'submitted',
    items: [
      { id: 'QI-004', productId: 'P-001', productName: 'Premium SPC Flooring - Marble', category: 'spc_flooring', unit: 'sqm', quantity: 8500, unitPrice: 52, margin: 28, total: 442000 },
      { id: 'QI-005', productId: 'P-004', productName: 'Expansion Joint Cover - Heavy Duty', category: 'expansion_joints', unit: 'lm', quantity: 1200, unitPrice: 95, margin: 20, total: 114000 }
    ],
    subtotal: 556000,
    discount: { type: 'flat', value: 15000 },
    tax: { type: 'VAT', rate: 5 },
    total: 568050,
    validUntil: '2024-05-15',
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10'
  },
  {
    id: 'QT-2024-003',
    projectId: 'PRJ-005',
    projectName: 'Business Bay Tower',
    version: 2,
    status: 'draft',
    items: [
      { id: 'QI-006', productId: 'P-005', productName: 'Commercial SPC - Grey Stone', category: 'spc_flooring', unit: 'sqm', quantity: 5200, unitPrice: 48, margin: 26, total: 249600 },
      { id: 'QI-007', productId: 'P-002', productName: 'Aluminum Tile Trim - Brushed', category: 'tile_trims', unit: 'lm', quantity: 1500, unitPrice: 14, margin: 32, total: 21000 }
    ],
    subtotal: 270600,
    discount: { type: 'percentage', value: 3 },
    tax: { type: 'VAT', rate: 5 },
    total: 275606.70,
    validUntil: '2024-04-20',
    createdAt: '2024-03-05',
    updatedAt: '2024-03-18'
  }
];

export const mockSalesOrders: SalesOrder[] = [
  {
    id: 'SO-2024-001',
    quotationId: 'QT-2024-001',
    projectId: 'PRJ-001',
    projectName: 'Marina Bay Residences',
    status: 'processing',
    items: [
      { id: 'SOI-001', productId: 'P-001', productName: 'Premium SPC Flooring - Oak', quantity: 2500, deliveredQuantity: 1500, unitPrice: 45, total: 112500 },
      { id: 'SOI-002', productId: 'P-002', productName: 'Aluminum Tile Trim - Silver', quantity: 800, deliveredQuantity: 800, unitPrice: 12, total: 9600 },
      { id: 'SOI-003', productId: 'P-003', productName: 'WPC Decking - Teak', quantity: 400, deliveredQuantity: 0, unitPrice: 85, total: 34000 }
    ],
    deliverySchedule: [
      { id: 'DS-001', scheduledDate: '2024-03-01', items: [{ productId: 'P-001', quantity: 1500 }], status: 'delivered' },
      { id: 'DS-002', scheduledDate: '2024-03-10', items: [{ productId: 'P-002', quantity: 800 }], status: 'delivered' },
      { id: 'DS-003', scheduledDate: '2024-04-01', items: [{ productId: 'P-001', quantity: 1000 }, { productId: 'P-003', quantity: 400 }], status: 'pending' }
    ],
    total: 155804.75,
    createdAt: '2024-02-20',
    updatedAt: '2024-03-15'
  },
  {
    id: 'SO-2024-002',
    quotationId: 'QT-2023-015',
    projectId: 'PRJ-004',
    projectName: 'Palm Jumeirah Villa',
    status: 'completed',
    items: [
      { id: 'SOI-004', productId: 'P-006', productName: 'Luxury SPC - Walnut', quantity: 850, deliveredQuantity: 850, unitPrice: 65, total: 55250 },
      { id: 'SOI-005', productId: 'P-003', productName: 'WPC Decking - Teak', quantity: 320, deliveredQuantity: 320, unitPrice: 85, total: 27200 }
    ],
    deliverySchedule: [
      { id: 'DS-004', scheduledDate: '2024-01-15', items: [{ productId: 'P-006', quantity: 850 }, { productId: 'P-003', quantity: 320 }], status: 'delivered' }
    ],
    total: 86572.50,
    createdAt: '2024-01-05',
    updatedAt: '2024-02-28'
  }
];

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-001',
    invoiceNumber: 'INV-2024-0001',
    salesOrderId: 'SO-2024-001',
    projectId: 'PRJ-001',
    projectName: 'Marina Bay Residences',
    clientName: 'Marina Properties Group',
    status: 'partial',
    items: [
      { id: 'II-001', description: 'Premium SPC Flooring - Oak (1500 sqm)', quantity: 1500, unitPrice: 45, total: 67500 },
      { id: 'II-002', description: 'Aluminum Tile Trim - Silver (800 lm)', quantity: 800, unitPrice: 12, total: 9600 }
    ],
    subtotal: 77100,
    tax: 3855,
    total: 80955,
    paidAmount: 50000,
    dueDate: '2024-04-15',
    createdAt: '2024-03-15'
  },
  {
    id: 'INV-002',
    invoiceNumber: 'INV-2024-0002',
    salesOrderId: 'SO-2024-002',
    projectId: 'PRJ-004',
    projectName: 'Palm Jumeirah Villa',
    clientName: 'Private Client - Alexander Petrov',
    status: 'paid',
    items: [
      { id: 'II-003', description: 'Luxury SPC - Walnut (850 sqm)', quantity: 850, unitPrice: 65, total: 55250 },
      { id: 'II-004', description: 'WPC Decking - Teak (320 sqm)', quantity: 320, unitPrice: 85, total: 27200 }
    ],
    subtotal: 82450,
    tax: 4122.50,
    total: 86572.50,
    paidAmount: 86572.50,
    dueDate: '2024-02-15',
    createdAt: '2024-01-20'
  },
  {
    id: 'INV-003',
    invoiceNumber: 'INV-2024-0003',
    salesOrderId: 'SO-2024-001',
    projectId: 'PRJ-001',
    projectName: 'Marina Bay Residences',
    clientName: 'Marina Properties Group',
    status: 'sent',
    items: [
      { id: 'II-005', description: 'Premium SPC Flooring - Oak (1000 sqm)', quantity: 1000, unitPrice: 45, total: 45000 },
      { id: 'II-006', description: 'WPC Decking - Teak (400 sqm)', quantity: 400, unitPrice: 85, total: 34000 }
    ],
    subtotal: 79000,
    tax: 3950,
    total: 82950,
    paidAmount: 0,
    dueDate: '2024-05-01',
    createdAt: '2024-03-25'
  }
];

export const mockProducts: Product[] = [
  { id: 'P-001', sku: 'SPC-OAK-001', name: 'Premium SPC Flooring - Oak', category: 'spc_flooring', unit: 'sqm', prices: { dealer: 32, contractor: 38, project: 45 }, stock: 5200, reorderLevel: 1000, createdAt: '2023-01-15' },
  { id: 'P-002', sku: 'TT-ALU-SLV', name: 'Aluminum Tile Trim - Silver', category: 'tile_trims', unit: 'lm', prices: { dealer: 8, contractor: 10, project: 12 }, stock: 3500, reorderLevel: 500, createdAt: '2023-01-15' },
  { id: 'P-003', sku: 'WPC-TEK-001', name: 'WPC Decking - Teak', category: 'wpc_decking', unit: 'sqm', prices: { dealer: 62, contractor: 72, project: 85 }, stock: 1800, reorderLevel: 400, createdAt: '2023-02-20' },
  { id: 'P-004', sku: 'EJ-HD-001', name: 'Expansion Joint Cover - Heavy Duty', category: 'expansion_joints', unit: 'lm', prices: { dealer: 72, contractor: 82, project: 95 }, stock: 450, reorderLevel: 200, createdAt: '2023-03-10' },
  { id: 'P-005', sku: 'SPC-GRY-002', name: 'Commercial SPC - Grey Stone', category: 'spc_flooring', unit: 'sqm', prices: { dealer: 35, contractor: 42, project: 48 }, stock: 8500, reorderLevel: 1500, createdAt: '2023-04-05' },
  { id: 'P-006', sku: 'SPC-WAL-003', name: 'Luxury SPC - Walnut', category: 'spc_flooring', unit: 'sqm', prices: { dealer: 48, contractor: 55, project: 65 }, stock: 320, reorderLevel: 500, createdAt: '2023-05-12' },
  { id: 'P-007', sku: 'TT-ALU-BRS', name: 'Aluminum Tile Trim - Brushed', category: 'tile_trims', unit: 'lm', prices: { dealer: 10, contractor: 12, project: 14 }, stock: 2800, reorderLevel: 400, createdAt: '2023-06-18' },
  { id: 'P-008', sku: 'WPC-GRY-002', name: 'WPC Decking - Grey', category: 'wpc_decking', unit: 'sqm', prices: { dealer: 58, contractor: 68, project: 78 }, stock: 2200, reorderLevel: 500, createdAt: '2023-07-22' }
];

export const mockDashboardStats: DashboardStats = {
  totalSales: 2450000,
  pendingQuotations: 12,
  outstandingPayments: 185000,
  activeProjects: 8,
  conversionRate: 68,
  stockAlerts: 3
};

export const mockSalesData: SalesData[] = [
  { month: 'Jan', revenue: 180000, orders: 12 },
  { month: 'Feb', revenue: 220000, orders: 15 },
  { month: 'Mar', revenue: 195000, orders: 11 },
  { month: 'Apr', revenue: 280000, orders: 18 },
  { month: 'May', revenue: 310000, orders: 22 },
  { month: 'Jun', revenue: 265000, orders: 16 },
  { month: 'Jul', revenue: 290000, orders: 19 },
  { month: 'Aug', revenue: 340000, orders: 24 },
  { month: 'Sep', revenue: 285000, orders: 17 },
  { month: 'Oct', revenue: 320000, orders: 21 },
  { month: 'Nov', revenue: 355000, orders: 25 },
  { month: 'Dec', revenue: 410000, orders: 28 }
];

export const mockUsers: User[] = [
  { id: 'U-001', name: 'John Smith', email: 'john.smith@targetspec.ae', role: 'sales_manager', lastActive: '2024-03-20T14:30:00' },
  { id: 'U-002', name: 'Emily Davis', email: 'emily.davis@targetspec.ae', role: 'sales_manager', lastActive: '2024-03-20T15:45:00' },
  { id: 'U-003', name: 'Ahmed Khan', email: 'ahmed.khan@targetspec.ae', role: 'sales_executive', lastActive: '2024-03-20T12:00:00' },
  { id: 'U-004', name: 'Sarah Johnson', email: 'sarah.johnson@targetspec.ae', role: 'accountant', lastActive: '2024-03-20T16:15:00' },
  { id: 'U-005', name: 'Michael Lee', email: 'michael.lee@targetspec.ae', role: 'warehouse', lastActive: '2024-03-20T09:30:00' },
  { id: 'U-006', name: 'Admin User', email: 'admin@targetspec.ae', role: 'admin', lastActive: '2024-03-20T17:00:00' }
];

export const topSellingProducts = [
  { name: 'Premium SPC - Oak', sales: 12500, revenue: 562500 },
  { name: 'Commercial SPC - Grey', sales: 8200, revenue: 393600 },
  { name: 'WPC Decking - Teak', sales: 3400, revenue: 289000 },
  { name: 'Tile Trim - Silver', sales: 15000, revenue: 180000 },
  { name: 'Expansion Joint HD', sales: 1200, revenue: 114000 }
];

export const projectsByStatus = [
  { status: 'Lead', count: 5, value: 3200000 },
  { status: 'Active', count: 3, value: 1450000 },
  { status: 'Quoted', count: 4, value: 2100000 },
  { status: 'In Progress', count: 6, value: 1850000 },
  { status: 'Delivered', count: 8, value: 980000 },
  { status: 'Closed', count: 12, value: 2400000 }
];
