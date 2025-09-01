
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { productsDAO, purchasesDAO } from '@/lib/data';
import { Upload } from 'lucide-react';
import { InventoryTabs } from './inventory-tabs';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useSearchParams } from 'next/navigation';

export default function InventoryPage() {
  const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
  const { data: purchases, isLoading: purchasesLoading } = useFirestoreData(purchasesDAO);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stock';

  const isLoading = productsLoading || purchasesLoading;

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload />
            Import
          </Button>
        </div>
      </div>
       {isLoading ? (
        <div className="mt-4 text-center text-muted-foreground">Loading inventory...</div>
      ) : (
        <InventoryTabs 
          activeTab={activeTab}
          products={products}
          purchases={purchases}
        />
      )}
    </AppLayout>
  );
}
