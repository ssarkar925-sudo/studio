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

export default function NewInventoryItemPage() {
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    
    toast({
      title: 'Item Created',
      description: `Successfully created item: ${name}.`,
    });
    router.push('/inventory');
  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <h1 className="text-2xl font-semibold">New Inventory Item</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Fill out the form to add a new item to your inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" type="text" className="w-full" placeholder="e.g. Web Design Service" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" name="price" type="number" placeholder="0.00" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" name="stock" type="number" placeholder="0" />
                    </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Save Item</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}