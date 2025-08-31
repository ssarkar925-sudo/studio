
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { vendorsDAO, productsDAO, purchasesDAO, type Vendor, type Product } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Upload } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';

type PurchaseItem = {
    productId: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    total: number;
    isNew?: boolean;
};

export default function NewPurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [paymentDone, setPaymentDone] = useState(0);
  const [gst, setGst] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  
  const loadData = useCallback(() => {
    setVendors(vendorsDAO.load());
    setProducts(productsDAO.load());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItem = () => {
    setItems([
      ...items,
      { productId: '', productName: '', quantity: 1, purchasePrice: 0, total: 0 },
    ]);
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item[field] as any) = value;

    if (field === 'productId') {
        if (value === 'add_new') {
            item.isNew = true;
            item.productId = `new_${Date.now()}`;
            item.productName = '';
        } else {
            item.isNew = false;
            const product = products.find(p => p.id === value);
            item.productName = product?.name || '';
            item.purchasePrice = product?.price || 0;
        }
    }
    
    if (field === 'productName' && item.isNew) {
        // Just update name, no other changes needed
    } else {
        item.total = item.quantity * item.purchasePrice;
    }
    
    newItems[index] = item;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalGst = subtotal * (gst / 100);
    const totalAmount = subtotal + totalGst + deliveryCharges;
    const dueAmount = totalAmount - paymentDone;
    return { subtotal, totalAmount, dueAmount };
  };

  const { subtotal, totalAmount, dueAmount } = calculateTotals();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const vendor = vendors.find(v => v.id === vendorId);

    if (!vendor || !orderDate || items.length === 0 || items.some(i => i.isNew ? !i.productName : !i.productId)) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please select a vendor, order date, and add at least one valid item.',
        });
        return;
    }

    purchasesDAO.add({
        vendorId: vendor.id,
        vendorName: vendor.vendorName,
        orderDate: format(orderDate, 'PPP'),
        items: items.map(i => ({...i})),
        totalAmount,
        paymentDone,
        dueAmount,
        status: 'Pending',
        gst,
        deliveryCharges,
    });

    toast({
        title: 'Purchase Order Created',
        description: 'The purchase order has been saved with pending status.',
    });
    router.push('/inventory');

  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <h1 className="text-2xl font-semibold">Add Purchase</h1>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Details</CardTitle>
                    <CardDescription>Fill out the form to create a new purchase order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="vendor">Vendor</Label>
                            <Select name="vendor" onValueChange={setVendorId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map((vendor) => (
                                    <SelectItem key={vendor.id} value={vendor.id}>{vendor.vendorName}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="orderDate">Order Date</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={'outline'}
                                    className={cn(
                                        'justify-start text-left font-normal',
                                        !orderDate && 'text-muted-foreground'
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {orderDate ? format(orderDate, 'PPP') : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={orderDate}
                                    onSelect={setOrderDate}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter>
                    <div className='flex gap-2'>
                        <Button type="button" variant="outline"><Upload className="mr-2 h-4 w-4" /> Import with AI</Button>
                        <p className='text-sm text-muted-foreground self-center'>Upload a bill to auto-fill details.</p>
                    </div>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-end">
                            <div className="grid gap-3 col-span-4">
                                {index === 0 && <Label>Item</Label>}
                                {item.isNew ? (
                                    <Input 
                                        type="text" 
                                        placeholder="Enter new item name" 
                                        value={item.productName} 
                                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                    />
                                ) : (
                                    <Select onValueChange={(value) => handleItemChange(index, 'productId', value)} value={item.productId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                            <SelectItem value="add_new">
                                                <div className="flex items-center">
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="grid gap-3 col-span-2">
                               {index === 0 && <Label>Quantity</Label>}
                                <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="1" />
                            </div>
                             <div className="grid gap-3 col-span-2">
                               {index === 0 && <Label>Purchase Price</Label>}
                                <Input type="number" value={item.purchasePrice} onChange={(e) => handleItemChange(index, 'purchasePrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                            </div>
                             <div className="grid gap-3 col-span-2">
                               {index === 0 && <Label>Total</Label>}
                                <Input type="number" value={(item.quantity * item.purchasePrice).toFixed(2)} readOnly placeholder="0.00" className='bg-muted' />
                            </div>
                            <div className="col-span-2 flex items-end">
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
                    <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-5 gap-4">
                        <div className='grid gap-3 col-span-1'>
                            <Label>Subtotal</Label>
                            <Input value={`₹${subtotal.toFixed(2)}`} readOnly className='bg-muted' />
                        </div>
                         <div className='grid gap-3 col-span-1'>
                            <Label>GST (%)</Label>
                            <Input name="gst" type="number" placeholder="e.g. 18" value={gst} onChange={(e) => setGst(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className='grid gap-3 col-span-1'>
                            <Label>Delivery Charges</Label>
                            <Input name="deliveryCharges" type="number" placeholder="0.00" value={deliveryCharges} onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className='grid gap-3 col-span-1'>
                            <Label>Payment Done</Label>
                            <Input name="paymentDone" type="number" placeholder="0.00" value={paymentDone} onChange={(e) => setPaymentDone(parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className='grid gap-3 col-span-1'>
                            <Label>Due</Label>
                            <Input value={`₹${dueAmount.toFixed(2)}`} readOnly className='bg-muted'/>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit">Save Purchase</Button>
                </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
