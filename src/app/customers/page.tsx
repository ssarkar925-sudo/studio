
'use client';

import { AppLayout } from '@/components/app-layout';
import { customersDAO } from '@/lib/data';
import { CustomersClient } from './customers-client';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function CustomersPage() {
  const { data: customers, isLoading } = useFirestoreData(customersDAO);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Customers</h1>
        </div>
        <div className="mt-4 text-center text-muted-foreground">Loading customers...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <CustomersClient customers={customers} />
    </AppLayout>
  );
}
