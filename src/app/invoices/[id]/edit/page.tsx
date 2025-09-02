
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
import { CalendarIcon, PlusCircle, Trash2, Loader2, XIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { useEffect, useState, useCallback, useMemo } from 'react';
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

export default function EditInvoicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { data: customers, isLoading: customersLoading } = useFirestoreData(customersDAO);
  const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);

  const [invoice, setInvoice] = useState<Invoice | null>(null);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [status, setStatus] = useState<Invoice['status']>();
  const [customerId, setCustomerId] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Summary state
  const [gstPercentage, setGstPercentage] = useState(0);
  const [deliveryCharges, setDeliveryCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [orderNote, setOrderNote] = useState('');


  const isLoading = customersLoading || productsLoading || invoicesLoading;

  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
        const foundInvoice = invoices.find((i) => i.id === invoiceId);
        if (foundInvoice) {
            setInvoice(foundInvoice);
            setInvoiceNumber(foundInvoice.invoiceNumber);

            const parsedIssueDate = parse(foundInvoice.issueDate, 'dd/MM/yyyy', new Date());
            if (isValid(parsedIssueDate)) {
                setIssueDate(parsedIssueDate);
            } else {
                setIssueDate(undefined);
            }

            if(foundInvoice.dueDate && foundInvoice.dueDate !== 'N/A') {
                const parsedDueDate = parse(foundInvoice.dueDate, 'dd/MM/yyyy', new Date());
                 if (isValid(parsedDueDate)) {
                    setDueDate(parsedDueDate);
                } else {
                    setDueDate(undefined);
                }
            }
            setStatus(foundInvoice.status);
            setCustomerId(foundInvoice.customer.id);
            setItems(foundInvoice.items.map(item => ({
              ...item, 
              id: `item-${Math.random()}`,
              isManual: !products.some(p => p.id === item.productId)
            })));

            // Set summary fields
            setGstPercentage(foundInvoice.gstPercentage || 0);
            setDeliveryCharges(foundInvoice.deliveryCharges || 0);
            setDiscount(foundInvoice.discount || 0);
            setPaidAmount(foundInvoice.paidAmount || 0);
            setOrderNote(foundInvoice.orderNote || '');

        } else {
             toast({
                variant: 'destructive',
                title: 'Invoice not found',
            });
            router.push('/invoices');
        }
    }
  }, [invoiceId, invoices, products, isLoading, router, toast]);

  const handleAddItem = (isManual = false) => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, productId: '', productName: '', quantity: 1, sellingPrice: 0, total: 0, isManual },
    ]);
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

  useEffect(() => {
    // Automatically update status based on amounts
    if (dueAmount <= 0) {
      setStatus('Paid');
    } else if (paidAmount > 0) {
      setStatus('Partial');
    } else {
      setStatus('Pending'); // Or Overdue, logic for which is not implemented here yet
    }
  }, [dueAmount, paidAmount]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoice || isSaving) return;
    
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
    
    setIsSaving(true);
    const updatedInvoiceData: Partial<Omit<Invoice, 'id'>> = {
      invoiceNumber,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      issueDate: format(issueDate, 'dd/MM/yyyy'),
      dueDate: dueDate ? format(dueDate, 'dd/MM/yyyy') : 'N/A',
      status: status || 'Pending',
      items: items.map(({id, isManual, ...rest}) => rest),
      subtotal,
      gstPercentage,
      gstAmount,
      deliveryCharges,
      discount,
      amount: total,
      paidAmount,
      dueAmount,
      orderNote,
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
        setIsSaving(false);
    }
  };
  
  const productOptions = useMemo(() => {
    return products.map((p: Product) => {
      const originalItem = invoice?.items.find(i => i.productId === p.id);
      const originalQuantity = originalItem ? originalItem.quantity : 0;
      const availableStock = p.stock + originalQuantity;
      return {
          value: p.id,
          label: `${p.name} (Stock: ${availableStock})`,
          disabled: availableStock <= 0 && !originalItem
      }
    })
  }, [products, invoice]);

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="invoiceNumber">Invoice Number</Label>
                            <Input id="invoiceNumber" name="invoiceNumber" type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="customer">Customer</Label>
                            <Select value={customerId} onValueChange={setCustomerId} disabled>
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
                        </div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                {issueDate ? format(issueDate, 'dd/MM/yyyy') : <span>Pick a date</span>}
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
                            <Label htmlFor="status">Status</Label>
                            <Select name="status" required onValueChange={(value) => setStatus(value as Invoice['status'])} value={status} disabled>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Paid">Paid</SelectItem>
                                <SelectItem value="Partial">Partial</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Overdue">Overdue</SelectItem>
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
                                    <Select value={item.productId} onValueChange={(value) => handleItemChange(index, 'productId', value)}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select an item" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {productOptions.map(p => (
                                          <SelectItem key={p.value} value={p.value} disabled={p.disabled}>
                                            {p.label}
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
                                <Input type="number" value={item.sellingPrice} onChange={(e) => handleItemChange(index, 'sellingPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" step="0.01" disabled={!item.isManual}/>
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
                     <div className='space-y-6'>
                        <div className="grid gap-3">
                            <Label htmlFor="dueDate">Due Date</Label>
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
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">Subtotal</Label>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">GST</Label>
                                    <div className='flex items-center gap-2'>
                                        <Input type="number" placeholder="0" value={gstPercentage} onChange={(e) => setGstPercentage(parseFloat(e.target.value) || 0)} className="w-20 h-8 text-right" />
                                        <span>%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">Delivery</Label>
                                    <Input type="number" placeholder="0.00" value={deliveryCharges} onChange={(e) => setDeliveryCharges(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">Discount</Label>
                                     <Input type="number" placeholder="0.00" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between font-bold text-lg">
                                    <Label>Total</Label>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <Label className="text-muted-foreground">Paid Amount</Label>
                                    <Input type="number" placeholder="0.00" value={paidAmount} onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right" />
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
                        Save Changes
                    </Button>
                </CardFooter>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

    