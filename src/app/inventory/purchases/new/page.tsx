

'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { vendorsDAO, productsDAO, purchasesDAO, type Vendor, type Product } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { CalendarIcon, PlusCircle, Trash2, Upload, Loader2, UserPlus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { extractPurchaseInfoFromBill } from '@/ai/flows/extract-purchase-info-flow';
import type { ExtractPurchaseInfoOutput } from '@/ai/flows/schemas';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useAuth } from '@/components/auth-provider';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


type PurchaseItem = {
    // A temporary ID for react key prop
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
    total: number;
    isNew?: boolean;
    sku?: string;
    batchCode?: string;
};

function AiReviewDialog({ open, onOpenChange, aiData, onConfirm }: { open: boolean, onOpenChange: (open: boolean) => void, aiData: ExtractPurchaseInfoOutput | null, onConfirm: (data: ExtractPurchaseInfoOutput) => void }) {
    if (!aiData) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Confirm Extracted Details</DialogTitle>
                    <DialogDescription>Review the details extracted by AI. Edit any incorrect information on the main form after confirming.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 max-h-[60vh] overflow-y-auto p-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><span className="font-semibold">Vendor:</span> {aiData.vendorName || 'N/A'}</div>
                        <div><span className="font-semibold">Order Date:</span> {aiData.orderDate || 'N/A'}</div>
                        <div><span className="font-semibold">GST:</span> {aiData.gst || 0}%</div>
                        <div><span className="font-semibold">Delivery:</span> ₹{aiData.deliveryCharges || 0}</div>
                         <div><span className="font-semibold">Paid:</span> ₹{aiData.paymentDone || 0}</div>
                        <div><span className="font-semibold">Total:</span> ₹{aiData.totalAmount || 0}</div>
                    </div>
                    <Card>
                        <CardHeader><CardTitle>Extracted Items</CardTitle></CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {aiData.items?.map((item, index) => (
                                    <li key={index} className="text-sm p-2 bg-muted rounded-md">
                                        <p className="font-semibold">{item.productName}</p>
                                        <p>Qty: {item.quantity}, Price: ₹{item.purchasePrice}, Total: ₹{item.total}</p>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={() => onConfirm(aiData)}>Confirm and Fill Form</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function NewPurchasePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: vendors } = useFirestoreData(vendorsDAO);
  const { data: products } = useFirestoreData(productsDAO);
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [paymentDone, setPaymentDone] = useState(0);
  const [gst, setGst] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isNewVendorDialogOpen, setIsNewVendorDialogOpen] = useState(false);
  const [aiData, setAiData] = useState<ExtractPurchaseInfoOutput | null>(null);
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false);

  const addedProductIds = useMemo(() => new Set(items.filter(item => !item.isNew).map(item => item.productId)), [items]);
  
  const handleAddItem = (isNew = false) => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, productId: '', productName: '', quantity: 1, purchasePrice: 0, total: 0, isNew },
    ]);
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item[field] as any) = value;

    if (field === 'productId') {
        const product = products.find(p => p.id === value);
        if (product) {
          item.productName = product.name;
          item.purchasePrice = product.purchasePrice; // Default to last purchase price
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
        setAiData(result);
        setIsAiReviewOpen(true);
      } catch (error) {
        console.error("AI extraction failed", error);
        toast({ variant: 'destructive', title: 'Extraction Failed', description: 'Could not extract details from the image. The AI model might be busy, please try again.' });
      } finally {
        setIsExtracting(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = (error) => {
        console.error("File reading failed", error);
        toast({ variant: 'destructive', title: 'File Error', description: 'Could not read the selected file.' });
        setIsExtracting(false);
    };
  }

  const handleAiConfirm = (data: ExtractPurchaseInfoOutput) => {
    if (data.vendorName) {
        const existingVendor = vendors.find(v => v.vendorName.toLowerCase() === data.vendorName!.toLowerCase());
        if (existingVendor) {
            setVendorId(existingVendor.id);
        } else {
            toast({ title: 'New Vendor Detected', description: `"${data.vendorName}" is not in your vendor list. You can add it now.`});
        }
    }
    if (data.orderDate) {
        try {
            setOrderDate(parse(data.orderDate, 'dd/MM/yyyy', new Date()));
        } catch (e) {
             toast({ variant: 'destructive', title: 'Invalid Date', description: 'AI extracted an invalid date format.' });
        }
    }
    if (data.items) {
        const newItems: PurchaseItem[] = data.items.map(item => {
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

    setGst(data.gst || 0);
    setDeliveryCharges(data.deliveryCharges || 0);
    setPaymentDone(data.paymentDone || 0);
    
    toast({ title: 'Success!', description: 'Purchase details have been auto-filled.'});
    setIsAiReviewOpen(false);
    setAiData(null);
  }
  
    const handleNewVendorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const vendorName = formData.get('vendorName') as string;

    if (!vendorName) {
      toast({
        variant: 'destructive',
        title: 'Name is required',
      });
      return;
    }

    try {
      const newVendor = await vendorsDAO.add({
        userId: user.uid,
        vendorName: vendorName,
        contactPerson: formData.get('contactPerson') as string,
        contactNumber: formData.get('contactNumber') as string,
        email: formData.get('email') as string,
        gstn: formData.get('gstn') as string,
        address: formData.get('address') as string,
      });

      toast({
        title: 'Vendor Created',
        description: `Successfully created ${newVendor.vendorName}.`,
      });
      setVendorId(newVendor.id);
      setIsNewVendorDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create vendor',
      });
    }
  }


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || !user) return;
    
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
      // For a given purchase, all items should have the same batch code.
      const batchCode = `BCH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const finalItems = items.map(item => {
        const sku = item.isNew ? Math.random().toString(36).substring(2, 10).toUpperCase() : products.find(p => p.id === item.productId)?.sku;
        return {
          ...item,
          sku,
          batchCode,
        }
      });
      
      await purchasesDAO.add({
          userId: user.uid,
          vendorId: vendor.id,
          vendorName: vendor.vendorName,
          orderDate: format(orderDate, 'dd/MM/yyyy'),
          items: finalItems.map(({id, ...rest}) => ({...rest})),
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
      setIsSaving(false);
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="vendor">Vendor</Label>
                            <div className="flex gap-2">
                                <Select value={vendorId} onValueChange={setVendorId}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a vendor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {vendors.map(vendor => (
                                      <SelectItem key={vendor.id} value={vendor.id}>
                                        {vendor.vendorName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Dialog open={isNewVendorDialogOpen} onOpenChange={setIsNewVendorDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <UserPlus />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleNewVendorSubmit}>
                                            <DialogHeader>
                                                <DialogTitle>Add New Vendor</DialogTitle>
                                                <DialogDescription>
                                                    Create a new vendor profile. This will be saved to your contacts.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="vendorName">Vendor Name</Label>
                                                    <Input id="vendorName" name="vendorName" placeholder="e.g. Acme Inc." required />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="contactPerson">Contact Person</Label>
                                                    <Input id="contactPerson" name="contactPerson" placeholder="John Doe" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="contactNumber">Contact Number</Label>
                                                    <Input id="contactNumber" name="contactNumber" type="tel" placeholder="+91 98765 43210" />
                                                </div>
                                                 <div className="grid gap-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" name="email" type="email" placeholder="contact@acme.com" />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="gstn">GSTN</Label>
                                                    <Input id="gstn" name="gstn" type="text" placeholder="29AABCU9603R1ZM" />
                                                </div>
                                                 <div className="grid gap-2">
                                                    <Label htmlFor="address">Address</Label>
                                                    <Textarea id="address" name="address" placeholder="Enter vendor's address" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <Button type="submit">Save Vendor</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
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
                 <CardFooter>
                    <div className='flex gap-2 items-center'>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isExtracting || isSaving}>
                            {isExtracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Import with AI
                        </Button>
                        <p className='text-sm text-muted-foreground self-center hidden sm:inline'>Upload a bill to auto-fill details.</p>
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
                                    <Select
                                        value={item.productId}
                                        onValueChange={(value) => handleItemChange(index, 'productId', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an item" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.filter(p => !addedProductIds.has(p.id) || p.id === item.productId).map(product => (
                                                <SelectItem key={product.id} value={product.id}>
                                                    {product.name}
                                                </SelectItem>
                                            ))}
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
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={() => handleAddItem(false)}>
                                <PlusCircle className="mr-2" />
                                Add Item
                            </Button>
                            <Button type="button" variant="outline" onClick={() => handleAddItem(true)}>
                                <PlusCircle className="mr-2" />
                                Add New Item
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                        <div className='grid gap-3 md:col-span-1'>
                            <Label>Subtotal</Label>
                            <Input value={`₹${subtotal.toFixed(2)}`} readOnly className='bg-muted' />
                        </div>
                         <div className='grid gap-3 md:col-span-1'>
                            <Label>GST (%)</Label>
                            <Input name="gst" type="number" placeholder="e.g. 18" value={gst} onChange={(e) => setGst(parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className='grid gap-3 md:col-span-1'>
                            <Label>Delivery Charges</Label>
                            <Input name="deliveryCharges" type="number" placeholder="0.00" value={deliveryCharges} onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className='grid gap-3 md:col-span-1'>
                            <Label>Payment Done</Label>
                            <Input name="paymentDone" type="number" placeholder="0.00" value={paymentDone} onChange={(e) => setPaymentDone(parseFloat(e.target.value) || 0)} />
                        </div>
                         <div className='grid gap-3 md:col-span-1'>
                            <Label>Due</Label>
                            <Input value={`₹${dueAmount.toFixed(2)}`} readOnly className='bg-muted'/>
                        </div>
                    </div>
                </CardContent>
                 <CardFooter className="justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => router.push('/inventory?tab=purchases')} disabled={isSaving}>Cancel</Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Purchase
                    </Button>
                </CardFooter>
            </Card>
          </div>
        </form>
      </div>
      <AiReviewDialog
        open={isAiReviewOpen}
        onOpenChange={setIsAiReviewOpen}
        aiData={aiData}
        onConfirm={handleAiConfirm}
      />
    </AppLayout>
  );
}
