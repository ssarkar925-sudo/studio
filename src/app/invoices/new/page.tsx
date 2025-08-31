
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
import { customersDAO, invoicesDAO, productsDAO, type Product } from '@/lib/data';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Customer } from '@/lib/data';
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


export default function NewInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [issueDate, setIssueDate] = useState<Date | undefined>(new Date());
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { data: customers } = useFirestoreData(customersDAO);
  const { data: products } = useFirestoreData(productsDAO);
  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);

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
    const formData = new FormData(e.currentTarget);
    const invoiceNumber = formData.get('invoiceNumber') as string;

    if (!invoiceNumber || !customerId || !issueDate || items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please fill out all invoice details and add at least one item.',
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
      amount: totalAmount,
      items: items.map(({id, ...rest}) => rest)
    });
    
    // Decrement stock
    for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            await productsDAO.update(product.id, { stock: product.stock - item.quantity });
        }
    }

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
            <div className="grid gap-6">
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
                                            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-3 col-span-2">
                                {index === 0 && <Label>Quantity</Label>}
                                    <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="1" />
                                </div>
                                <div className="grid gap-3 col-span-2">
                                {index === 0 && <Label>Selling Price</Label>}
                                    <Input type="number" value={item.sellingPrice} onChange={(e) => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
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
                        <Button type="submit">Save Invoice</Button>
                    </CardFooter>
                </Card>
            </div>
        </form>
      </div>
    </AppLayout>
  );
}
