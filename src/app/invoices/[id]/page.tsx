
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
import { invoicesDAO, type Invoice } from '@/lib/data';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variant = {
    Paid: 'default',
    Pending: 'secondary',
    Overdue: 'destructive',
  }[status] as 'default' | 'secondary' | 'destructive';

  return <Badge variant={variant} className="capitalize">{status.toLowerCase()}</Badge>;
}

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: invoices, isLoading } = useFirestoreData(invoicesDAO);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
      const foundInvoice = invoices.find((i) => i.id === invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      }
    }
  }, [params.id, invoices, isLoading]);

  if (isLoading || !invoice) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-4xl gap-2">
                <h1 className="text-2xl font-semibold">Loading...</h1>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold">Invoice Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
                    <CardDescription>
                      For {invoice.customer.name}
                    </CardDescription>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Customer</p>
                        <p>{invoice.customer.name}</p>
                        <p className='text-sm text-muted-foreground'>{invoice.customer.email}</p>
                    </div>
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                        <p>{invoice.issueDate}</p>
                    </div>
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                        <p>{invoice.dueDate}</p>
                    </div>
                </div>
                <Separator />
                 <div className="grid gap-3">
                    <h3 className="text-lg font-medium">Items</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-medium">₹{item.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex justify-end">
                    <div className="grid gap-2 w-full max-w-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{invoice.subtotal.toFixed(2)}</span>
                        </div>
                        {invoice.gstAmount !== undefined && (
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">GST ({invoice.gstPercentage || 0}%)</span>
                                <span>₹{invoice.gstAmount.toFixed(2)}</span>
                            </div>
                        )}
                        {invoice.deliveryCharges !== undefined && invoice.deliveryCharges > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delivery</span>
                                <span>₹{invoice.deliveryCharges.toFixed(2)}</span>
                            </div>
                        )}
                        {invoice.discount !== undefined && invoice.discount > 0 && (
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="text-destructive">- ₹{invoice.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{invoice.amount.toFixed(2)}</span>
                        </div>
                        <Separator />
                        {invoice.paidAmount !== undefined && (
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Paid</span>
                                <span>₹{invoice.paidAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg">
                            <span>Due</span>
                            <span>₹{(invoice.dueAmount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
