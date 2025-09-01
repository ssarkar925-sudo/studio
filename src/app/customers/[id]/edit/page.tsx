
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
import { useRouter, useParams } from 'next/navigation';
import { customersDAO, type Customer } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function EditCustomerPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { data: customers, isLoading } = useFirestoreData(customersDAO);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // State for form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (!isLoading && customers.length > 0) {
        const foundCustomer = customers.find((c) => c.id === customerId);
        if (foundCustomer) {
            setCustomer(foundCustomer);
            setName(foundCustomer.name);
            setEmail(foundCustomer.email);
            setPhone(foundCustomer.phone || '');
            setAddress(foundCustomer.address || '');
        } else {
            toast({
                variant: 'destructive',
                title: 'Customer not found',
            });
            router.push('/customers');
        }
    }
  }, [customerId, customers, isLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customer || isSaving) return;

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
      await customersDAO.update(customer.id, {
        name,
        email,
        phone,
        address,
      });
      
      toast({
        title: 'Customer Updated',
        description: `Successfully updated customer: ${name}.`,
      });
      router.push('/customers');
    } catch (error) {
      console.error("Update failed", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update customer.',
      });
    } finally {
       setIsSaving(false);
    }
  };
  
  if (isLoading || !customer) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-2xl gap-2">
                <h1 className="text-2xl font-semibold">Loading...</h1>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <h1 className="text-2xl font-semibold">Edit Customer</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
              <CardDescription>
                Update the customer's information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" type="text" className="w-full" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" className="w-full" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className="w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/customers')} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
