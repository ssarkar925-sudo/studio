
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { customersDAO } from '@/lib/data';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export default function NewCustomerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || !user) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    if (!name) {
       toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please enter a name for the customer.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await customersDAO.add({
        userId: user.uid,
        name,
        email,
        phone,
        address,
        totalInvoiced: 0,
        totalPaid: 0,
        invoices: 0,
      });
      
      toast({
        title: 'Customer Created',
        description: `Successfully created customer: ${name}.`,
      });
      router.push('/contacts?tab=customers');
    } catch (error) {
      console.error("Creation failed", error);
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Could not create customer.',
      });
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <h1 className="text-2xl font-semibold">New Customer</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>
                Fill out the form to add a new customer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" type="text" className="w-full" placeholder="John Doe" required />
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" className="w-full" placeholder="+91 98765 43210" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className="w-full" placeholder="john.doe@example.com" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" placeholder="Enter customer's address" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/contacts?tab=customers')} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Customer
                </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
