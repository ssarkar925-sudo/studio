
import { AppLayout } from '@/components/app-layout';
import { invoicesDAO } from '@/lib/data';
import { InvoicesClient } from './invoices-client';

export default async function InvoicesPage() {
  const invoices = await invoicesDAO.load();
  
  return (
    <AppLayout>
      <InvoicesClient invoices={invoices} />
    </AppLayout>
  );
}
