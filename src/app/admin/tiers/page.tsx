
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { featureFlagsDAO, type FeatureFlag } from '@/lib/data';

const servicePlans = [
    { id: 'free', name: 'Free', price: '₹0', features: ['5 Invoices/mo', '10 Customers', 'Basic Reporting'] },
    { id: 'basic', name: 'Basic', price: '₹499/mo', features: ['50 Invoices/mo', '100 Customers', 'AI Analysis'] },
    { id: 'pro', name: 'Pro', price: '₹999/mo', features: ['Unlimited Invoices', 'Unlimited Customers', 'AI Analysis', 'Advanced Reporting'] },
];

function useFeatureFlags() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const unsubscribe = featureFlagsDAO.subscribe(
            (allFlags) => {
                setFlags(allFlags);
                setIsLoading(false);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    return { flags, setFlags, isLoading, error };
}


export default function ServiceTiersPage() {
    const { flags, setFlags, isLoading: flagsLoading } = useFeatureFlags();
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const handleFlagChange = (flagId: string, checked: boolean) => {
        setFlags(currentFlags => 
            currentFlags.map(f => f.id === flagId ? { ...f, enabled: checked } : f)
        );
    }

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const updatePromises = flags.map(flag => 
                featureFlagsDAO.update(flag.id, { enabled: flag.enabled })
            );
            await Promise.all(updatePromises);
            toast({
                title: 'Changes Saved',
                description: 'Feature flags have been updated.',
            })
        } catch (err) {
             console.error("Failed to save feature flags", err);
             toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not update feature flags.',
            })
        } finally {
            setIsSaving(false);
        }
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
                        {flagsLoading ? (
                            <p>Loading feature flags...</p>
                        ) : (
                            flags.map(flag => (
                                <div key={flag.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div>
                                        <Label htmlFor={flag.id} className="font-semibold">{flag.name}</Label>
                                        <p className="text-sm text-muted-foreground">{flag.description}</p>
                                    </div>
                                    <Switch 
                                        id={flag.id} 
                                        checked={flag.enabled} 
                                        onCheckedChange={(checked) => handleFlagChange(flag.id, checked)}
                                    />
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={handleSaveChanges} disabled={isSaving || flagsLoading}>
                        {isSaving && <Loader2 className="mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
