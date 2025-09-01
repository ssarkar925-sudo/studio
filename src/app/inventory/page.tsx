
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { productsDAO, purchasesDAO } from '@/lib/data';
import { Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryClient } from './inventory-client';


export default async function InventoryPage({ searchParams }: { searchParams: { tab: string }}) {
  const products = await productsDAO.load();
  const purchases = await purchasesDAO.load();

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
      <Tabs defaultValue={searchParams.tab || "stock"}>
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <InventoryClient products={products} />
        </TabsContent>
        <TabsContent value="purchases">
          <InventoryClient purchases={purchases} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
