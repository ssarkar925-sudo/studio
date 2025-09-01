
'use client';

import { AppLayout } from '@/components/app-layout';
import { Suspense } from 'react';
import { ContactsSuspenseWrapper } from './contacts-suspense-wrapper';

export default function ContactsPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacts</h1>
      </div>
      <Suspense fallback={<div className="mt-4 text-center text-muted-foreground">Loading contacts...</div>}>
        <ContactsSuspenseWrapper />
      </Suspense>
    </AppLayout>
  );
}
