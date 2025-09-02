

'use client';

import { PrintLayout } from '@/app/print-layout';
import { invoicesDAO, businessProfileDAO, type Invoice, type BusinessProfile } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variant = {
    Paid: 'default',
    Pending: 'secondary',
    Overdue: 'destructive',
    Partial: 'outline',
  }[status] as 'default' | 'secondary' | 'destructive' | 'outline';

  return <Badge variant={variant} className="capitalize text-white">{status}</Badge>;
}

export default function PrintInvoicePage() {
  const params = useParams();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
  const { data: businessProfiles, isLoading: profileLoading } = useFirestoreData(businessProfileDAO);
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const printTriggered = useRef(false);

  const isLoading = invoicesLoading || profileLoading;

  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
      const foundInvoice = invoices.find((i) => i.id === invoiceId);
      setInvoice(foundInvoice || null);
    }
     if (!isLoading && businessProfiles.length > 0) {
      setBusinessProfile(businessProfiles[0]);
    }
  }, [invoiceId, invoices, businessProfiles, isLoading]);

  useEffect(() => {
    if (invoice && businessProfile && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        // Adding a small delay to ensure content is rendered before printing
        setTimeout(() => window.print(), 500);
    }
  }, [invoice, businessProfile, isLoading]);

  if (isLoading || !invoice || !businessProfile) {
    return (
        <PrintLayout>
            <div className='p-10'>
                <p>Loading invoice...</p>
            </div>
        </PrintLayout>
    );
  }

  return (
    <PrintLayout>
      <div className="p-10 bg-background text-foreground font-sans">
        <header className="flex flex-col items-center text-center mb-10">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                {businessProfile.logoUrl ? <img src={businessProfile.logoUrl} alt={businessProfile.companyName} className="h-full w-full object-contain" /> : <Icons.logo className="h-6 w-6" />}
            </div>
            <div>
                <h1 className="text-2xl font-bold">{businessProfile.companyName}</h1>
                <p className="text-muted-foreground">{businessProfile.address}</p>
            </div>
          </div>
          <div className="text-center mt-4">
            <h2 className="text-4xl font-bold uppercase text-primary tracking-widest">Invoice</h2>
            <p className="text-muted-foreground mt-2">Invoice #: {invoice.invoiceNumber}</p>
            <p className="text-muted-foreground">Issued: {invoice.issueDate}</p>
          </div>
        </header>

        <section className="flex justify-between items-start mb-10">
          <div>
            <h3 className="font-semibold mb-2">Billed To</h3>
            <p className="font-bold">{invoice.customer.name}</p>
            <p className="text-muted-foreground">{invoice.customer.email}</p>
          </div>
          <div className="text-right">
            <h3 className="font-semibold mb-2">Status</h3>
            <InvoiceStatusBadge status={invoice.status} />
            <p className="mt-2 font-semibold">Due Date: {invoice.dueDate}</p>
          </div>
        </section>

        <section className="mb-10">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[50%]">Item Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
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
        </section>

        <section className="flex justify-end mb-10">
          <div className="w-full max-w-sm space-y-2">
             <div className="grid grid-cols-2 items-center">
              <span className="text-muted-foreground">Subtotal</span>
              <span className='text-right'>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.gstAmount !== undefined && (
              <div className="grid grid-cols-2 items-center">
                <span className="text-muted-foreground">GST ({invoice.gstPercentage || 0}%)</span>
                <span className='text-right'>₹{invoice.gstAmount.toFixed(2)}</span>
              </div>
            )}
            {invoice.deliveryCharges !== undefined && invoice.deliveryCharges > 0 && (
              <div className="grid grid-cols-2 items-center">
                <span className="text-muted-foreground">Delivery</span>
                <span className='text-right'>₹{invoice.deliveryCharges.toFixed(2)}</span>
              </div>
            )}
            {invoice.discount !== undefined && invoice.discount > 0 && (
              <div className="grid grid-cols-2 items-center">
                <span className="text-muted-foreground">Discount</span>
                <span className='text-right text-destructive'>- ₹{invoice.discount.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 items-center font-bold text-lg">
              <span>Total</span>
              <span className='text-right'>₹{invoice.amount.toFixed(2)}</span>
            </div>
            {invoice.paidAmount !== undefined && (
              <div className="grid grid-cols-2 items-center">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className='text-right'>₹{invoice.paidAmount.toFixed(2)}</span>
              </div>
            )}
             <div className="grid grid-cols-2 items-center font-bold text-lg p-2 bg-muted/50 rounded-md">
              <span>Amount Due</span>
              <span className='text-right'>₹{(invoice.dueAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </section>
        
        {invoice.orderNote && (
          <footer className="mt-10 pt-5 border-t">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-muted-foreground text-sm">{invoice.orderNote}</p>
          </footer>
        )}
        
        <section className="mt-20 text-right">
            <div className="inline-block text-center">
                <div className="border-t-2 border-black w-48 pt-2">
                    <p className="text-sm font-semibold">Authorised Signatory</p>
                    <p className="text-sm text-muted-foreground">{businessProfile.companyName}</p>
                </div>
            </div>
        </section>
      </div>
    </PrintLayout>
  );
}

