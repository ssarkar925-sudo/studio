
'use client';

import { PrintLayout } from '@/app/print-layout';
import { invoicesDAO, type Invoice } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variant = {
    Paid: 'default',
    Pending: 'secondary',
    Overdue: 'destructive',
  }[status] as 'default' | 'secondary' | 'destructive';

  return <Badge variant={variant} className="capitalize">{status.toLowerCase()}</Badge>;
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
        <header className='flex justify-between items-start mb-8'>
            <div>
                <h1 className="text-3xl font-bold">Invoice</h1>
                <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            </div>
            <div>
                <h2 className="text-xl font-semibold">Vyapar Co.</h2>
                <p className="text-sm text-muted-foreground">123 Business Rd, Business City</p>
            </div>
        </header>

        <section className='grid grid-cols-2 gap-8 mb-8'>
            <div>
                <h3 className="text-lg font-semibold mb-2">Bill To</h3>
                <p className='font-medium'>{invoice.customer.name}</p>
                <p className='text-sm text-muted-foreground'>{invoice.customer.email}</p>
            </div>
            <div className='text-right'>
                <div className='flex justify-end gap-4'>
                    <span className='font-semibold'>Status:</span>
                    <InvoiceStatusBadge status={invoice.status} />
                </div>
                <p className='mt-2'><span className='font-semibold'>Issue Date:</span> {invoice.issueDate}</p>
                <p><span className='font-semibold'>Due Date:</span> {invoice.dueDate}</p>
            </div>
        </section>

        <section className='mb-8'>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className='text-right'>Quantity</TableHead>
                        <TableHead className='text-right'>Price</TableHead>
                        <TableHead className='text-right'>Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoice.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{item.total.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
        
        <section className='flex justify-end'>
            <div className='w-full max-w-xs space-y-2'>
                <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Subtotal</span>
                    <span>₹{invoice.amount.toFixed(2)}</span>
                </div>
                <div className='flex justify-between font-bold text-lg border-t pt-2'>
                    <span>Total</span>
                    <span>₹{invoice.amount.toFixed(2)}</span>
                </div>
            </div>
        </section>

        <footer className='mt-16 text-center text-muted-foreground text-sm'>
            <p>Thank you for your business!</p>
        </footer>
    </PrintLayout>
  );
}
