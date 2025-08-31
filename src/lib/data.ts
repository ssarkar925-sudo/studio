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

export const invoices: Invoice[] = [];

export const customers: Customer[] = [];

export const products: Product[] = [];

export const invoiceTemplates: string[] = [
  'Versatile Service & Product Invoice',
  'Detailed Itemized Invoice',
  'Retail/Point-of-Sale Invoice',
  'Hourly Service & Product Combination Invoice',
];
