
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryClient } from './inventory-client';
import { type Product, type Purchase } from '@/lib/data';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface InventoryTabsProps {
    activeTab: string;
    products?: Product[];
    purchases?: Purchase[];
}

export function InventoryTabs({ activeTab, products, purchases }: InventoryTabsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`${pathname}?${params.toString()}`);
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
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
    )
}
