
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
import { useRouter, useParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { customersDAO, invoiceTemplates, invoicesDAO, type Invoice } from '@/lib/data';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function EditInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { data: customers } = useFirestoreData(customersDAO);
  const { data: invoices, isLoading } = useFirestoreData(invoicesDAO);
  const [invoice, setInvoice] = useState<Invoice | null>(null);

  const [issueDate, setIssueDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<Invoice['status']>();
  const [amount, setAmount] = useState<number>(0);
  const [customerId, setCustomerId] = useState<string>('');
  

  useEffect(() => {
    if (!isLoading) {
        const foundInvoice = invoices.find((i) => i.id === invoiceId);
        if (foundInvoice) {
            setInvoice(foundInvoice);
            setIssueDate(parse(foundInvoice.issueDate, 'PPP', new Date()));
            if(foundInvoice.dueDate !== 'N/A') {
                setDueDate(parse(foundInvoice.dueDate, 'PPP', new Date()));
            }
            setStatus(foundInvoice.status);
            setAmount(foundInvoice.amount);
            setCustomerId(foundInvoice.customer.id);
        } else {
             toast({
                variant: 'destructive',
                title: 'Invoice not found',
            });
            router.push('/invoices');
        }
    }
  }, [invoiceId, invoices, isLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoice) return;

    const formData = new FormData(e.currentTarget);
    const invoiceNumber = formData.get('invoiceNumber') as string;
    
    if (!invoiceNumber || !customerId || !issueDate || !status) {
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

    await invoicesDAO.update(invoice.id, {
      invoiceNumber,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      issueDate: format(issueDate, 'PPP'),
      dueDate: dueDate ? format(dueDate, 'PPP') : 'N/A',
      status,
      amount,
    });

    toast({
      title: 'Invoice Updated',
      description: `Successfully updated invoice ${invoiceNumber}.`,
    });
    router.push('/invoices');
  };
  
  if (isLoading || !invoice) {
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
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <h1 className="text-2xl font-semibold">Edit Invoice</h1>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Update the invoice details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-3">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input id="invoiceNumber" name="invoiceNumber" type="text" defaultValue={invoice.invoiceNumber} required />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="customer">Customer</Label>
                    <Select name="customer" required onValueChange={setCustomerId} value={customerId}>
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
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} required />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="status">Status</Label>
                        <Select name="status" required onValueChange={(value) => setStatus(value as Invoice['status'])} value={status}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Overdue">Overdue</SelectItem>
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
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
