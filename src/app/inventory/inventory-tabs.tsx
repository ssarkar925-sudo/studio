
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryClient } from './inventory-client';
import { type Product, type Purchase } from '@/lib/data';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
            <TabsList>
                <TabsTrigger value="stock">Stock</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
            </TabsList>
            <TabsContent value="stock">
                <Card>
                    <InventoryClient activeTab="stock" products={products} />
                </Card>
            </TabsContent>
            <TabsContent value="purchases">
                <Card>
                    <InventoryClient activeTab="purchases" purchases={purchases} />
                </Card>
            </TabsContent>
      </Tabs>
    )
}
