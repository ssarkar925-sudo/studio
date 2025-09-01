
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { productsDAO, purchasesDAO, type Product, type Purchase } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Printer, Barcode } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, subDays, parse } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { useFirestoreData } from '@/hooks/use-firestore-data';


// This component will handle both tabs logic now
export function InventoryClient({ activeTab, products: initialProducts, purchases: initialPurchases }: { activeTab: string, products?: Product[], purchases?: Purchase[] }) {
    if (activeTab === 'purchases') {
        return <PurchaseHistory initialPurchases={initialPurchases || []} />;
    }
    return <StockHistory initialProducts={initialProducts || []} />;
}

function StockHistory({ initialProducts }: { initialProducts: Product[]}) {
  const { toast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    async function deleteOldOutOfStockItems() {
        const oneMonthAgo = subDays(new Date(), 30);
        const oldItemsToDelete = initialProducts.filter(p => {
            if (p.stock > 0 || !p.outOfStockDate) {
                return false;
            }
            try {
                const outOfStockDate = parse(p.outOfStockDate, 'PPP', new Date());
                return outOfStockDate < oneMonthAgo;
            } catch (e) {
                return false;
            }
        });

        if (oldItemsToDelete.length > 0) {
            const deletionPromises = oldItemsToDelete.map(p => productsDAO.remove(p.id));
            try {
                await Promise.all(deletionPromises);
                toast({
                    title: 'Auto-cleaned Inventory',
                    description: `${oldItemsToDelete.length} item(s) out of stock for over a month were automatically deleted.`,
                });
            } catch (error) {
                console.error("Failed to auto-delete old stock", error);
            }
        }
    }

    deleteOldOutOfStockItems();
    // Only show items that are in stock
    setProducts(initialProducts.filter(p => p.stock > 0));

  }, [initialProducts, toast]);
  
  const allProductsSelected = useMemo(() => selectedProducts.length > 0 && selectedProducts.length === products.length, [selectedProducts, products]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handlePrintTags = () => {
    const query = new URLSearchParams({ ids: selectedProducts.join(',') });
    const url = `/inventory/tags/print?${query.toString()}`;
    const printWindow = window.open(url, '_blank');
    printWindow?.focus();
  };

  const handleAction = (action: string, productId: string) => {
    const url = `/inventory/${productId}`;
    if (action === 'View') {
      router.push(url);
    } else if (action === 'Edit') {
      router.push(`${url}/edit`);
    } else if (action === 'Print') {
        const printWindow = window.open(`${url}/print`, '_blank');
        printWindow?.focus();
    }
  };

  return (
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className='flex items-center gap-4'>
            <div>
              <CardTitle>Stock History</CardTitle>
              <CardDescription>Manage your inventory, services, and their prices.</CardDescription>
            </div>
             {selectedProducts.length > 0 && (
              <div className='flex gap-2'>
                <Button variant="outline" size="sm" onClick={handlePrintTags}><Barcode /> Print Tags ({selectedProducts.length})</Button>
              </div>
            )}
          </div>
           <Button asChild>
            <Link href="/inventory/new">
              <PlusCircle />
              New Stock Entry
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-12">
                    <Checkbox
                      checked={allProductsSelected}
                      onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                      aria-label="Select all"
                    />
                  </TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Purchase Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Batch Code</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} data-state={selectedProducts.includes(product.id) && "selected"}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell>
                    {product.stock <= 10 ? (
                        <Badge variant="destructive">Low Stock</Badge>
                    ) : (
                        <Badge variant="default">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{product.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.batchCode}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleAction('View', product.id)}>View</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Edit', product.id)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Print', product.id)}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
  );
}

function PurchaseHistory({ initialPurchases }: { initialPurchases: Purchase[] }) {
  const [purchases, setPurchases] = useState(initialPurchases);
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { data: allProducts, isLoading: productsLoading } = useFirestoreData(productsDAO);

  useEffect(() => {
    async function deleteOldPendingPurchases() {
        const oneMonthAgo = subDays(new Date(), 30);
        const oldPendingPurchases = initialPurchases.filter(p => {
            try {
                const orderDate = new Date(p.orderDate);
                return p.status === 'Pending' && orderDate < oneMonthAgo;
            } catch (e) {
                return false;
            }
        });
        
        if (oldPendingPurchases.length > 0) {
            const deletionPromises = oldPendingPurchases.map(p => purchasesDAO.remove(p.id));
            try {
                await Promise.all(deletionPromises);
                toast({
                    title: 'Auto-cleaned Purchases',
                    description: `${oldPendingPurchases.length} pending purchase(s) older than 1 month were automatically deleted.`,
                });
            } catch (error) {
                 console.error("Failed to auto-delete old purchases", error);
            }
        }
    }
    
    deleteOldPendingPurchases();
    setPurchases(initialPurchases);
  }, [initialPurchases, toast]);

  const sortedPurchases = useMemo(() => {
    if (!purchases) return [];
    return [...purchases].sort((a, b) => {
        try {
            const dateA = new Date(a.orderDate).getTime();
            const dateB = new Date(b.orderDate).getTime();
            if (isNaN(dateA) || isNaN(dateB)) return 0;
            return dateB - dateA;
        } catch (e) {
            return 0;
        }
    });
  }, [purchases]);
  
  const allPurchasesSelected = useMemo(() => selectedPurchases.length > 0 && selectedPurchases.length === purchases.length, [selectedPurchases, purchases]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPurchases(purchases.map(p => p.id));
    } else {
      setSelectedPurchases([]);
    }
  };

  const handleSelectPurchase = (purchaseId: string, checked: boolean) => {
    if (checked) {
      setSelectedPurchases(prev => [...prev, purchaseId]);
    } else {
      setSelectedPurchases(prev => prev.filter(id => id !== purchaseId));
    }
  };

  const handleDeleteSelected = async () => {
    const deletionPromises: Promise<void>[] = [];
    selectedPurchases.forEach(id => {
      const purchase = purchases.find(p => p.id === id);
      if (purchase?.status !== 'Received') {
        deletionPromises.push(purchasesDAO.remove(id));
      } else {
         toast({
            variant: 'destructive',
            title: 'Delete Error',
            description: `Cannot delete received purchase order ${purchase.id.slice(0,8)}...`,
        });
      }
    });

    try {
        await Promise.all(deletionPromises);

        if (deletionPromises.length > 0) {
          toast({
              title: 'Purchases Deleted',
              description: `Selected pending purchase(s) have been deleted.`,
          });
        }
        setSelectedPurchases([]);
    } catch(error) {
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: 'An error occurred while deleting purchases.'
        })
    }
  };

  const handleMarkAsReceived = async (purchase: Purchase) => {
    if (productsLoading) {
      toast({ title: 'Please wait', description: 'Product data is loading.' });
      return;
    }
    
    try {
        const batchCode = `BCH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();

        for (const item of purchase.items) {
            const totalItemsInPurchase = purchase.items.reduce((sum, i) => sum + i.quantity, 0) || 1;
            const perItemDeliveryCharge = (purchase.deliveryCharges || 0) / totalItemsInPurchase;
            const purchasePriceWithCharges = item.purchasePrice * (1 + (purchase.gst || 0) / 100) + perItemDeliveryCharge;

            if (item.isNew) {
                await productsDAO.add({
                    name: item.productName,
                    purchasePrice: purchasePriceWithCharges,
                    sellingPrice: purchasePriceWithCharges * 1.5, // 50% markup
                    stock: item.quantity,
                    sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
                    batchCode: batchCode,
                });
            } else {
                const existingProduct = allProducts.find(p => p.id === item.productId);
                // This is a new batch of an existing product, create a new entry.
                if(existingProduct) {
                    await productsDAO.add({
                        name: existingProduct.name,
                        purchasePrice: purchasePriceWithCharges,
                        sellingPrice: purchasePriceWithCharges * 1.5,
                        stock: item.quantity,
                        sku: existingProduct.sku,
                        batchCode: batchCode,
                    });
                }
            }
        }

        const updatedPurchase: Partial<Purchase> = {
            status: 'Received',
            receivedDate: format(new Date(), 'PPP'),
        };
        await purchasesDAO.update(purchase.id, updatedPurchase);

        toast({
            title: 'Purchase Received',
            description: `Stock has been updated for purchase order ${purchase.id.slice(0,8)}...`,
        });
    } catch (error) {
        console.error('Failed to mark purchase as received', error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to update stock. Please try again.',
        });
    }
  }


  const handleAction = (action: string, purchase: Purchase) => {
    const url = `/inventory/purchases/${purchase.id}`;
    if (action === 'Mark as Received') {
        handleMarkAsReceived(purchase);
    } else if (action === 'Edit') {
        router.push(`${url}/edit`);
    } else if (action === 'View') {
        router.push(url);
    } else if (action === 'Print') {
        const printWindow = window.open(`${url}/print`, '_blank');
        printWindow?.focus();
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className='flex items-center gap-4'>
            <div>
                <CardTitle>Purchase History</CardTitle>
                <CardDescription>View and manage all your purchase orders.</CardDescription>
            </div>
             {selectedPurchases.length > 0 && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Delete ({selectedPurchases.length})</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedPurchases.length} purchase(s). Only pending orders can be deleted.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}
        </div>
        <Button asChild>
            <Link href="/inventory/purchases/new">
                <PlusCircle />
                Add Purchase
            </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                   <Checkbox
                    checked={allPurchasesSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all"
                  />
                </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPurchases.map((purchase) => (
              <TableRow key={purchase.id} data-state={selectedPurchases.includes(purchase.id) && "selected"}>
                <TableCell>
                    <Checkbox
                      checked={selectedPurchases.includes(purchase.id)}
                      onCheckedChange={(checked) => handleSelectPurchase(purchase.id, checked as boolean)}
                      aria-label="Select row"
                    />
                  </TableCell>
                <TableCell className="font-medium">{purchase.id.slice(0, 8)}...</TableCell>
                <TableCell>{purchase.vendorName}</TableCell>
                <TableCell>{purchase.orderDate}</TableCell>
                <TableCell className="text-right">₹{purchase.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{purchase.paymentDone.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{purchase.dueAmount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={purchase.status === 'Received' ? 'default' : 'secondary'}>{purchase.status}</Badge>
                </TableCell>
                 <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleAction('View', purchase)}>View</DropdownMenuItem>
                        {purchase.status === 'Pending' && <DropdownMenuItem onSelect={() => handleAction('Edit', purchase)}>Edit</DropdownMenuItem>}
                        {purchase.status === 'Pending' && <DropdownMenuItem onSelect={() => handleAction('Mark as Received', purchase)}>Mark as Received</DropdownMenuItem>}
                        <DropdownMenuItem onSelect={() => handleAction('Print', purchase)}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
