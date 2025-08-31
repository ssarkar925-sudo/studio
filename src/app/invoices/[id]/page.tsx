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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variant = {
    Paid: 'default',
    Pending: 'secondary',
    Overdue: 'destructive',
  }[status] as 'default' | 'secondary' | 'destructive';

  return <Badge variant={variant} className="capitalize">{status.toLowerCase()}</Badge>;
}

export default function InvoiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const invoices = invoicesDAO.load();
    const foundInvoice = invoices.find((i) => i.id === params.id);
    if (foundInvoice) {
      setInvoice(foundInvoice);
    }
  }, [params.id]);

  if (!invoice) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-2xl gap-2">
                <h1 className="text-2xl font-semibold">Loading...</h1>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-semibold">Invoice Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
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
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                        <p>{invoice.issueDate}</p>
                    </div>
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                        <p>{invoice.dueDate}</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Customer</p>
                        <p>{invoice.customer.name}</p>
                        <p className='text-sm text-muted-foreground'>{invoice.customer.email}</p>
                    </div>
                </div>
                 <div className="grid grid-cols-1 gap-4">
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Amount</p>
                        <p className='text-2xl font-bold'>₹{invoice.amount.toFixed(2)}</p>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
