
'use client';

import { AppLayout } from '@/components/app-layout';
import { Suspense } from 'react';
import { ProfileTabs } from './profile-tabs';
import { useSearchParams } from 'next/navigation';

function ProfilePageContent() {
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'business';

    return <ProfileTabs activeTab={activeTab} />;
}

export default function ProfilePage() {
  return (
    <AppLayout>
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Profile</h1>
        </div>
        <Suspense fallback={<div className="mt-4 text-center text-muted-foreground">Loading profile...</div>}>
            <ProfilePageContent />
        </Suspense>
    </AppLayout>
  );
}
