
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, Unsubscribe, runTransaction, getDoc, FieldValue, serverTimestamp, deleteField } from 'firebase/firestore';
import { format } from 'date-fns';

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
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  items: InvoiceItem[];
  subtotal: number;
  gstPercentage?: number;
  gstAmount?: number;
  deliveryCharges?: number;
  discount?: number;
  amount: number; // This will now be the final total amount
  paidAmount?: number;
  dueAmount?: number;
  orderNote?: string;
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
  outOfStockDate?: string;
};

export type Vendor = {
  id: string;
  vendorName: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  gstn?: string;
  address?: string;
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

export type BusinessProfile = {
  id: string;
  companyName: string;
  contactPerson?: string;
  contactNumber?: string;
  address?: string;
}

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

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
    
    const get = async (id: string): Promise<T | null> => {
        try {
            const docRef = doc(db, collectionName, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as T;
            } else {
                return null;
            }
        } catch (error) {
            console.error(`Error getting document from Firestore collection “${collectionName}”:`, error);
            throw new Error(`Failed to get document ${id} from ${collectionName}`);
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

    return { load, get, add, update, remove, subscribe };
}

export const customersDAO = createFirestoreDAO<Customer>('customers');

const getInvoiceStatus = (dueAmount: number, paidAmount: number): Invoice['status'] => {
    if (dueAmount <= 0) return 'Paid';
    if (paidAmount > 0 && dueAmount > 0) return 'Partial';
    // Overdue logic can be added here based on dueDate
    return 'Pending';
}


const createInvoicesDAO = () => {
    const baseDAO = createFirestoreDAO<Invoice>('invoices');

    const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'status'> & { status?: Invoice['status'] }) => {
        return runTransaction(db, async (transaction) => {
            // --- READS FIRST ---
            const customerRef = doc(db, 'customers', invoiceData.customer.id);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) {
                throw new Error("Customer not found!");
            }
            const customerData = customerDoc.data();

            const productDocs = new Map<string, any>();
            for (const item of invoiceData.items) {
                if (item.productId) { // Only check stock for inventory items
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await transaction.get(productRef);
                    if (!productDoc.exists() || productDoc.data().stock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.productName}.`);
                    }
                    productDocs.set(item.productId, productDoc);
                }
            }

            // --- WRITES AFTER ---
            const newInvoiceRef = doc(collection(db, 'invoices'));
            
            const finalInvoiceData = {
                ...invoiceData,
                status: getInvoiceStatus(invoiceData.dueAmount || 0, invoiceData.paidAmount || 0)
            }
            
            transaction.set(newInvoiceRef, finalInvoiceData);

            const newTotalInvoiced = (customerData.totalInvoiced || 0) + invoiceData.amount;
            const newTotalPaid = (customerData.totalPaid || 0) + (invoiceData.paidAmount || 0);
            const newInvoicesCount = (customerData.invoices || 0) + 1;
            
            transaction.update(customerRef, {
                totalInvoiced: newTotalInvoiced,
                totalPaid: newTotalPaid,
                invoices: newInvoicesCount,
            });

            for (const item of invoiceData.items) {
                if(item.productId) {
                    const productDoc = productDocs.get(item.productId);
                    if (productDoc) {
                        const productRef = doc(db, 'products', item.productId);
                        const newStock = productDoc.data().stock - item.quantity;
                        
                        const productUpdate: {[k: string]: any} = { stock: newStock };
                        if (newStock <= 0) {
                            productUpdate.outOfStockDate = format(new Date(), 'dd/MM/yyyy');
                        }
                        transaction.update(productRef, productUpdate);
                    }
                }
            }

            return { ...finalInvoiceData, id: newInvoiceRef.id };
        });
    };

    const updateInvoice = async (invoiceId: string, updatedData: Partial<Omit<Invoice, 'id'>>, originalInvoice: Invoice) => {
        return runTransaction(db, async (transaction) => {
            // --- READS FIRST ---
            const invoiceRef = doc(db, 'invoices', invoiceId);
            const currentInvoiceDoc = await transaction.get(invoiceRef);
            if (!currentInvoiceDoc.exists()) throw new Error("Invoice not found!");
            
            const customerRef = doc(db, 'customers', originalInvoice.customer.id);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) throw new Error("Customer not found!");
            const customerData = customerDoc.data();
            
            const newInvoiceData = { ...currentInvoiceDoc.data(), ...updatedData } as Invoice;

             // Recalculate status
            if (updatedData.dueAmount !== undefined || updatedData.paidAmount !== undefined) {
                newInvoiceData.status = getInvoiceStatus(newInvoiceData.dueAmount!, newInvoiceData.paidAmount!);
            }


            const allProductIds = new Set([...originalInvoice.items.map(i => i.productId), ...newInvoiceData.items.map(i => i.productId)]);
            const productDocs = new Map<string, any>();
            for (const productId of allProductIds) {
                if (!productId) continue;
                const productRef = doc(db, 'products', productId);
                const productDoc = await transaction.get(productRef);
                 if (productDoc.exists()) {
                    productDocs.set(productId, productDoc);
                }
            }

            // --- WRITES AFTER ---
            transaction.update(invoiceRef, newInvoiceData as any);

            const amountDifference = newInvoiceData.amount - originalInvoice.amount;
            const paidAmountDifference = (newInvoiceData.paidAmount || 0) - (originalInvoice.paidAmount || 0);
            
            transaction.update(customerRef, {
                totalInvoiced: customerData.totalInvoiced + amountDifference,
                totalPaid: customerData.totalPaid + paidAmountDifference,
            });
            
            const originalItemsMap = new Map(originalInvoice.items.map(item => [item.productId, item.quantity]));
            const newItemsMap = new Map(newInvoiceData.items.map(item => [item.productId, item.quantity]));
            
            for(const productId of allProductIds) {
                 if (!productId) continue;
                const originalQty = originalItemsMap.get(productId) || 0;
                const newQty = newItemsMap.get(productId) || 0;
                const stockChange = originalQty - newQty;

                if(stockChange !== 0) {
                    const productDoc = productDocs.get(productId);
                    if (productDoc) {
                        const productRef = doc(db, 'products', productId);
                        const currentStock = productDoc.data().stock;
                         if (currentStock + stockChange < 0) {
                             throw new Error(`Not enough stock for product ID ${productId}.`);
                         }
                        const newStock = currentStock + stockChange;
                        const productUpdate: {[k: string]: any} = { stock: newStock };
                        if (newStock <= 0) {
                           productUpdate.outOfStockDate = format(new Date(), 'dd/MM/yyyy');
                        } else if (newStock > 0 && productDoc.data().outOfStockDate) {
                           productUpdate.outOfStockDate = deleteField();
                        }
                        transaction.update(productRef, productUpdate);
                    }
                }
            }
        });
    };
    
     const removeInvoice = async (invoiceId: string) => {
        return runTransaction(db, async (transaction) => {
            // --- READS FIRST ---
            const invoiceRef = doc(db, 'invoices', invoiceId);
            const invoiceDoc = await transaction.get(invoiceRef);
            if (!invoiceDoc.exists()) {
                throw new Error("Invoice not found!");
            }
            const invoiceData = {id: invoiceDoc.id, ...invoiceDoc.data()} as Invoice;

            const customerRef = doc(db, 'customers', invoiceData.customer.id);
            const customerDoc = await transaction.get(customerRef);
            
            const productDocs = new Map<string, any>();
            for (const item of invoiceData.items) {
                 if (item.productId) {
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        productDocs.set(item.productId, productDoc);
                    }
                }
            }

            // --- WRITES AFTER ---
            transaction.delete(invoiceRef);

            if (customerDoc.exists()) {
                const customerData = customerDoc.data();
                const newTotalInvoiced = customerData.totalInvoiced - invoiceData.amount;
                const newTotalPaid = customerData.totalPaid - (invoiceData.paidAmount || 0);
                const newInvoicesCount = customerData.invoices - 1;
                transaction.update(customerRef, {
                    totalInvoiced: newTotalInvoiced,
                    totalPaid: newTotalPaid,
                    invoices: newInvoicesCount,
                });
            }

            for (const item of invoiceData.items) {
                 if(item.productId) {
                    const productDoc = productDocs.get(item.productId);
                    if(productDoc) {
                        const productRef = doc(db, 'products', item.productId);
                        const currentStock = productDoc.data().stock;
                        const newStock = currentStock + item.quantity;
                        const productUpdate: {[k: string]: any} = { stock: newStock };
                        if (currentStock <= 0 && newStock > 0) {
                           productUpdate.outOfStockDate = deleteField();
                        }
                        transaction.update(productRef, productUpdate);
                    }
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
export const businessProfileDAO = createFirestoreDAO<BusinessProfile>('businessProfile');
export const userProfileDAO = createFirestoreDAO<UserProfile>('userProfile');
