
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { CustomersClient } from './customers/customers-client';
import { VendorsClient } from './vendors/vendors-client';
import type { Customer, Vendor } from '@/lib/data';

interface ContactsClientProps {
    activeTab: string;
    customers: Customer[];
    vendors: Vendor[];
}

export function ContactsClient({ activeTab, customers, vendors }: ContactsClientProps) {
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
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="vendors">Vendors</TabsTrigger>
            </TabsList>
            <TabsContent value="customers">
                <CustomersClient customers={customers} />
            </TabsContent>
            <TabsContent value="vendors">
                <VendorsClient vendors={vendors} />
            </TabsContent>
      </Tabs>
    )
}
