
'use client';

import { PrintLayout } from '@/app/print-layout';
import { purchasesDAO, type Purchase } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PrintPurchasePage() {
  const params = useParams();
  const purchaseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: purchases, isLoading } = useFirestoreData(purchasesDAO);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!isLoading && purchases.length > 0) {
      const foundPurchase = purchases.find((p) => p.id === purchaseId);
      setPurchase(foundPurchase || null);
    }
  }, [purchaseId, purchases, isLoading]);

  useEffect(() => {
    if (purchase && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        window.print();
    }
  }, [purchase, isLoading]);

  if (isLoading || !purchase) {
    return <div>Loading...</div>;
  }
  
  const subtotal = purchase.items.reduce((sum, item) => sum + item.total, 0);

  return (
    <PrintLayout>
      <div className="flex justify-between items-start mb-8">
        <div>
            <h1 className="text-2xl font-bold">Purchase Order #{purchase.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">From {purchase.vendorName}</p>
        </div>
        <Badge variant={purchase.status === 'Received' ? 'default' : 'secondary'}>{purchase.status}</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="grid gap-1">
                <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                <p>{purchase.orderDate}</p>
            </div>
            <div className="grid gap-1">
                <p className="text-sm font-medium text-muted-foreground">Received Date</p>
                <p>{purchase.receivedDate || 'N/A'}</p>
            </div>
            <div className="grid gap-1">
                <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                <p>{purchase.vendorName}</p>
            </div>
        </div>

        <h3 className='text-lg font-medium mb-2'>Items</h3>
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
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>

        <div className="grid grid-cols-4 gap-4 items-end ml-auto w-full max-w-sm mt-8">
            <div className="grid gap-1 col-span-2 text-right">
                <p className="text-sm font-medium text-muted-foreground">Subtotal</p>
            </div>
            <div className="grid gap-1 col-span-2 text-right">
                <p>₹{subtotal.toFixed(2)}</p>
            </div>

            <div className="grid gap-1 col-span-2 text-right">
                <p className="text-sm font-medium text-muted-foreground">GST ({purchase.gst || 0}%)</p>
            </div>
            <div className="grid gap-1 col-span-2 text-right">
                <p>₹{(subtotal * (purchase.gst || 0) / 100).toFixed(2)}</p>
            </div>

            <div className="grid gap-1 col-span-2 text-right">
                <p className="text-sm font-medium text-muted-foreground">Delivery</p>
            </div>
            <div className="grid gap-1 col-span-2 text-right">
                <p>₹{(purchase.deliveryCharges || 0).toFixed(2)}</p>
            </div>
            
            <div className="grid gap-1 col-span-2 text-right font-bold">
                <p className="text-sm">Total Amount</p>
            </div>
            <div className="grid gap-1 col-span-2 text-right font-bold">
                <p>₹{purchase.totalAmount.toFixed(2)}</p>
            </div>

            <div className="grid gap-1 col-span-2 text-right">
                <p className="text-sm font-medium text-muted-foreground">Paid</p>
            </div>
            <div className="grid gap-1 col-span-2 text-right">
                <p>₹{(purchase.paymentDone).toFixed(2)}</p>
            </div>

            <div className="grid gap-1 col-span-2 text-right font-bold">
                <p className="text-sm">Due</p>
            </div>
            <div className="grid gap-1 col-span-2 text-right font-bold">
                <p>₹{purchase.dueAmount.toFixed(2)}</p>
            </div>
        </div>

    </PrintLayout>
  );
}
