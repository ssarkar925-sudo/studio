

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
import { customersDAO, invoicesDAO, productsDAO, type Product, type Invoice, type Customer } from '@/lib/data';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2, Loader2, XIcon, ScanLine, UserPlus, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { TagScanner } from '@/components/tag-scanner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { useAuth } from '@/components/auth-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


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
  const { user } = useAuth();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const { data: customers, isLoading: customersLoading } = useFirestoreData(customersDAO);
  const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);

  // State to manage popover open status for each item
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  // Summary state
  const [gstPercentage, setGstPercentage] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [orderNote, setOrderNote] = useState('');

  const productOptions = useMemo(() => {
    // Get a set of product IDs that are already in the items list
    const addedProductIds = new Set(items.map(item => item.productId));

    return products.map(p => ({
        value: p.id,
        label: `${p.name} (Stock: ${p.stock})`,
        // Disable if stock is zero OR if it's already in the list
        disabled: p.stock <= 0 || addedProductIds.has(p.id)
    }));
  }, [products, items]);

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
  
   const handleScan = (product: Product) => {
    const existingItemIndex = items.findIndex(item => item.productId === product.id && !item.isManual);

    if (existingItemIndex !== -1) {
      // If item already exists, increase its quantity
      const newItems = [...items];
      newItems[existingItemIndex].quantity += 1;
      newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].sellingPrice;
      setItems(newItems);
    } else {
      // If item doesn't exist, add it as a new line
      const newItem: InvoiceItem = {
        id: `item-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        quantity: 1,
        sellingPrice: product.sellingPrice,
        total: product.sellingPrice,
        isManual: false
      };
      
      if (items.length === 1 && items[0].productName === '') {
         setItems([newItem]);
      } else {
         setItems([...items, newItem]);
      }
    }
    setIsScannerOpen(false);
  };


  const calculateSummary = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const gstAmount = subtotal * (gstPercentage / 100);
    const total = subtotal + gstAmount + deliveryCharges - discount;
    const dueAmount = total - paidAmount;
    return { subtotal, gstAmount, total, dueAmount };
  }, [items, gstPercentage, deliveryCharges, discount, paidAmount]);
  
  const { subtotal, gstAmount, total, dueAmount } = calculateSummary();

  const handleNewCustomerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    if (!name) {
      toast({
        variant: 'destructive',
        title: 'Name is required',
      });
      return;
    }

    try {
      const newCustomer = await customersDAO.add({
        userId: user.uid,
        name: name,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        totalInvoiced: 0,
        totalPaid: 0,
        invoices: 0,
      });

      toast({
        title: 'Customer Created',
        description: `Successfully created ${newCustomer.name}.`,
      });
      setCustomerId(newCustomer.id);
      setIsNewCustomerDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create customer',
      });
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || !user) return;

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
      const invoiceNumber = String(Date.now()).slice(-6);
      await invoicesDAO.add({
        userId: user.uid,
        invoiceNumber,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
        issueDate: format(new Date(), 'dd/MM/yyyy'),
        dueDate: dueDate ? format(dueDate, 'dd/MM/yyyy') : 'N/A',
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
  
  const isLoading = customersLoading || productsLoading;

  return (
    <>
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <h1 className="text-2xl font-semibold">New Invoice</h1>
      </div>
      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading form...</div>
      ) : (
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
                                <div className="flex gap-2">
                                  <Select value={customerId} onValueChange={setCustomerId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {customers.map(customer => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                          {customer.name}{customer.phone ? ` (${customer.phone})` : ''}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}>
                                      <DialogTrigger asChild>
                                          <Button variant="outline" size="icon">
                                              <UserPlus />
                                          </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                          <form onSubmit={handleNewCustomerSubmit}>
                                              <DialogHeader>
                                                  <DialogTitle>Add New Customer</DialogTitle>
                                                  <DialogDescription>
                                                      Create a new customer profile. This will be saved to your contacts.
                                                  </DialogDescription>
                                              </DialogHeader>
                                              <div className="grid gap-4 py-4">
                                                  <div className="grid gap-2">
                                                      <Label htmlFor="name">Name</Label>
                                                      <Input id="name" name="name" placeholder="John Doe" required />
                                                  </div>
                                                  <div className="grid gap-2">
                                                      <Label htmlFor="email">Email</Label>
                                                      <Input id="email" name="email" type="email" placeholder="john.doe@example.com" />
                                                  </div>
                                                  <div className="grid gap-2">
                                                      <Label htmlFor="phone">Phone</Label>
                                                      <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" />
                                                  </div>
                                                  <div className="grid gap-2">
                                                      <Label htmlFor="address">Address</Label>
                                                      <Textarea id="address" name="address" placeholder="Enter customer's address" />
                                                  </div>
                                              </div>
                                              <DialogFooter>
                                                  <DialogClose asChild>
                                                    <Button type="button" variant="outline">Cancel</Button>
                                                  </DialogClose>
                                                  <Button type="submit">Save Customer</Button>
                                              </DialogFooter>
                                          </form>
                                      </DialogContent>
                                  </Dialog>
                                </div>
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
                                       <Popover open={openPopoverIndex === index} onOpenChange={(isOpen) => setOpenPopoverIndex(isOpen ? index : null)}>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              role="combobox"
                                              aria-expanded={openPopoverIndex === index}
                                              className="w-full justify-between"
                                            >
                                              {item.productId
                                                ? productOptions.find((p) => p.value === item.productId)?.label.split(' (Stock:')[0]
                                                : "Select an item..."}
                                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                              <CommandInput placeholder="Search item..." />
                                              <CommandList>
                                                <CommandEmpty>No product found.</CommandEmpty>
                                                <CommandGroup>
                                                  {productOptions.map((option) => (
                                                    <CommandItem
                                                      key={option.value}
                                                      value={option.value}
                                                      disabled={option.disabled}
                                                      onSelect={(currentValue) => {
                                                        handleItemChange(index, 'productId', currentValue === item.productId ? "" : currentValue);
                                                        setOpenPopoverIndex(null);
                                                      }}
                                                    >
                                                      <Check
                                                        className={cn(
                                                          "mr-2 h-4 w-4",
                                                          item.productId === option.value ? "opacity-100" : "opacity-0"
                                                        )}
                                                      />
                                                      {option.label}
                                                    </CommandItem>
                                                  ))}
                                                </CommandGroup>
                                              </CommandList>
                                            </Command>
                                          </PopoverContent>
                                        </Popover>
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
                                <Button type="button" variant="outline" onClick={() => setIsScannerOpen(true)}>
                                    <ScanLine className="mr-2" />
                                    Scan Item
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className='space-y-6'>
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
                                        {dueDate ? format(dueDate, 'dd/MM/yyyy') : <span>Pick a date</span>}
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
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-muted-foreground">Subtotal</Label>
                                    <span className='text-right font-medium'>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label className="text-muted-foreground">GST (%)</Label>
                                    <div className='flex items-center gap-2'>
                                        <Input type="number" placeholder="0" value={gstPercentage} onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)} className="w-20 h-8 text-right" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label className="text-muted-foreground">Delivery</Label>
                                    <Input type="number" placeholder="0.00" value={deliveryCharges} onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" />
                                </div>
                                <div className="flex justify-between items-center">
                                    <Label className="text-muted-foreground">Discount</Label>
                                     <Input type="number" placeholder="0.00" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" />
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center font-bold text-lg">
                                    <Label>Total</Label>
                                    <span className='text-right'>₹{total.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <Label className="text-muted-foreground">Paid Amount</Label>
                                    <Input type="number" placeholder="0.00" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" />
                                </div>
                                 <div className="flex justify-between items-center font-semibold">
                                    <Label>Due Amount</Label>
                                    <span className='text-right'>₹{dueAmount.toFixed(2)}</span>
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
      )}
    </AppLayout>
    <TagScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={handleScan}
        products={products}
    />
    </>
  );
}
