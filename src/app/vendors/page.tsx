
'use client';

import { AppLayout } from '@/components/app-layout';
import { vendorsDAO } from '@/lib/data';
import { VendorsClient } from './vendors-client';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function VendorsPage() {
  const { data: vendors, isLoading } = useFirestoreData(vendorsDAO);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Vendors</h1>
        </div>
        <div className="mt-4 text-center text-muted-foreground">Loading vendors...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <VendorsClient vendors={vendors} />
    </AppLayout>
  );
}
