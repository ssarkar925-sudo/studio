
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { BusinessProfileClient } from './business-profile-client';
import { UserProfileClient } from './user-profile-client';

interface ProfileTabsProps {
    activeTab: string;
}

export function ProfileTabs({ activeTab }: ProfileTabsProps) {
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
                <TabsTrigger value="business">Business Profile</TabsTrigger>
                <TabsTrigger value="user">User Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="business">
                <BusinessProfileClient />
            </TabsContent>
            <TabsContent value="user">
                <UserProfileClient />
            </TabsContent>
      </Tabs>
    )
}
