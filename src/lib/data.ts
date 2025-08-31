
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, Unsubscribe } from 'firebase/firestore';
import { notifyDataChange } from '@/hooks/use-firestore-data';

export type InvoiceItem = {
    productId: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    total: number;
}

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
  items: InvoiceItem[];
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

function createFirestoreDAO<T extends {id: string}>(collectionName: string) {
    const collectionRef = collection(db, collectionName);

    const load = async (): Promise<T[]> => {
        try {
            const snapshot = await getDocs(collectionRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        } catch (error) {
            console.error(`Error reading from Firestore collection “${collectionName}”:`, error);
            return [];
        }
    };
    
    const add = async (item: Omit<T, 'id'>) => {
        try {
            const docRef = await addDoc(collectionRef, item);
            notifyDataChange();
            return { ...item, id: docRef.id } as T;
        } catch (error) {
             console.error(`Error writing to Firestore collection “${collectionName}”:`, error);
             throw error;
        }
    }
    
    const update = async (id: string, updatedItem: Partial<T>) => {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updatedItem);
            notifyDataChange();
        } catch (error) {
            console.error(`Error updating document in Firestore collection “${collectionName}”:`, error);
            throw error;
        }
    };

    const remove = async (id: string) => {
       try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
            notifyDataChange();
       } catch (error) {
           console.error(`Error deleting document from Firestore collection “${collectionName}”:`, error);
           throw error;
       }
    }

    const subscribe = (callback: (data: T[]) => void): Unsubscribe => {
        const q = query(collectionRef);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            callback(data);
        });
        return unsubscribe;
    }

    return { load, add, update, remove, subscribe };
}

export const customersDAO = createFirestoreDAO<Customer>('customers');
export const invoicesDAO = createFirestoreDAO<Invoice>('invoices');

// Custom DAO for Products to handle special logic
const createProductsDAO = () => {
    const baseDAO = createFirestoreDAO<Product>('products');
    
    return {
        ...baseDAO,
        // The add method is overridden for custom logic, but we still need a way
        // to add without special handling in some cases.
        // The purchase received logic will handle adding and saving.
        add: async (item: Omit<Product, 'id'>): Promise<Product> => {
            return baseDAO.add(item);
        },
    };
}
export const productsDAO = createProductsDAO();


export const vendorsDAO = createFirestoreDAO<Vendor>('vendors');
export const purchasesDAO = createFirestoreDAO<Purchase>('purchases');
