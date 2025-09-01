
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { vendorsDAO, productsDAO, purchasesDAO, type Vendor, type Product } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Upload, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { extractPurchaseInfoFromBill } from '@/ai/flows/extract-purchase-info-flow';
import { useFirestoreData } from '@/hooks/use-firestore-data';

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

export default function NewPurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: vendors } = useFirestoreData(vendorsDAO);
  const { data: products } = useFirestoreData(productsDAO);
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [paymentDone, setPaymentDone] = useState(0);
  const [gst, setGst] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalGst = subtotal * (gst / 100);
    const totalAmount = subtotal + totalGst + deliveryCharges;
    const dueAmount = totalAmount - paymentDone;
    return { subtotal, totalAmount, dueAmount };
  };

  const { subtotal, totalAmount, dueAmount } = calculateTotals();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    toast({ title: 'Extracting Details...', description: 'Please wait while the AI analyzes the bill.' });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const photoDataUri = reader.result as string;
      try {
        const result = await extractPurchaseInfoFromBill({ photoDataUri });

        // Auto-fill form
        if (result.vendorName) {
            const existingVendor = vendors.find(v => v.vendorName.toLowerCase() === result.vendorName!.toLowerCase());
            if (existingVendor) {
                setVendorId(existingVendor.id);
            } else {
                // If vendor does not exist, you could potentially add it or prompt the user.
                // For now, we leave it blank but show a toast.
                toast({ title: 'New Vendor Detected', description: `"${result.vendorName}" is not in your vendor list.`});
            }
        }
        if (result.orderDate) {
            setOrderDate(parse(result.orderDate, 'MMMM d, yyyy', new Date()));
        }
        if (result.items) {
            const newItems: PurchaseItem[] = result.items.map(item => {
                 const existingProduct = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
                 return {
                    id: `item-${Date.now()}-${Math.random()}`,
                    productId: existingProduct ? existingProduct.id : `new_${Date.now()}-${Math.random()}`,
                    productName: item.productName,
                    quantity: item.quantity,
                    purchasePrice: item.purchasePrice,
                    total: item.total,
                    isNew: !existingProduct,
                 }
            });
            setItems(newItems);
        }

        setGst(result.gst || 0);
        setDeliveryCharges(result.deliveryCharges || 0);
        setPaymentDone(result.paymentDone || 0);
        
        toast({ title: 'Success!', description: 'Purchase details have been auto-filled.'});

      } catch (error) {
        console.error("AI extraction failed", error);
        toast({ variant: 'destructive', title: 'Extraction Failed', description: 'Could not extract details from the image.' });
      } finally {
        setIsExtracting(false);
         // Reset file input
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = (error) => {
        console.error("File reading failed", error);
        toast({ variant: 'destructive', title: 'File Error', description: 'Could not read the selected file.' });
        setIsExtracting(false);
    };
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const vendor = vendors.find(v => v.id === vendorId);

    if (!vendor || !orderDate || items.length === 0 || items.some(i => !i.productName || i.purchasePrice <= 0)) {
        toast({
            variant: 'destructive',
            title: 'Missing Fields',
            description: 'Please select a vendor, order date, and ensure all items have a name and a valid purchase price.',
        });
        return;
    }

    try {
      await purchasesDAO.add({
          vendorId: vendor.id,
          vendorName: vendor.vendorName,
          orderDate: format(orderDate, 'PPP'),
          items: items.map(({id, ...rest}) => ({...rest})),
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
      router.push('/inventory?tab=purchases');
    } catch(error) {
        toast({
          variant: 'destructive',
          title: 'Creation Failed',
          description: 'Could not create purchase order.',
      });
    }
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
                            <Select name="vendor" required onValueChange={setVendorId} value={vendorId}>
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
                    <div className='flex gap-2 items-center'>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isExtracting}>
                            {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Import with AI
                        </Button>
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
                        <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
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
                            <div className="grid gap-3 col-span-2">
                               {index === 0 && <Label>Quantity</Label>}
                                <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)} placeholder="1" />
                            </div>
                             <div className="grid gap-3 col-span-2">
                               {index === 0 && <Label>Purchase Price</Label>}
                                <Input type="number" step="0.01" value={item.purchasePrice} onChange={(e) => handleItemChange(index, 'purchasePrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                            </div>
                             <div className="grid gap-3 col-span-2">
                               {index === 0 && <Label>Total</Label>}
                                <Input type="number" value={item.total.toFixed(2)} readOnly placeholder="0.00" className='bg-muted' />
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
                    <Button variant="outline" type="button" onClick={() => router.push('/inventory?tab=purchases')}>Cancel</Button>
                    <Button type="submit">Save Purchase</Button>
                </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
