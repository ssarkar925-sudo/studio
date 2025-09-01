
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { purchasesDAO, type Purchase } from '@/lib/data';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PurchaseDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: purchases, isLoading } = useFirestoreData(purchasesDAO);
  const [purchase, setPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const purchaseId = Array.isArray(params.id) ? params.id[0] : params.id;
      const foundPurchase = purchases.find((p) => p.id === purchaseId);
      if (foundPurchase) {
        setPurchase(foundPurchase);
      }
    }
  }, [params.id, purchases, isLoading]);

  if (isLoading || !purchase) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-4xl gap-2">
                <h1 className="text-2xl font-semibold">Loading...</h1>
            </div>
        </AppLayout>
    );
  }
  
  const subtotal = purchase.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold">Purchase Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <CardTitle>Purchase Order #{purchase.id.slice(0, 8)}</CardTitle>
                    <CardDescription>
                      From {purchase.vendorName}
                    </CardDescription>
                </div>
                <Badge variant={purchase.status === 'Received' ? 'default' : 'secondary'} className="shrink-0">{purchase.status}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                        <p>{purchase.orderDate}</p>
                    </div>
                     <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Received Date</p>
                        <p>{purchase.receivedDate || 'N/A'}</p>
                    </div>
                     <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                        <p>{purchase.vendorName}</p>
                    </div>
                </div>
                
                <div>
                    <h3 className='text-lg font-medium mb-2'>Items</h3>
                    <div className="overflow-x-auto">
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  <TableHead>Item</TableHead>
                                  <TableHead className="text-right">Quantity</TableHead>
                                  <TableHead className="text-right">Purchase Price</TableHead>
                                  <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {purchase.items.map((item, index) => (
                                  <TableRow key={index}>
                                      <TableCell className="min-w-[150px]">{item.productName}</TableCell>
                                      <TableCell className="text-right">{item.quantity}</TableCell>
                                      <TableCell className="text-right">₹{item.purchasePrice.toFixed(2)}</TableCell>
                                      <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                                  </TableRow>
                              ))}
                          </TableBody>
                      </Table>
                    </div>
                </div>
                
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end ml-auto w-full max-w-md">
                     <div className="grid gap-1 col-span-1 sm:col-start-1">
                        <p className="text-sm font-medium text-muted-foreground text-right">Subtotal</p>
                        <p className='text-right'>₹{subtotal.toFixed(2)}</p>
                    </div>
                     <div className="grid gap-1">
                        <p className="text-sm font-medium text-muted-foreground text-right">GST ({purchase.gst || 0}%)</p>
                        <p className='text-right'>₹{(subtotal * (purchase.gst || 0) / 100).toFixed(2)}</p>
                    </div>
                     <div className="grid gap-1">
                        <p className="text-sm font-medium text-muted-foreground text-right">Delivery</p>
                        <p className='text-right'>₹{(purchase.deliveryCharges || 0).toFixed(2)}</p>
                    </div>
                     <div className="grid gap-1">
                        <p className="text-sm font-medium text-muted-foreground text-right">Total Amount</p>
                        <p className='font-bold text-right'>₹{purchase.totalAmount.toFixed(2)}</p>
                    </div>
                 </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-end ml-auto w-full max-w-md">
                     <div className="grid gap-1 col-start-1 sm:col-start-3">
                        <p className="text-sm font-medium text-muted-foreground text-right">Paid</p>
                        <p className='text-right'>₹{(purchase.paymentDone).toFixed(2)}</p>
                    </div>
                     <div className="grid gap-1">
                        <p className="text-sm font-medium text-muted-foreground text-right">Due</p>
                        <p className='font-bold text-right'>₹{purchase.dueAmount.toFixed(2)}</p>
                    </div>
                 </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
