
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { productsDAO, purchasesDAO, type Product, type Purchase } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Printer, Barcode, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format, subDays, parse, differenceInDays } from 'date-fns';
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
import { useState, useMemo } from 'react';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useAuth } from '@/components/auth-provider';


// This component will handle both tabs logic now
export function InventoryClient({ activeTab, products: initialProducts, purchases: initialPurchases }: { activeTab: string, products?: Product[], purchases?: Purchase[] }) {
    if (activeTab === 'purchases') {
        return <PurchaseHistory purchases={initialPurchases || []} />;
    }
    return <StockHistory products={initialProducts || []} />;
}

function StockHistory({ products }: { products: Product[]}) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const visibleProducts = useMemo(() => {
    // Filter out items that have been out of stock for more than 30 days
    if (!user) return [];
    const now = new Date();
    const cleanupPromises: Promise<void>[] = [];
    
    const filtered = products.filter(product => {
        if (product.stock > 0) {
            return true;
        }
        if (product.outOfStockDate) {
            try {
                const outOfStockDate = parse(product.outOfStockDate, 'dd/MM/yyyy', new Date());
                const daysSinceOutOfStock = differenceInDays(now, outOfStockDate);
                
                if (daysSinceOutOfStock > 30) {
                    cleanupPromises.push(productsDAO.remove(product.id));
                    return false; // Don't show it and schedule for deletion
                }
                return true; // Show it as it's within 30 days
            } catch (e) {
                console.error("Error parsing outOfStockDate", product.outOfStockDate);
                return false; // Hide if date is invalid
            }
        }
        return false; // Hide if out of stock and no date
    });

    if (cleanupPromises.length > 0) {
      Promise.all(cleanupPromises).then(() => {
        toast({
          title: 'Inventory Cleaned',
          description: `${cleanupPromises.length} old out-of-stock item(s) automatically removed.`
        });
      }).catch(err => {
        console.error("Failed to cleanup old stock", err);
        toast({
            variant: 'destructive',
            title: 'Cleanup Failed',
            description: 'Could not remove old out-of-stock items.',
        });
      });
    }
    return filtered;
  }, [products, toast, user]);

  const allProductsSelected = useMemo(() => selectedProducts.length > 0 && selectedProducts.length === visibleProducts.length, [selectedProducts, visibleProducts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(visibleProducts.map(p => p.id));
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
    <>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className='flex items-center gap-4'>
          <div>
            <CardTitle>Stock History</CardTitle>
            <CardDescription>Manage your inventory, services, and their prices. Out-of-stock items are hidden automatically.</CardDescription>
          </div>
            {selectedProducts.length > 0 && (
            <div className='flex gap-2'>
              <Button variant="outline" size="sm" onClick={handlePrintTags}><Barcode /> Print Tags ({selectedProducts.length})</Button>
            </div>
          )}
        </div>
          <Button asChild className="w-full sm:w-auto">
          <Link href="/inventory/new">
            <PlusCircle />
            New Stock Entry
          </Link>
        </Button>
      </CardHeader>
      <div className="hidden md:block">
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
              {visibleProducts.map((product) => (
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
                    {product.stock <= 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                    ) : product.stock <= 10 ? (
                        <Badge variant="secondary">Low Stock</Badge>
                    ) : (
                        <Badge variant="default">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{product.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.batchCode}</TableCell>
                  <TableCell>
                    <AlertDialog>
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
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </div>

       <div className="md:hidden p-4 space-y-4">
        {visibleProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <Checkbox
                            className="mt-1"
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                            aria-label="Select row"
                        />
                         <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.sku}</div>
                        </div>
                    </div>
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
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Stock</div>
                    <div>{product.stock}</div>
                </div>
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Status</div>
                    <div>
                        {product.stock <= 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                        ) : product.stock <= 10 ? (
                            <Badge variant="secondary">Low Stock</Badge>
                        ) : (
                            <Badge variant="default">In Stock</Badge>
                        )}
                    </div>
                </div>
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Purchase Price</div>
                    <div>₹{product.purchasePrice.toFixed(2)}</div>
                </div>
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Selling Price</div>
                    <div>₹{product.sellingPrice.toFixed(2)}</div>
                </div>
                 <div className="grid gap-1 col-span-2">
                    <div className="text-muted-foreground">Batch Code</div>
                    <div>{product.batchCode}</div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

function PurchaseHistory({ purchases }: { purchases: Purchase[] }) {
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const { data: allProducts, isLoading: productsLoading } = useFirestoreData(productsDAO);

  const sortedPurchases = useMemo(() => {
    if (!purchases) return [];
    return [...purchases].sort((a, b) => {
        try {
            const dateA = parse(a.orderDate, 'dd/MM/yyyy', new Date()).getTime();
            const dateB = parse(b.orderDate, 'dd/MM/yyyy', new Date()).getTime();
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
    if (productsLoading || !user) {
      toast({ title: 'Please wait', description: 'Product data is loading.' });
      return;
    }
    
    try {
        const batchCode = `BCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        for (const item of purchase.items) {
            const totalItemsInPurchase = purchase.items.reduce((sum, i) => sum + i.quantity, 0) || 1;
            const perItemDeliveryCharge = (purchase.deliveryCharges || 0) / totalItemsInPurchase;
            const purchasePriceWithCharges = item.purchasePrice * (1 + (purchase.gst || 0) / 100) + perItemDeliveryCharge;

            if (item.isNew) {
                await productsDAO.add({
                    userId: user.uid,
                    name: item.productName,
                    purchasePrice: purchasePriceWithCharges,
                    sellingPrice: purchasePriceWithCharges * 1.5, // 50% markup
                    stock: item.quantity,
                    sku: `SKU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    batchCode: batchCode,
                });
            } else {
                const existingProduct = allProducts.find(p => p.id === item.productId);
                if(existingProduct) {
                    const newStock = existingProduct.stock + item.quantity;
                    const newPurchasePrice = ((existingProduct.purchasePrice * existingProduct.stock) + (purchasePriceWithCharges * item.quantity)) / newStock;
                    
                    await productsDAO.update(existingProduct.id, {
                        stock: newStock,
                        purchasePrice: newPurchasePrice,
                        sellingPrice: newPurchasePrice * 1.5, // Update selling price based on new average cost
                        batchCode: batchCode,
                    });
                }
            }
        }

        const updatedPurchase: Partial<Purchase> = {
            status: 'Received',
            receivedDate: format(new Date(), 'dd/MM/yyyy'),
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
     <>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
         <Button asChild className="w-full sm:w-auto">
            <Link href="/inventory/purchases/new">
                <PlusCircle />
                Add Purchase
            </Link>
        </Button>
      </CardHeader>

       <div className="hidden md:block">
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
       </div>

        <div className="md:hidden p-4 space-y-4">
        {sortedPurchases.map((purchase) => (
          <Card key={purchase.id}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <Checkbox
                            className="mt-1"
                            checked={selectedPurchases.includes(purchase.id)}
                            onCheckedChange={(checked) => handleSelectPurchase(purchase.id, checked as boolean)}
                            aria-label="Select row"
                        />
                        <div>
                            <div className="font-medium">{purchase.vendorName}</div>
                            <div className="text-sm text-muted-foreground">ID: {purchase.id.slice(0, 8)}...</div>
                        </div>
                    </div>
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
                </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Total</div>
                    <div>₹{purchase.totalAmount.toFixed(2)}</div>
                </div>
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Due</div>
                    <div>₹{purchase.dueAmount.toFixed(2)}</div>
                </div>
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Status</div>
                    <div><Badge variant={purchase.status === 'Received' ? 'default' : 'secondary'}>{purchase.status}</Badge></div>
                </div>
                <div className="grid gap-1">
                    <div className="text-muted-foreground">Order Date</div>
                    <div>{purchase.orderDate}</div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
