
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
import { CalendarIcon, PlusCircle, Trash2, Loader2, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

type InvoiceItem = {
    // A temporary ID for react key prop
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    total: number;
    isManual?: boolean;
};

export default function NewInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { data: customers } = useFirestoreData(customersDAO);
  const { data: products } = useFirestoreData(productsDAO);
  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Summary state
  const [gstPercentage, setGstPercentage] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [orderNote, setOrderNote] = useState('');

  // Add one default item row when the component mounts
  useEffect(() => {
    if (items.length === 0) {
      handleAddItem(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddItem = (isManual = false) => {
      const newItem = { id: `item-${Date.now()}`, productId: '', productName: '', quantity: 1, sellingPrice: 0, total: 0, isManual };
      setItems([...items, newItem]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item[field] as any) = value;

    if (field === 'productId' && !item.isManual) {
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

  const calculateSummary = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = subtotal * (gstPercentage / 100);
    const total = subtotal + gstAmount + deliveryCharges - discount;
    const dueAmount = total - paidAmount;
    return { subtotal, gstAmount, total, dueAmount };
  }, [items, gstPercentage, deliveryCharges, discount, paidAmount]);
  
  const { subtotal, gstAmount, total, dueAmount } = calculateSummary();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    // Filter out empty rows before saving
    const finalItems = items.filter(i => i.productName && i.sellingPrice > 0 && i.quantity > 0);

    if (!customerId || finalItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please select a customer and add at least one valid item.',
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

    setIsSaving(true);
    try {
      const invoiceNumber = `INV-${Date.now()}`;
      await invoicesDAO.add({
        invoiceNumber,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        issueDate: format(new Date(), 'PPP'),
        dueDate: dueDate ? format(dueDate, 'PPP') : 'N/A',
        status: dueAmount <= 0 ? 'Paid' : 'Pending',
        items: finalItems.map(({id, isManual, ...rest}) => rest),
        subtotal,
        gstPercentage,
        gstAmount,
        deliveryCharges,
        discount,
        amount: total,
        paidAmount,
        dueAmount,
        orderNote,
      });
      
      toast({
        title: 'Invoice Created',
        description: `Successfully created invoice ${invoiceNumber}.`,
      });
      router.push('/invoices');
    } catch (error) {
        console.error("Failed to create invoice:", error);
        toast({
            variant: "destructive",
            title: "Creation Failed",
            description: "An error occurred while creating the invoice."
        })
        setIsSaving(false);
    }
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
                        Fill out the form to create a new invoice. Invoice Number and Issue Date will be auto-generated.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                <div className="grid gap-3 col-span-12 sm:col-span-5">
                                    {index === 0 && <Label className="hidden sm:block">Item</Label>}
                                    {item.isManual ? (
                                        <Input 
                                            type="text" 
                                            placeholder="e.g., Service Fee" 
                                            value={item.productName} 
                                            onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                        />
                                    ) : (
                                        <Select onValueChange={(value) => handleItemChange(index, 'productId', value)} value={item.productId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {products.map((p) => <SelectItem key={p.id} value={p.id} disabled={p.stock <=0 }>{p.name} (Stock: {p.stock})</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className="grid gap-3 col-span-4 sm:col-span-2">
                                {index === 0 && <Label className="hidden sm:block">Qty</Label>}
                                    <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="1" />
                                </div>
                                <div className="grid gap-3 col-span-4 sm:col-span-2">
                                {index === 0 && <Label className="hidden sm:block">Price</Label>}
                                    <Input type="number" value={item.sellingPrice} onChange={(e) => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" step="0.01"/>
                                </div>
                                <div className="grid gap-3 col-span-4 sm:col-span-2">
                                {index === 0 && <Label className="hidden sm:block">Total</Label>}
                                    <Input type="number" value={item.total.toFixed(2)} readOnly placeholder="0.00" className='bg-muted' />
                                </div>
                                <div className="col-span-12 sm:col-span-1 flex items-end">
                                    <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="w-full sm:w-auto">
                                        <Trash2 />
                                    </Button>
                                </div>
                            </div>
                            ))}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="button" variant="outline" onClick={() => handleAddItem(false)}>
                                    <PlusCircle className="mr-2" />
                                    Add Item
                                </Button>
                                <Button type="button" variant="outline" onClick={() => handleAddItem(true)}>
                                    <PlusCircle className="mr-2" />
                                    Add Manually
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="grid gap-4 pt-6">
                           <div className="grid gap-3">
                                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                                <div className="relative">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                            variant={'outline'}
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
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
                                    {dueDate && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                            onClick={() => setDueDate(undefined)}
                                        >
                                            <XIcon className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="orderNote">Order Note</Label>
                                <Textarea 
                                    id="orderNote"
                                    placeholder="Add any notes for the order..."
                                    value={orderNote}
                                    onChange={(e) => setOrderNote(e.target.value)}
                                    rows={5}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <Label>Subtotal</Label>
                                    <span className="text-muted-foreground">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>GST (%)</Label>
                                    <Input type="number" placeholder="0" value={gstPercentage} onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)} className="max-w-24 text-right" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Delivery Charges</Label>
                                    <Input type="number" placeholder="0.00" value={deliveryCharges} onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)} className="max-w-24 text-right" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label>Discount</Label>
                                    <Input type="number" placeholder="0.00" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="max-w-24 text-right" />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between font-bold text-lg">
                                    <Label>Total</Label>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <Label>Paid Amount</Label>
                                    <Input type="number" placeholder="0.00" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="max-w-24 text-right" />
                                </div>
                                 <div className="flex items-center justify-between font-semibold">
                                    <Label>Due Amount</Label>
                                    <span>₹{dueAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <CardFooter className="justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => router.push('/invoices')} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Invoice
                    </Button>
                </CardFooter>
            </div>
        </form>
      </div>
    </AppLayout>
  );
}
