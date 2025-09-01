
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { vendorsDAO } from '@/lib/data';

export default function NewVendorPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const vendorName = formData.get('vendorName') as string;
    const contactPerson = formData.get('contactPerson') as string;
    const contactNumber = formData.get('contactNumber') as string;
    const email = formData.get('email') as string;
    const gstn = formData.get('gstn') as string;

    if (!vendorName) {
       toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please enter a name for the vendor.',
      });
      return;
    }

    try {
      await vendorsDAO.add({
        vendorName,
        contactPerson,
        contactNumber,
        email,
        gstn,
      });
      
      toast({
        title: 'Vendor Created',
        description: `Successfully created vendor: ${vendorName}.`,
      });
      router.push('/vendors');
    } catch (error) {
       console.error("Creation failed:", error);
       toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Could not create vendor.',
      });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <h1 className="text-2xl font-semibold">New Vendor</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Vendor Details</CardTitle>
              <CardDescription>
                Fill out the form to add a new vendor.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input id="vendorName" name="vendorName" type="text" className="w-full" placeholder="e.g. Acme Inc." required />
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" name="contactPerson" type="text" className="w-full" placeholder="John Doe" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input id="contactNumber" name="contactNumber" type="tel" className="w-full" placeholder="+91 98765 43210" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className="w-full" placeholder="contact@acme.com" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="gstn">GSTN</Label>
                  <Input id="gstn" name="gstn" type="text" className="w-full" placeholder="29AABCU9603R1ZM" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/vendors')}>Cancel</Button>
                <Button type="submit">Save Vendor</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
