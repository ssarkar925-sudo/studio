
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, Unsubscribe, runTransaction, getDoc } from 'firebase/firestore';

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

export type PurchaseItem = {
    productId: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    total: number;
    isNew?: boolean;
}

export type Purchase = {
  id: string;
  vendorId: string;
  vendorName: string;
  orderDate: string;
  receivedDate?: string;
  items: PurchaseItem[];
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
            // In a server component, it's better to throw the error
            throw new Error(`Failed to load data from ${collectionName}`);
        }
    };
    
    const add = async (item: Omit<T, 'id'>) => {
        try {
            const docRef = await addDoc(collectionRef, item);
            return { ...item, id: docRef.id } as T;
        } catch (error) {
             console.error(`Error writing to Firestore collection “${collectionName}”:`, error);
             throw error;
        }
    }
    
    const update = async (id: string, updatedItem: Partial<Omit<T, 'id'>>) => {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updatedItem);
        } catch (error) {
            console.error(`Error updating document in Firestore collection “${collectionName}”:`, error);
            throw error;
        }
    };

    const remove = async (id: string) => {
       try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
       } catch (error) {
           console.error(`Error deleting document from Firestore collection “${collectionName}”:`, error);
           throw error;
       }
    }

    const subscribe = (
      callback: (data: T[]) => void,
      onError?: (error: Error) => void
    ): Unsubscribe => {
        const q = query(collectionRef);
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            callback(data);
        }, (error) => {
            console.error(`Error subscribing to Firestore collection “${collectionName}”:`, error);
            if(onError) {
              onError(error);
            }
        });
        return unsubscribe;
    }

    return { load, add, update, remove, subscribe };
}

export const customersDAO = createFirestoreDAO<Customer>('customers');

const createInvoicesDAO = () => {
    const baseDAO = createFirestoreDAO<Invoice>('invoices');

    const addInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
        return runTransaction(db, async (transaction) => {
            // 1. Add the new invoice
            const newInvoiceRef = doc(collection(db, 'invoices'));
            transaction.set(newInvoiceRef, invoiceData);

            // 2. Update customer aggregates
            const customerRef = doc(db, 'customers', invoiceData.customer.id);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) {
                throw new Error("Customer not found!");
            }
            const customerData = customerDoc.data();
            const newTotalInvoiced = (customerData.totalInvoiced || 0) + invoiceData.amount;
            const newTotalPaid = (customerData.totalPaid || 0) + (invoiceData.status === 'Paid' ? invoiceData.amount : 0);
            const newInvoicesCount = (customerData.invoices || 0) + 1;
            
            transaction.update(customerRef, {
                totalInvoiced: newTotalInvoiced,
                totalPaid: newTotalPaid,
                invoices: newInvoicesCount,
            });

            // 3. Decrement stock for each item
            for (const item of invoiceData.items) {
                const productRef = doc(db, 'products', item.productId);
                const productDoc = await transaction.get(productRef);
                if (productDoc.exists()) {
                    const currentStock = productDoc.data().stock;
                    if (currentStock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.productName}. Available: ${currentStock}, Requested: ${item.quantity}`);
                    }
                    const newStock = currentStock - item.quantity;
                    transaction.update(productRef, { stock: newStock });
                } else {
                    throw new Error(`Product with ID ${item.productId} not found.`);
                }
            }

            return { ...invoiceData, id: newInvoiceRef.id };
        });
    };

    const updateInvoice = async (invoiceId: string, updatedData: Partial<Omit<Invoice, 'id'>>, originalInvoice: Invoice) => {
        return runTransaction(db, async (transaction) => {
            const invoiceRef = doc(db, 'invoices', invoiceId);
            
            // 1. Get current invoice from transaction to avoid race conditions
            const currentInvoiceDoc = await transaction.get(invoiceRef);
            if (!currentInvoiceDoc.exists()) throw new Error("Invoice not found!");
            const currentInvoice = { id: currentInvoiceDoc.id, ...currentInvoiceDoc.data()} as Invoice;
            
            // 2. Update invoice
            transaction.update(invoiceRef, updatedData);

            const newInvoiceData = { ...currentInvoice, ...updatedData };

            // 3. Adjust customer aggregates
            const customerId = originalInvoice.customer.id;
            const customerRef = doc(db, 'customers', customerId);
            const customerDoc = await transaction.get(customerRef);
             if (!customerDoc.exists()) throw new Error("Customer not found!");
            const customerData = customerDoc.data();

            const amountDifference = newInvoiceData.amount - originalInvoice.amount;
            const paidAmountDifference = 
                (newInvoiceData.status === 'Paid' ? newInvoiceData.amount : 0) - 
                (originalInvoice.status === 'Paid' ? originalInvoice.amount : 0);
            
            transaction.update(customerRef, {
                totalInvoiced: customerData.totalInvoiced + amountDifference,
                totalPaid: customerData.totalPaid + paidAmountDifference,
            });
            
            // 4. Adjust stock levels
            const originalItems = originalInvoice.items;
            const newItems = newInvoiceData.items;

            // Create maps for easier lookup
            const originalItemsMap = new Map(originalItems.map(item => [item.productId, item.quantity]));
            const newItemsMap = new Map(newItems.map(item => [item.productId, item.quantity]));

            const allProductIds = new Set([...originalItemsMap.keys(), ...newItemsMap.keys()]);
            
            for(const productId of allProductIds) {
                const originalQty = originalItemsMap.get(productId) || 0;
                const newQty = newItemsMap.get(productId) || 0;
                const stockChange = originalQty - newQty; // If new > old, stockChange is positive (increase stock). If old > new, stockChange is negative (decrease stock).

                if(stockChange !== 0) {
                    const productRef = doc(db, 'products', productId);
                    const productDoc = await transaction.get(productRef);
                    if(productDoc.exists()) {
                         const currentStock = productDoc.data().stock;
                         if (currentStock < -stockChange) { // -stockChange is what we need to remove
                             throw new Error(`Not enough stock for ${productId}. Available: ${currentStock}, Additional required: ${-stockChange}`);
                         }
                        transaction.update(productRef, { stock: currentStock + stockChange });
                    }
                }
            }

        });
    };
    
     const removeInvoice = async (invoiceId: string) => {
        return runTransaction(db, async (transaction) => {
            const invoiceRef = doc(db, 'invoices', invoiceId);
            const invoiceDoc = await transaction.get(invoiceRef);
            if (!invoiceDoc.exists()) {
                throw new Error("Invoice not found!");
            }
            const invoiceData = {id: invoiceDoc.id, ...invoiceDoc.data()} as Invoice;

            // 1. Delete the invoice
            transaction.delete(invoiceRef);

            // 2. Update customer aggregates
            const customerRef = doc(db, 'customers', invoiceData.customer.id);
            const customerDoc = await transaction.get(customerRef);
            if (customerDoc.exists()) {
                const customerData = customerDoc.data();
                const newTotalInvoiced = customerData.totalInvoiced - invoiceData.amount;
                const newTotalPaid = customerData.totalPaid - (invoiceData.status === 'Paid' ? invoiceData.amount : 0);
                const newInvoicesCount = customerData.invoices - 1;
                transaction.update(customerRef, {
                    totalInvoiced: newTotalInvoiced,
                    totalPaid: newTotalPaid,
                    invoices: newInvoicesCount,
                });
            }

            // 3. Restore stock for each item
            for (const item of invoiceData.items) {
                const productRef = doc(db, 'products', item.productId);
                 const productDoc = await transaction.get(productRef);
                if (productDoc.exists()) {
                    const newStock = productDoc.data().stock + item.quantity;
                    transaction.update(productRef, { stock: newStock });
                }
            }
        });
    };


    return {
        ...baseDAO,
        add: addInvoice,
        update: updateInvoice,
        remove: removeInvoice,
    }
}

export const invoicesDAO = createInvoicesDAO();
export const productsDAO = createFirestoreDAO<Product>('products');
export const vendorsDAO = createFirestoreDAO<Vendor>('vendors');
export const purchasesDAO = createFirestoreDAO<Purchase>('purchases');
