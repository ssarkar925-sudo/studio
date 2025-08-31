'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { purchasesDAO, type Purchase } from '@/lib/data';
import { Button } from './ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setPurchases(purchasesDAO.load());
  }, []);

  const handleAction = (action: string, purchaseId: string) => {
     toast({
        title: `${action} Purchase`,
        description: `You have selected to ${action.toLowerCase()} purchase. This feature is not yet implemented.`,
      });
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
                        <DropdownMenuItem onSelect={() => handleAction('View', purchase.id)}>View</DropdownMenuItem>
                        {purchase.status === 'Pending' && <DropdownMenuItem onSelect={() => handleAction('Mark as Received', purchase.id)}>Mark as Received</DropdownMenuItem>}
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
