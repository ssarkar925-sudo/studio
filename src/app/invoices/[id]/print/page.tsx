
'use client';

import { PrintLayout } from '@/app/print-layout';
import { invoicesDAO, type Invoice } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
    const variant = {
        Paid: 'bg-green-100 text-green-800 border-green-200',
        Pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        Overdue: 'bg-red-100 text-red-800 border-red-200',
    }[status];

    return <Badge className={cn('capitalize text-sm font-medium', variant)}>{status.toLowerCase()}</Badge>;
}

export default function PrintInvoicePage() {
  const params = useParams();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: invoices, isLoading } = useFirestoreData(invoicesDAO);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
      const foundInvoice = invoices.find((i) => i.id === invoiceId);
      setInvoice(foundInvoice || null);
    }
  }, [invoiceId, invoices, isLoading]);

  useEffect(() => {
    if (invoice && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        window.print();
    }
  }, [invoice, isLoading]);

  if (isLoading || !invoice) {
    return <div>Loading...</div>;
  }

  return (
    <PrintLayout>
        <header className='flex justify-between items-start mb-12'>
            <div className='flex items-center gap-4'>
                 <Icons.logo className="h-10 w-10 text-primary" />
                 <div>
                    <h1 className="text-2xl font-bold">Vyapar Co.</h1>
                    <p className="text-sm text-muted-foreground">123 Business Rd, Business City</p>
                 </div>
            </div>
            <div className='text-right'>
                <h2 className="text-3xl font-bold tracking-tight">INVOICE</h2>
                <p className="text-sm text-muted-foreground">{invoice.invoiceNumber}</p>
                 <div className='mt-2'>
                   <InvoiceStatusBadge status={invoice.status} />
                </div>
            </div>
        </header>

        <section className='grid grid-cols-2 gap-8 mb-8'>
            <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">BILL TO</h3>
                <p className='font-medium text-lg'>{invoice.customer.name}</p>
                <p className='text-sm text-muted-foreground'>{invoice.customer.email}</p>
            </div>
            <div className='text-right grid gap-1'>
                <div className='flex justify-end gap-4'>
                    <span className='font-semibold text-muted-foreground'>Issue Date:</span>
                    <span>{invoice.issueDate}</span>
                </div>
                 <div className='flex justify-end gap-4'>
                    <span className='font-semibold text-muted-foreground'>Due Date:</span>
                    <span>{invoice.dueDate}</span>
                </div>
            </div>
        </section>

        <section className='mb-12'>
            <Table>
                <TableHeader>
                    <TableRow className='bg-muted/50'>
                        <TableHead className='w-[60%]'>Item</TableHead>
                        <TableHead className='text-right'>Quantity</TableHead>
                        <TableHead className='text-right'>Price</TableHead>
                        <TableHead className='text-right'>Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className='font-medium'>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">₹{item.total.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
        
        <section className='flex justify-between items-start gap-8'>
            <div className='max-w-md'>
                {invoice.orderNote && (
                    <>
                        <h3 className="text-md font-semibold mb-2">Notes</h3>
                        <p className="text-sm text-muted-foreground">{invoice.orderNote}</p>
                    </>
                )}
            </div>
             <div className="grid gap-3 w-full max-w-sm">
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
                        <span className="text-green-600">- ₹{invoice.discount.toFixed(2)}</span>
                    </div>
                )}
                <Separator className='my-2' />
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{invoice.amount.toFixed(2)}</span>
                </div>
                {invoice.paidAmount !== undefined && (
                        <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span>- ₹{invoice.paidAmount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg p-2 bg-muted/80 rounded-md">
                    <span>Amount Due</span>
                    <span>₹{(invoice.dueAmount || 0).toFixed(2)}</span>
                </div>
            </div>
        </section>

        <footer className='mt-24 text-center text-muted-foreground text-sm'>
            <p>Thank you for your business!</p>
            <p>Please contact us with any questions regarding this invoice.</p>
        </footer>
    </PrintLayout>
  );
}
