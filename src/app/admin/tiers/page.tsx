
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const servicePlans = [
    { id: 'free', name: 'Free', price: '₹0', features: ['5 Invoices/mo', '10 Customers', 'Basic Reporting'] },
    { id: 'basic', name: 'Basic', price: '₹499/mo', features: ['50 Invoices/mo', '100 Customers', 'AI Analysis'] },
    { id: 'pro', name: 'Pro', price: '₹999/mo', features: ['Unlimited Invoices', 'Unlimited Customers', 'AI Analysis', 'Advanced Reporting'] },
];

const featureFlags = [
    { id: 'aiAnalysis', name: 'AI Dashboard Analysis', description: 'Enable or disable the AI-powered analysis on the main dashboard.' },
    { id: 'reportsPage', name: 'Reports Page', description: 'Toggle access to the detailed Reports page for all users.' },
];

export default function ServiceTiersPage() {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleSaveChanges = () => {
        setIsSaving(true);
        // Simulate an API call
        setTimeout(() => {
            setIsSaving(false);
            toast({
                title: 'Changes Saved',
                description: 'Service tiers and feature flags have been updated.',
            })
        }, 1500);
    }

    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-4xl gap-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Service Tiers & Features</h1>
                    <p className="text-muted-foreground mt-2">Manage subscription plans and toggle features for users.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Service Plan Management</CardTitle>
                        <CardDescription>Create and manage different subscription plans.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        {servicePlans.map(plan => (
                             <Card key={plan.id}>
                                <CardHeader>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>{plan.price}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    {plan.features.map(feature => (
                                        <p key={feature}>{feature}</p>
                                    ))}
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline">Edit Plan</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Feature Flags</CardTitle>
                        <CardDescription>Globally enable or disable specific application features.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {featureFlags.map(flag => (
                            <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <Label htmlFor={flag.id} className="font-semibold">{flag.name}</Label>
                                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                                </div>
                                <Switch id={flag.id} defaultChecked={true} />
                            </div>
                        ))}
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
