
'use client';

import { AppLayout } from '@/components/app-layout';
import { customersDAO, vendorsDAO } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useSearchParams } from 'next/navigation';
import { ContactsClient } from './contacts-client';

export default function ContactsPage() {
  const { data: customers, isLoading: customersLoading } = useFirestoreData(customersDAO);
  const { data: vendors, isLoading: vendorsLoading } = useFirestoreData(vendorsDAO);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'customers';

  const isLoading = customersLoading || vendorsLoading;

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
      </div>
       {isLoading ? (
        <div className="mt-4 text-center text-muted-foreground">Loading contacts...</div>
      ) : (
        <ContactsClient 
          activeTab={activeTab}
          customers={customers}
          vendors={vendors}
        />
      )}
    </AppLayout>
  );
}
