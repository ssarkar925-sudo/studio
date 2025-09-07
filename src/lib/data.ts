

import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, Unsubscribe, runTransaction, getDoc, FieldValue, serverTimestamp, deleteField, where, writeBatch, limit, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

type BaseDocument = {
    id: string;
    userId: string;
}

export type InvoiceItem = {
    productId: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    total: number;
}

export type Invoice = BaseDocument & {
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
  createdAt: FieldValue;
};

export type Customer = BaseDocument & {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  totalInvoiced: number;
  totalPaid: number;
  invoices: number;
};

export type Product = BaseDocument & {
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  sku: string;
  batchCode: string;
  outOfStockDate?: string;
};

export type Vendor = BaseDocument & {
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
    sku?: string;
    batchCode?: string;
}

export type Purchase = BaseDocument & {
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

export type BusinessProfile = BaseDocument & {
  companyName: string;
  logoUrl?: string;
  contactPerson?: string;
  contactNumber?: string;
  address?: string;
}

export type UserProfile = {
  id: string; // Here ID is the uid from Firebase Auth
  name: string;
  email: string;
  phone?: string;
  isAdmin?: boolean;
}

export type FeatureFlag = {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
};

// A helper function to check if db is initialized
const isDbInitialized = () => {
    return Object.keys(db).length > 0;
}

function createFirestoreDAO<T extends {id: string, userId?: string, createdAt?: FieldValue}>(collectionName: string) {
    const getCollectionRef = () => isDbInitialized() ? collection(db, collectionName) : null;

    const add = async (item: Omit<T, 'id' | 'createdAt'> & { userId: string }) => {
        const collectionRef = getCollectionRef();
        if (!collectionRef) return Promise.reject("Firestore is not initialized.");
        try {
            const newItem = {
                ...item,
                createdAt: serverTimestamp(),
            }
            const docRef = await addDoc(collectionRef, newItem);
            return { ...item, id: docRef.id, createdAt: new Date() } as unknown as T;
        } catch (error) {
             console.error(`Error writing to Firestore collection “${collectionName}”:`, error);
             throw error;
        }
    }
    
    const update = async (id: string, updatedItem: Partial<Omit<T, 'id' | 'userId'>>) => {
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, updatedItem);
        } catch (error) {
            console.error(`Error updating document in Firestore collection “${collectionName}”:`, error);
            throw error;
        }
    };

    const remove = async (id: string) => {
       if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
       try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
       } catch (error) {
           console.error(`Error deleting document from Firestore collection “${collectionName}”:`, error);
           throw error;
       }
    }
    
     const get = async (id: string): Promise<T | null> => {
        if (!isDbInitialized()) return null;
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as T : null;
    }

    const load = async (): Promise<T[]> => {
        const collectionRef = getCollectionRef();
        if (!collectionRef) return [];
        const snapshot = await getDocs(collectionRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    };

    const subscribe = (
      userId: string,
      callback: (data: T[]) => void,
      onError?: (error: Error) => void
    ): Unsubscribe => {
        const collectionRef = getCollectionRef();
        if (!collectionRef) {
            callback([]);
            return () => {}; // Return a no-op unsubscribe function
        }
        const q = query(collectionRef, where("userId", "==", userId));

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

    return { add, update, remove, subscribe, get, load };
}

// User Profile DAO is special as it uses the auth UID as the document ID
const userProfileDAO = {
    get: async (userId: string): Promise<UserProfile | null> => {
        if (!isDbInitialized()) return null;
        const docRef = doc(db, 'userProfile', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as UserProfile : null;
    },
    update: async (userId: string, data: Partial<Omit<UserProfile, 'id'>>) => {
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        const docRef = doc(db, 'userProfile', userId);
        await updateDoc(docRef, data);
    },
    remove: async (userId: string) => {
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        const docRef = doc(db, 'userProfile', userId);
        await deleteDoc(docRef);
    }
};

// Admin DAO to get all user profiles regardless of userId
const adminUsersDAO = {
    id: 'adminUsersDAO' as const,
    subscribe: (
        callback: (data: UserProfile[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe => {
        if (!isDbInitialized()) {
            callback([]);
            return () => {};
        }
        const collectionRef = collection(db, 'userProfile');
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            callback(data);
        }, (error) => {
            console.error(`Error subscribing to userProfile collection for admin:`, error);
            if (onError) {
                onError(error);
            }
        });
        return unsubscribe;
    }
};


export const customersDAO = createFirestoreDAO<Customer>('customers');
export const vendorsDAO = createFirestoreDAO<Vendor>('vendors');

const getInvoiceStatus = (dueAmount: number, paidAmount: number): Invoice['status'] => {
    if (dueAmount <= 0) return 'Paid';
    if (paidAmount > 0 && dueAmount > 0) return 'Partial';
    return 'Pending';
}


const createInvoicesDAO = () => {
    const baseDAO = createFirestoreDAO<Invoice>('invoices');

    const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'status' | 'createdAt'> & { status?: Invoice['status'], userId: string }) => {
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        return runTransaction(db, async (transaction) => {
            const customerRef = doc(db, 'customers', invoiceData.customer.id);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) {
                throw new Error("Customer not found!");
            }
            const customerData = customerDoc.data();

            const productDocs = new Map<string, any>();
            for (const item of invoiceData.items) {
                if (item.productId && !item.productId.startsWith('new_')) {
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await transaction.get(productRef);
                    if (!productDoc.exists() || productDoc.data().stock < item.quantity) {
                        throw new Error(`Not enough stock for ${item.productName}.`);
                    }
                    productDocs.set(item.productId, productDoc);
                }
            }

            const newInvoiceRef = doc(collection(db, 'invoices'));
            
            const finalInvoiceData = {
                ...invoiceData,
                createdAt: serverTimestamp(),
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
                if(item.productId && !item.productId.startsWith('new_')) {
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

            return { ...finalInvoiceData, id: newInvoiceRef.id, createdAt: new Date() };
        });
    };

    const updateInvoice = async (invoiceId: string, updatedData: Partial<Omit<Invoice, 'id'>>, originalInvoice: Invoice) => {
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        return runTransaction(db, async (transaction) => {
            const invoiceRef = doc(db, 'invoices', invoiceId);
            const currentInvoiceDoc = await transaction.get(invoiceRef);
            if (!currentInvoiceDoc.exists()) throw new Error("Invoice not found!");
            
            const customerRef = doc(db, 'customers', originalInvoice.customer.id);
            const customerDoc = await transaction.get(customerRef);
            if (!customerDoc.exists()) throw new Error("Customer not found!");
            const customerData = customerDoc.data();
            
            const newInvoiceData = { ...currentInvoiceDoc.data(), ...updatedData } as Invoice;

            if (updatedData.dueAmount !== undefined || updatedData.paidAmount !== undefined) {
                newInvoiceData.status = getInvoiceStatus(newInvoiceData.dueAmount!, newInvoiceData.paidAmount!);
            }

            const allProductIds = new Set([...originalInvoice.items.map(i => i.productId), ...newInvoiceData.items.map(i => i.productId)]);
            const productDocs = new Map<string, any>();
            for (const productId of allProductIds) {
                if (!productId || productId.startsWith('new_')) continue;
                const productRef = doc(db, 'products', productId);
                const productDoc = await transaction.get(productRef);
                 if (productDoc.exists()) {
                    productDocs.set(productId, productDoc);
                }
            }

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
                 if (!productId || productId.startsWith('new_')) continue;
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
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        return runTransaction(db, async (transaction) => {
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
                 if (item.productId && !item.productId.startsWith('new_')) {
                    const productRef = doc(db, 'products', item.productId);
                    const productDoc = await transaction.get(productRef);
                    if (productDoc.exists()) {
                        productDocs.set(item.productId, productDoc);
                    }
                }
            }

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
                 if(item.productId && !item.productId.startsWith('new_')) {
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

    const deleteAllForUser = async (userId: string) => {
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        const q = query(collection(db, 'invoices'), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    };

    return {
        ...baseDAO,
        add: addInvoice,
        update: updateInvoice,
        remove: removeInvoice,
        deleteAllForUser,
    }
}

// DAO for feature flags, which are not user-specific.
const featureFlagsDAO = {
    id: 'featureFlagsDAO',
    subscribe: (
        callback: (data: FeatureFlag[]) => void,
        onError?: (error: Error) => void
    ): Unsubscribe => {
        if (!isDbInitialized()) {
            callback([]);
            return () => {};
        }
        const collectionRef = collection(db, 'featureFlags');
        const unsubscribe = onSnapshot(collectionRef, (querySnapshot) => {
            if (querySnapshot.empty) {
                // If no flags exist, create the default ones
                const defaultFlags = [
                    { id: 'aiAnalysis', name: 'AI Dashboard Analysis', description: 'Enable or disable the AI-powered analysis on the main dashboard.', enabled: true },
                    { id: 'reportsPage', name: 'Reports Page', description: 'Toggle access to the detailed Reports page for all users.', enabled: true },
                ];
                const batch = writeBatch(db);
                defaultFlags.forEach(flag => {
                    const docRef = doc(db, 'featureFlags', flag.id);
                    batch.set(docRef, flag);
                });
                batch.commit().then(() => callback(defaultFlags)).catch(onError);
            } else {
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FeatureFlag));
                callback(data);
            }
        }, (error) => {
            console.error(`Error subscribing to featureFlags collection:`, error);
            if (onError) onError(error);
        });
        return unsubscribe;
    },
    update: async (id: string, updatedItem: Partial<Omit<FeatureFlag, 'id'>>) => {
        if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
        try {
            const docRef = doc(db, 'featureFlags', id);
            await updateDoc(docRef, updatedItem);
        } catch (error) {
            console.error(`Error updating document in featureFlags:`, error);
            throw error;
        }
    }
};

export const invoicesDAO = createInvoicesDAO();
export const productsDAO = createFirestoreDAO<Product>('products');
export const purchasesDAO = createFirestoreDAO<Purchase>('purchases');
export const businessProfileDAO = createFirestoreDAO<BusinessProfile>('businessProfile');
export { userProfileDAO, adminUsersDAO, featureFlagsDAO };

export const deleteAllUserData = async (userId: string) => {
    if (!isDbInitialized()) return Promise.reject("Firestore is not initialized.");
    console.log(`Deleting all data for user ${userId}`);
    const batch = writeBatch(db);

    const collections = ['customers', 'invoices', 'products', 'purchases', 'vendors', 'businessProfile'];
    
    for (const coll of collections) {
        const q = query(collection(db, coll), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => batch.delete(doc.ref));
    }
    
    const userProfileRef = doc(db, 'userProfile', userId);
    batch.delete(userProfileRef);
    
    await batch.commit();
    console.log(`Successfully deleted all data for user ${userId}`);
};
