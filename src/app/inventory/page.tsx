
'use client';

import { AppLayout } from '@/components/app-layout';
import { productsDAO, purchasesDAO } from '@/lib/data';
import { InventoryTabs } from './inventory-tabs';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';


function InventoryPageContent() {
  const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
  const { data: purchases, isLoading: purchasesLoading } = useFirestoreData(purchasesDAO);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'stock';

  const isLoading = productsLoading || purchasesLoading;

  if (isLoading) {
    return <div className="mt-4 text-center text-muted-foreground">Loading inventory...</div>;
  }

  return (
    <InventoryTabs 
      activeTab={activeTab}
      products={products}
      purchases={purchases}
    />
  )
}


export default function InventoryPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
      </div>
      <Suspense fallback={<div className="mt-4 text-center text-muted-foreground">Loading inventory...</div>}>
        <InventoryPageContent />
      </Suspense>
    </AppLayout>
  );
}
