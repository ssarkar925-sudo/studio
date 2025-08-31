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
  id: string;
  name: string;
  price: number;
  stock: number;
};

const DUMMY_CUSTOMERS: Customer[] = [];
const DUMMY_INVOICES: Invoice[] = [];
const DUMMY_PRODUCTS: Product[] = [];


function createLocalStorageDAO<T extends {id: string}>(key: string, initialData: T[]) {
    const isClient = typeof window !== 'undefined';

    const load = (): T[] => {
        if (!isClient) {
            return initialData;
        }
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialData;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return initialData;
        }
    };

    const save = (data: T[]) => {
        if (isClient) {
            try {
                const serializedData = JSON.stringify(data, null, 2);
                window.localStorage.setItem(key, serializedData);
            } catch (error) {
                console.error(`Error writing to localStorage key “${key}”:`, error);
            }
        }
    };
    
    const add = (item: Omit<T, 'id'>) => {
        const items = load();
        const newItem = { ...item, id: new Date().toISOString() } as T;
        const updatedItems = [...items, newItem];
        save(updatedItems);
        return newItem;
    }

    return { load, save, add };
}

export const customersDAO = createLocalStorageDAO<Customer>('customers', DUMMY_CUSTOMERS);
export const invoicesDAO = createLocalStorageDAO<Invoice>('invoices', DUMMY_INVOICES);
export const productsDAO = createLocalStorageDAO<Product>('products', DUMMY_PRODUCTS);


export const invoiceTemplates: string[] = [
  'Versatile Service & Product Invoice',
  'Detailed Itemized Invoice',
  'Retail/Point-of-Sale Invoice',
  'Hourly Service & Product Combination Invoice',
];
