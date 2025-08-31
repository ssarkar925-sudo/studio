'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { productsDAO, purchasesDAO, type Purchase, type Product } from '@/lib/data';
import { Button } from './ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

export function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setPurchases(purchasesDAO.load());
  }, []);

  const handleMarkAsReceived = (purchase: Purchase) => {
    const allProducts = productsDAO.load();

    purchase.items.forEach(item => {
        const productIndex = allProducts.findIndex(p => p.id === item.productId);
        if (productIndex > -1) {
            allProducts[productIndex].stock += item.quantity;
        } else {
            // If the product doesn't exist, commit it to the DAO
            const newProduct: Product = {
                id: item.productId,
                name: item.productName,
                price: item.purchasePrice * 1.5, // Default 50% markup
                stock: item.quantity,
            };
            productsDAO.commit(newProduct);
            // After commit, allProducts in memory is stale, we could reload or just add it
            allProducts.push(newProduct);
        }
    });

    productsDAO.save(allProducts);

    const updatedPurchase: Partial<Purchase> = {
        status: 'Received',
        receivedDate: format(new Date(), 'PPP'),
    };
    purchasesDAO.update(purchase.id, updatedPurchase);

    // Refresh purchase list
    setPurchases(purchasesDAO.load());

    toast({
        title: 'Purchase Received',
        description: `Stock has been updated for purchase order ${purchase.id.slice(0,8)}...`,
    });
  }


  const handleAction = (action: string, purchase: Purchase) => {
    if (action === 'Mark as Received') {
        handleMarkAsReceived(purchase);
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
        <div>
            <CardTitle>Purchase History</CardTitle>
            <CardDescription>View and manage all your purchase orders.</CardDescription>
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
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
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
