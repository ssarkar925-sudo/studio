

import { notifyDataChange } from '@/hooks/use-local-storage-data';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customer: {
    id: string;
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
  phone?: string;
  address?: string;
  totalInvoiced: number;
  totalPaid: number;
  invoices: number;
};

export type Product = {
  id:string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  sku: string;
  batchCode: string;
};

export type Vendor = {
  id: string;
  vendorName: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  gstn?: string;
};

export type Purchase = {
  id: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  receivedDate?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    total: number;
    isNew?: boolean;
  }[];
  totalAmount: number;
  paymentDone: number;
  dueAmount: number;
  status: 'Pending' | 'Received';
  gst?: number;
  deliveryCharges?: number;
};

const DUMMY_CUSTOMERS: Customer[] = [];
const DUMMY_INVOICES: Invoice[] = [];
const DUMMY_PRODUCTS: Product[] = [];
const DUMMY_VENDORS: Vendor[] = [];
const DUMMY_PURCHASES: Purchase[] = [];


function createLocalStorageDAO<T extends {id: string}>(key: string, initialData: T[]) {
    const isClient = typeof window !== 'undefined';

    const load = (): T[] => {
        if (!isClient) {
            return [];
        }
        try {
            const item = window.localStorage.getItem(key);
            if (!item) {
                // If no data, initialize with empty array and save it.
                window.localStorage.setItem(key, JSON.stringify([]));
                return [];
            }
            return JSON.parse(item);
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return [];
        }
    };

    const save = (data: T[]) => {
        if (isClient) {
            try {
                const serializedData = JSON.stringify(data, null, 2);
                window.localStorage.setItem(key, serializedData);
                notifyDataChange();
            } catch (error) {
                console.error(`Error writing to localStorage key “${key}”:`, error);
            }
        }
    };
    
    const add = (item: Omit<T, 'id'>) => {
        const items = load();
        const newItem = { ...item, id: new Date().toISOString() + Math.random() } as T;
        const updatedItems = [...items, newItem];
        save(updatedItems);
        return newItem;
    }
    
    const update = (id: string, updatedItem: Partial<T>) => {
        const items = load();
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updatedItem };
            save(items);
        }
    };

    const remove = (id: string) => {
        const items = load();
        const updatedItems = items.filter(i => i.id !== id);
        save(updatedItems);
    }

    return { load, save, add, update, remove };
}

export const customersDAO = createLocalStorageDAO<Customer>('customers', DUMMY_CUSTOMERS);
export const invoicesDAO = createLocalStorageDAO<Invoice>('invoices', DUMMY_INVOICES);

// Custom DAO for Products to handle special logic
const createProductsDAO = () => {
    const baseDAO = createLocalStorageDAO<Product>('products', DUMMY_PRODUCTS);

    const addProduct = (item: Omit<Product, 'id'>) => {
        const products = baseDAO.load();
        const newProduct = { ...item, id: new Date().toISOString() + Math.random() } as Product;
        
        // Don't save here, let the calling function decide when to save.
        // This is important for the purchase received logic.
        return newProduct;
    };
    
    return {
        ...baseDAO,
        // The add method is overridden for custom logic, but we still need a way
        // to add without special handling in some cases.
        // The purchase received logic will handle adding and saving.
        add: (item: Omit<Product, 'id'>): Product => {
            const products = baseDAO.load();
            const newProduct = { ...item, id: new Date().toISOString() + Math.random() } as Product;
            const updatedProducts = [...products, newProduct];
            baseDAO.save(updatedProducts);
            return newProduct;
        },
    };
}
export const productsDAO = createProductsDAO();


export const vendorsDAO = createLocalStorageDAO<Vendor>('vendors', DUMMY_VENDORS);
export const purchasesDAO = createLocalStorageDAO<Purchase>('purchases', DUMMY_PURCHASES);


export const invoiceTemplates: string[] = [
  'Versatile Service & Product Invoice',
  'Detailed Itemized Invoice',
  'Retail/Point-of-Sale Invoice',
  'Hourly Service & Product Combination Invoice',
];
