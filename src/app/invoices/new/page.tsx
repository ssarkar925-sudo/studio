
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { customersDAO, invoiceTemplates, invoicesDAO } from '@/lib/data';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import type { Customer } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function NewInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { data: customers } = useFirestoreData(customersDAO);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const invoiceNumber = formData.get('invoiceNumber') as string;
    const customerId = formData.get('customer') as string;
    // This is a simplified version. A real app would parse items and calculate amount.
    const amount = Math.floor(Math.random() * 5000) + 1000;

    if (!invoiceNumber || !customerId || !issueDate) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please fill out all invoice details.',
      });
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
       toast({
        variant: 'destructive',
        title: 'Invalid Customer',
        description: 'Selected customer could not be found.',
      });
      return;
    }

    await invoicesDAO.add({
      invoiceNumber,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      issueDate: format(issueDate, 'PPP'),
      dueDate: dueDate ? format(dueDate, 'PPP') : 'N/A',
      status: 'Pending', // Default status
      amount,
    });

    toast({
      title: 'Invoice Created',
      description: `Successfully created invoice ${invoiceNumber}.`,
    });
    router.push('/invoices');
  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <h1 className="text-2xl font-semibold">New Invoice</h1>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Fill out the form to create a new invoice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input id="invoiceNumber" name="invoiceNumber" type="text" placeholder="INV-006" required />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="customer">Customer</Label>
                    <Select name="customer" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="issueDate">Issue Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'justify-start text-left font-normal',
                            !issueDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {issueDate ? format(issueDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={issueDate}
                          onSelect={setIssueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="dueDate">Due Date</Label>
                     <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'justify-start text-left font-normal',
                            !dueDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                 <div className="grid gap-3">
                    <Label htmlFor="template">Template</Label>
                    <Select name="template">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {invoiceTemplates.map((template) => (
                          <SelectItem key={template} value={template}>{template}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                 <div className="grid gap-3">
                  <Label htmlFor="items">Items</Label>
                  <Textarea id="items" name="items" placeholder="Enter invoice items..." />
                  <p className="text-sm text-muted-foreground">Add each item on a new line. Format: Item Name, Quantity, Price</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Save Invoice</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
