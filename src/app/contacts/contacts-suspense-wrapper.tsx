
'use client';

import { customersDAO, vendorsDAO } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useSearchParams } from 'next/navigation';
import { ContactsClient } from './contacts-client';

export function ContactsSuspenseWrapper() {
  const { data: customers, isLoading: customersLoading } = useFirestoreData(customersDAO);
  const { data: vendors, isLoading: vendorsLoading } = useFirestoreData(vendorsDAO);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'customers';

  const isLoading = customersLoading || vendorsLoading;

  if (isLoading) {
    return <div className="mt-4 text-center text-muted-foreground">Loading contacts...</div>;
  }

  return (
    <ContactsClient 
      activeTab={activeTab}
      customers={customers}
      vendors={vendors}
    />
  );
}
