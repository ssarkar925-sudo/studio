
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { vendorsDAO, productsDAO, purchasesDAO, type Vendor, type Product, type Purchase } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type PurchaseItem = {
    // A temporary ID for react key prop
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    total: number;
    isNew?: boolean;
};

export default function EditPurchasePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const { data: vendors, isLoading: vendorsLoading } = useFirestoreData(vendorsDAO);
  const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
  const { data: purchases, isLoading: purchasesLoading } = useFirestoreData(purchasesDAO);
  
  // Form State
  const [orderDate, setOrderDate] = useState<Date | undefined>();
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [paymentDone, setPaymentDone] = useState(0);
  const [gst, setGst] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const purchaseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const isLoading = vendorsLoading || productsLoading || purchasesLoading;

  useEffect(() => {
    if (isLoading) return;

    const foundPurchase = purchases.find(p => p.id === purchaseId);
    if (foundPurchase) {
      if (foundPurchase.status !== 'Pending') {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'This purchase order has already been received and cannot be edited.',
        });
        router.push('/inventory?tab=purchases');
        return;
      }
      setPurchase(foundPurchase);
      setVendorId(foundPurchase.vendorId);
      setOrderDate(parse(foundPurchase.orderDate, 'dd/MM/yyyy', new Date()));
      // Add a temporary unique `id` to each item for the key prop in React
      setItems(foundPurchase.items.map(item => ({...item, id: `item-${Math.random()}`})));
      setPaymentDone(foundPurchase.paymentDone || 0);
      setGst(foundPurchase.gst || 0);
      setDeliveryCharges(foundPurchase.deliveryCharges || 0);
    } else {
       toast({
            variant: 'destructive',
            title: 'Not Found',
            description: 'Purchase order not found.',
        });
        router.push('/inventory?tab=purchases');
    }
  }, [purchaseId, purchases, router, toast, isLoading]);


  const handleAddItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, productId: '', productName: '', quantity: 1, purchasePrice: 0, total: 0 },
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
            item.purchasePrice = 0;
        } else {
            item.isNew = false;
            const product = products.find(p => p.id === value);
            if (product) {
              item.productName = product.name;
              item.purchasePrice = product.purchasePrice; // Default to last purchase price
            }
        }
    }
    
    // Recalculate total
    item.total = item.quantity * item.purchasePrice;
    
    newItems[index] = item;
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalGst = subtotal * (gst / 100);
    const totalAmount = subtotal + totalGst + deliveryCharges;
    const dueAmount = totalAmount - paymentDone;
    return { subtotal, totalAmount, dueAmount };
  }, [items, gst, deliveryCharges, paymentDone]);

  const { subtotal, totalAmount, dueAmount } = calculateTotals();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(isSaving) return;
    
    const vendor = vendors.find(v => v.id === vendorId);

    if (!vendor || !orderDate || items.length === 0 || items.some(i => !i.productName || i.purchasePrice <= 0)) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please select a vendor, order date, and ensure all items have a name and a valid purchase price.',
        });
        return;
    }

    setIsSaving(true);
    try {
      await purchasesDAO.update(purchaseId, {
          vendorId: vendor.id,
          vendorName: vendor.vendorName,
          orderDate: format(orderDate, 'dd/MM/yyyy'),
          items: items.map(({id, ...rest}) => ({...rest})),
          totalAmount,
          paymentDone,
          dueAmount,
          status: 'Pending',
          gst,
          deliveryCharges,
      });

      toast({
          title: 'Purchase Order Updated',
          description: 'The purchase order has been successfully updated.',
      });
      router.push('/inventory?tab=purchases');
    } catch (error) {
       console.error("Update failed", error);
       toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: 'Could not update purchase order.',
      });
       setIsSaving(false);
    }
  };

  if (isLoading || !purchase) {
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
        <h1 className="text-2xl font-semibold">Edit Purchase</h1>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Purchase Details</CardTitle>
                    <CardDescription>Update the details for this purchase order.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="vendor">Vendor</Label>
                            <Select onValueChange={setVendorId} value={vendorId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a vendor" />
                              </SelectTrigger>
                              <SelectContent>
                                {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>)}
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
                                    {orderDate ? format(orderDate, 'dd/MM/yyyy') : <span>Pick a date</span>}
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
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                            <div className="grid gap-3 col-span-12 sm:col-span-4">
                                {index === 0 && <Label className="hidden sm:block">Item</Label>}
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
                                            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.batchCode})</SelectItem>)}
                                            <SelectItem value="add_new">
                                                <div className="flex items-center">
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
                                                </div>
                                            </SelectItem>
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
                                <Input type="number" step="0.01" value={item.purchasePrice} onChange={(e) => handleItemChange(index, 'purchasePrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                            </div>
                             <div className="grid gap-3 col-span-4 sm:col-span-2">
                               {index === 0 && <Label className="hidden sm:block">Total</Label>}
                                <Input type="number" value={item.total.toFixed(2)} readOnly placeholder="0.00" className='bg-muted' />
                            </div>
                            <div className="col-span-12 sm:col-span-2 flex items-end">
                                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveItem(index)} className="w-full sm:w-auto">
                                    <Trash2 />
                                </Button>
                            </div>
                        </div>
                        ))}
                        <Button type="button" variant="outline" onClick={handleAddItem} className="w-full sm:w-auto">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
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
                    <Button variant="outline" type="button" onClick={() => router.push('/inventory?tab=purchases')} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Purchase
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

    