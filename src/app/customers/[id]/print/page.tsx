
'use client';

import { PrintLayout } from '@/app/print-layout';
import { customersDAO, type Customer } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PrintCustomerPage() {
  const params = useParams();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: customers, isLoading } = useFirestoreData(customersDAO);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!isLoading && customers.length > 0) {
      const foundCustomer = customers.find((c) => c.id === customerId);
      setCustomer(foundCustomer || null);
    }
  }, [customerId, customers, isLoading]);

  useEffect(() => {
    if (customer && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        window.print();
    }
  }, [customer, isLoading]);

  if (isLoading || !customer) {
    return <div>Loading...</div>;
  }

  return (
    <PrintLayout>
      <div className="flex items-center gap-4 mb-8">
        <Avatar className='h-16 w-16'>
            <AvatarImage
                src={`https://picsum.photos/80/80?random=${customer.id}`}
            />
            <AvatarFallback>
                {customer.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
        </Avatar>
        <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">{customer.email}</p>
        </div>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
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
    </PrintLayout>
  );
}
