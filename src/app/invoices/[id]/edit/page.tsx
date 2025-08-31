
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
import { customersDAO, invoicesDAO, productsDAO, type Invoice, type Product } from '@/lib/data';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format, parse } from 'date-fns';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useFirestoreData } from '@/hooks/use-firestore-data';

type InvoiceItem = {
    // A temporary ID for react key prop
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    total: number;
};

export default function EditInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { data: customers } = useFirestoreData(customersDAO);
  const { data: products } = useFirestoreData(productsDAO);
  const { data: invoices, isLoading } = useFirestoreData(invoicesDAO);

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<Invoice['status']>();
  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  
  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
        const foundInvoice = invoices.find((i) => i.id === invoiceId);
        if (foundInvoice) {
            if (!invoice) { // Only set state on initial load
                setInvoice(foundInvoice);
                setInvoiceNumber(foundInvoice.invoiceNumber);
                setIssueDate(parse(foundInvoice.issueDate, 'PPP', new Date()));
                if(foundInvoice.dueDate && foundInvoice.dueDate !== 'N/A') {
                    setDueDate(parse(foundInvoice.dueDate, 'PPP', new Date()));
                }
                setStatus(foundInvoice.status);
                setCustomerId(foundInvoice.customer.id);
                setItems(foundInvoice.items.map(item => ({...item, id: `item-${Math.random()}`})));
            }
        } else {
             toast({
                variant: 'destructive',
                title: 'Invoice not found',
            });
            router.push('/invoices');
        }
    }
  }, [invoiceId, invoices, isLoading, router, toast, invoice]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, productId: '', productName: '', quantity: 1, sellingPrice: 0, total: 0 },
    ]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item[field] as any) = value;

    if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          item.productName = product.name;
          item.sellingPrice = product.sellingPrice;
        }
    }
    
    item.total = item.quantity * item.sellingPrice;
    
    newItems[index] = item;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };
  
  const totalAmount = calculateTotal();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoice) return;
    
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
    
    const updatedInvoiceData: Partial<Omit<Invoice, 'id'>> = {
      invoiceNumber,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      issueDate: format(issueDate, 'PPP'),
      dueDate: dueDate ? format(dueDate, 'PPP') : 'N/A',
      status,
      amount: totalAmount,
      items: items.map(({id, ...rest}) => rest),
    };

    try {
        await invoicesDAO.update(invoice.id, updatedInvoiceData, invoice);

        toast({
          title: 'Invoice Updated',
          description: `Successfully updated invoice ${invoiceNumber}.`,
        });
        router.push('/invoices');
    } catch(error) {
        console.error("Failed to update invoice:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "An error occurred while updating the invoice."
        })
    }
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
          <div className="grid gap-6">
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
                        <Input id="invoiceNumber" name="invoiceNumber" type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="customer">Customer</Label>
                        <Select name="customer" required onValueChange={setCustomerId} value={customerId} disabled>
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
            </Card>

            <Card>
                    <CardHeader>
                        <CardTitle>Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            {items.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                                <div className="grid gap-3 col-span-5">
                                    {index === 0 && <Label>Item</Label>}
                                     <Select onValueChange={(value) => handleItemChange(index, 'productId', value)} value={item.productId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((p: Product) => {
                                                const originalItem = invoice.items.find(i => i.productId === p.id);
                                                const originalQuantity = originalItem ? originalItem.quantity : 0;
                                                const availableStock = p.stock + originalQuantity;
                                                return <SelectItem key={p.id} value={p.id} disabled={p.stock <=0 && !originalItem}>{p.name} (Stock: {availableStock})</SelectItem>
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-3 col-span-2">
                                {index === 0 && <Label>Quantity</Label>}
                                    <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="1" />
                                </div>
                                <div className="grid gap-3 col-span-2">
                                {index === 0 && <Label>Selling Price</Label>}
                                    <Input type="number" value={item.sellingPrice} onChange={(e) => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" step="0.01"/>
                                </div>
                                <div className="grid gap-3 col-span-2">
                                {index === 0 && <Label>Total</Label>}
                                    <Input type="number" value={item.total.toFixed(2)} readOnly placeholder="0.00" className='bg-muted' />
                                </div>
                                <div className="col-span-1 flex items-end">
                                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)}>
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>
                            ))}
                            <Button type="button" variant="outline" onClick={handleAddItem}>
                                <PlusCircle className="mr-2" />
                                Add Item
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                            <div className='grid gap-3 col-span-1'>
                                <Label>Total Amount</Label>
                                <Input value={`₹${totalAmount.toFixed(2)}`} readOnly className='bg-muted text-lg font-bold' />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </CardFooter>
                </Card>

          </div>
        </form>
      </div>
    </AppLayout>
  );
}
