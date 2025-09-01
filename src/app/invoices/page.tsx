
'use client';

import { AppLayout } from '@/components/app-layout';
import { invoicesDAO } from '@/lib/data';
import { InvoicesClient } from './invoices-client';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function InvoicesPage() {
  const { data: invoices, isLoading } = useFirestoreData(invoicesDAO);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Invoices</h1>
        </div>
        <div className="mt-4 text-center text-muted-foreground">Loading invoices...</div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <InvoicesClient invoices={invoices} />
    </AppLayout>
  );
}
