
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { productsDAO, purchasesDAO, type Product, type Purchase } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2, Printer, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
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
    setProducts(initialProducts);
  }, [initialProducts]);
  
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

  const handleDelete = async (productId: string) => {
    await productsDAO.remove(productId);
    toast({
      title: 'Item Deleted',
      description: 'The inventory item has been successfully deleted.',
    });
    router.refresh();
  };

  const handleDeleteSelected = async () => {
    const promises = selectedProducts.map(id => productsDAO.remove(id));
    await Promise.all(promises);
    toast({
        title: 'Items Deleted',
        description: `${selectedProducts.length} item(s) have been deleted.`,
    });
    setSelectedProducts([]);
    router.refresh();
  };

  const handleAction = (action: string, productId: string, productName: string) => {
    if (action === 'View') {
      router.push(`/inventory/${productId}`);
    } else if (action === 'Edit') {
      toast({
        title: `${action} Inventory Item`,
        description: `You have selected to ${action.toLowerCase()} ${productName}. This feature is not yet implemented.`,
      });
    } else if (action === 'Print' || action === 'Download') {
        toast({
            title: 'Coming Soon!',
            description: `The ${action.toLowerCase()} functionality is not yet implemented.`,
        });
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 /> Delete ({selectedProducts.length})</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {selectedProducts.length} item(s).
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
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleAction('View', product.id, product.name)}>View</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('Edit', product.id, product.name)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('Print', product.id, product.name)}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('Download', product.id, product.name)}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                       <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the item &quot;{product.name}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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

  useEffect(() => {
    setPurchases(initialPurchases);
  }, [initialPurchases]);

  const sortedPurchases = useMemo(() => {
    if (!purchases) return [];
    return [...purchases].sort((a, b) => {
        try {
            // Handle cases where orderDate might not be a valid date string
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

    await Promise.all(deletionPromises);

    if (deletionPromises.length > 0) {
      toast({
          title: 'Purchases Deleted',
          description: `Selected pending purchase(s) have been deleted.`,
      });
    }
    setSelectedPurchases([]);
    router.refresh();
  };

  const handleMarkAsReceived = async (purchase: Purchase) => {
    // This now requires fetching all products on the client, which is not ideal
    // but necessary for this refactor.
    const allProducts = await productsDAO.load();
    
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
                batchCode: `BCH-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`.toUpperCase(),
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
                    batchCode: `BCH-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`.toUpperCase(),
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
    router.refresh();
  }


  const handleAction = (action: string, purchase: Purchase) => {
    if (action === 'Mark as Received') {
        handleMarkAsReceived(purchase);
    } else if (action === 'Edit') {
        router.push(`/inventory/purchases/${purchase.id}/edit`);
    } else if (action === 'View') {
        router.push(`/inventory/purchases/${purchase.id}`);
    } else if (action === 'Print' || action === 'Download') {
        toast({
            title: 'Coming Soon!',
            description: `The ${action.toLowerCase()} functionality is not yet implemented.`,
        });
    } else {
         toast({
            title: `${action} Purchase`,
            description: `You have selected to ${action.toLowerCase()} purchase. This feature is not yet implemented.`,
        });
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
                        <Button variant="destructive" size="sm"><Trash2 /> Delete ({selectedPurchases.length})</Button>
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
                        <DropdownMenuItem onSelect={() => handleAction('Download', purchase)}><Download className="mr-2 h-4 w-4" />Download</DropdownMenuItem>
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
