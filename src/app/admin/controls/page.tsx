
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AppControlsPage() {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSaveChanges = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: 'Changes Saved',
                description: 'Application controls have been updated.',
            })
        }, 1500);
    }

    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-2xl gap-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Application Controls</h1>
                    <p className="text-muted-foreground mt-2">Manage global settings for your application.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Maintenance Mode</CardTitle>
                        <CardDescription>
                            Put the application into a "maintenance" state. This will show a specific page to all non-admin users trying to access it.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="maintenance-mode" className="font-semibold">Enable Maintenance Mode</Label>
                           <Switch id="maintenance-mode" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Broadcast Announcements</CardTitle>
                        <CardDescription>
                           Create and display a banner or notification to all users, perfect for announcing new features or scheduled downtime.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="announcement-banner" className="font-semibold">Enable Announcement Banner</Label>
                           <Switch id="announcement-banner" />
                        </div>
                         <div className="grid gap-2">
                           <Label htmlFor="announcement-text">Banner Text</Label>
                           <Textarea id="announcement-text" placeholder="e.g., We will be down for scheduled maintenance on Saturday at 10 PM." />
                        </div>
                    </CardContent>
                </Card>

                 <div className="flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
