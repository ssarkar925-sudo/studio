'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { productsDAO, purchasesDAO, type Purchase, type Product } from '@/lib/data';
import { Button } from './ui/button';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';
import { Checkbox } from './ui/checkbox';
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
import { useLocalStorageData } from '@/hooks/use-local-storage-data';
import { useRouter } from 'next/navigation';

export function PurchaseHistory() {
  const { data: purchases, setData: setPurchases } = useLocalStorageData(purchasesDAO);
  const [selectedPurchases, setSelectedPurchases] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => b.id.localeCompare(a.id));
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

  const handleDeleteSelected = () => {
    selectedPurchases.forEach(id => {
      const purchase = purchases.find(p => p.id === id);
      if (purchase?.status !== 'Received') {
        purchasesDAO.remove(id);
      } else {
         toast({
            variant: 'destructive',
            title: 'Delete Error',
            description: `Cannot delete received purchase order ${purchase.id.slice(0,8)}...`,
        });
      }
    });
    // Data will refresh via hook
    toast({
        title: 'Purchases Deleted',
        description: `Selected pending purchase(s) have been deleted.`,
    });
    setSelectedPurchases([]);
  };

  const handleMarkAsReceived = (purchase: Purchase) => {
    const allProducts = productsDAO.load();
    
    purchase.items.forEach(item => {
        const totalItemsInPurchase = purchase.items.reduce((sum, i) => sum + i.quantity, 0) || 1;
        const perItemDeliveryCharge = (purchase.deliveryCharges || 0) / totalItemsInPurchase;
        const purchasePriceWithCharges = item.purchasePrice * (1 + (purchase.gst || 0) / 100) + perItemDeliveryCharge;

        if (item.isNew) {
            productsDAO.add({
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
                productsDAO.add({
                    name: existingProduct.name,
                    purchasePrice: purchasePriceWithCharges,
                    sellingPrice: purchasePriceWithCharges * 1.5,
                    stock: item.quantity,
                    sku: existingProduct.sku,
                    batchCode: `BCH-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`.toUpperCase(),
                });
            }
        }
    });


    const updatedPurchase: Partial<Purchase> = {
        status: 'Received',
        receivedDate: format(new Date(), 'PPP'),
    };
    purchasesDAO.update(purchase.id, updatedPurchase);

    toast({
        title: 'Purchase Received',
        description: `Stock has been updated for purchase order ${purchase.id.slice(0,8)}...`,
    });
  }


  const handleAction = (action: string, purchase: Purchase) => {
    if (action === 'Mark as Received') {
        handleMarkAsReceived(purchase);
    } else if (action === 'Edit') {
        router.push(`/inventory/purchases/${purchase.id}/edit`);
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
              <TableHead>Received Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
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
                <TableCell>{purchase.receivedDate || 'N/A'}</TableCell>
                <TableCell className="text-right">₹{purchase.totalAmount.toFixed(2)}</TableCell>
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
