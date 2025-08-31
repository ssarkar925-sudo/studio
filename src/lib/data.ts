export type Invoice = {
  id: string;
  invoiceNumber: string;
  customer: {
    name: string;
    email: string;
  };
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  amount: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  totalInvoiced: number;
  totalPaid: number;
  invoices: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
};

export const invoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-001',
    customer: { name: 'John Doe', email: 'john@example.com' },
    issueDate: '2023-10-01',
    dueDate: '2023-10-15',
    status: 'Paid',
    amount: 150.0,
  },
  {
    id: '2',
    invoiceNumber: 'INV-002',
    customer: { name: 'Jane Smith', email: 'jane@example.com' },
    issueDate: '2023-10-05',
    dueDate: '2023-10-20',
    status: 'Pending',
    amount: 200.5,
  },
  {
    id: '3',
    invoiceNumber: 'INV-003',
    customer: { name: 'Bob Johnson', email: 'bob@example.com' },
    issueDate: '2023-09-10',
    dueDate: '2023-09-25',
    status: 'Overdue',
    amount: 75.25,
  },
  {
    id: '4',
    invoiceNumber: 'INV-004',
    customer: { name: 'Alice Williams', email: 'alice@example.com' },
    issueDate: '2023-10-12',
    dueDate: '2023-10-27',
    status: 'Pending',
    amount: 500.0,
  },
  {
    id: '5',
    invoiceNumber: 'INV-005',
    customer: { name: 'John Doe', email: 'john@example.com' },
    issueDate: '2023-10-15',
    dueDate: '2023-10-30',
    status: 'Paid',
    amount: 320.0,
  },
];

export const customers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    totalInvoiced: 470,
    totalPaid: 470,
    invoices: 2,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    totalInvoiced: 200.5,
    totalPaid: 0,
    invoices: 1,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    totalInvoiced: 75.25,
    totalPaid: 0,
    invoices: 1,
  },
  {
    id: '4',
    name: 'Alice Williams',
    email: 'alice@example.com',
    totalInvoiced: 500,
    totalPaid: 0,
    invoices: 1,
  },
  {
    id: '5',
    name: 'Tech Solutions Inc.',
    email: 'contact@techsolutions.com',
    totalInvoiced: 2500,
    totalPaid: 1500,
    invoices: 5,
  },
  {
    id: '6',
    name: 'Creative Agency LLC',
    email: 'hello@creative.co',
    totalInvoiced: 1800,
    totalPaid: 1800,
    invoices: 3,
  },
];

export const products: Product[] = [
  { id: '1', name: 'Web Design Service', price: 1200, stock: 10 },
  { id: '2', name: 'Logo Design', price: 300, stock: 25 },
  { id: '3', name: 'Monthly Retainer', price: 2000, stock: 5 },
  { id: '4', name: 'Hourly Consulting', price: 150, stock: 100 },
];
