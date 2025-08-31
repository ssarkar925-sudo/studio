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
import { customersDAO, type Customer } from '@/lib/data';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
    const customers = customersDAO.load();
    const foundCustomer = customers.find((c) => c.id === customerId);
    if (foundCustomer) {
      setCustomer(foundCustomer);
    } else {
        // Handle not found case if necessary
    }
  }, [params.id]);

  if (!customer) {
    // You can show a loading spinner here
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
            <h1 className="text-2xl font-semibold">Customer Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{customer.name}</CardTitle>
            <CardDescription>
              {customer.email || 'No email provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{customer.phone || 'N/A'}</p>
                </div>
                 <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p>{customer.address || 'N/A'}</p>
                </div>
              </div>
               <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Invoiced</p>
                    <p>₹{customer.totalInvoiced.toFixed(2)}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                    <p>₹{customer.totalPaid.toFixed(2)}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Invoices</p>
                    <p>{customer.invoices}</p>
                </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
