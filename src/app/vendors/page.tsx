
import { AppLayout } from '@/components/app-layout';
import { vendorsDAO } from '@/lib/data';
import { VendorsClient } from './vendors-client';


export default async function VendorsPage() {
  const vendors = await vendorsDAO.load();

  return (
    <AppLayout>
      <VendorsClient vendors={vendors} />
    </AppLayout>
  );
}
