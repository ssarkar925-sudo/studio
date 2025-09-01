
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { invoicesDAO, type Invoice } from '@/lib/data';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, Pencil, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';


function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variant = {
    Paid: 'default',
    Pending: 'secondary',
    Overdue: 'destructive',
    Partial: 'outline',
  }[status] as 'default' | 'secondary' | 'destructive' | 'outline';
  
  if (status === 'Partial') {
    return <Badge variant={variant} className="capitalize border-accent text-accent">{status.toLowerCase()}</Badge>;
  }

  return <Badge variant={variant} className="capitalize">{status.toLowerCase()}</Badge>;
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  );
}

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: invoices, isLoading } = useFirestoreData(invoicesDAO);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!isLoading) {
      const foundInvoice = invoices.find((i) => i.id === invoiceId);
      if (foundInvoice) {
        setInvoice(foundInvoice);
      }
    }
  }, [params.id, invoices, isLoading, invoiceId]);

  const handlePrint = (format: 'a4' | 'receipt') => {
    const url = `/invoices/${invoiceId}/print${format === 'receipt' ? '/receipt' : ''}`;
    const printWindow = window.open(url, '_blank');
    printWindow?.focus();
  };

  const handleShareOnWhatsApp = async () => {
    if (!invoice) return;

    setIsSharing(true);
    toast({
        title: 'Generating PDF...',
        description: 'Please wait while we create the invoice PDF for sharing.'
    });

    try {
        const invoicePrintElement = document.createElement('div');
        invoicePrintElement.style.position = 'absolute';
        invoicePrintElement.style.left = '-9999px';
        invoicePrintElement.style.width = '800px';

        // We need to render the print component off-screen to generate the PDF
        const printContent = await (await fetch(`/invoices/${invoiceId}/print`)).text();
        // This is a simplified approach; a more robust solution would use ReactDOMServer or a dedicated render-to-string method.
        invoicePrintElement.innerHTML = printContent;
        document.body.appendChild(invoicePrintElement);
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        const canvas = await html2canvas(invoicePrintElement, {
            scale: 2,
        });

        document.body.removeChild(invoicePrintElement);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // In a real application, you would upload this PDF to a cloud storage (like Firebase Storage)
        // and get a public URL. For this demo, we'll use a placeholder.
        const pdfBlob = pdf.output('blob');
        console.log("PDF Blob generated, ready for upload.", pdfBlob);
        const invoiceUrl = "https://example.com/invoice.pdf"; // Placeholder URL
        
        toast({
            title: 'PDF Ready!',
            description: 'PDF has been generated. You would now upload it.',
        });
        
        const message = `Hello ${invoice.customer.name},\n\nPlease find your invoice here: ${invoiceUrl}\n\nTotal Amount: ₹${invoice.amount.toFixed(2)}\nAmount Due: ₹${(invoice.dueAmount || 0).toFixed(2)}\n\nThank you!`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');

    } catch (error) {
        console.error("Failed to generate or share PDF", error);
        toast({
            variant: 'destructive',
            title: 'Sharing Failed',
            description: 'Could not generate the invoice PDF for sharing.',
        });
    } finally {
        setIsSharing(false);
    }
};

  if (isLoading || !invoice) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-4xl gap-2">
                <h1 className="text-2xl font-semibold">Loading...</h1>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Button>
                <h1 className="text-xl md:text-2xl font-semibold">Invoice Details</h1>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push(`/invoices/${invoiceId}/edit`)}>
                    <Pencil className="mr-2" />
                    Edit
                </Button>
                 <Button variant="outline" onClick={handleShareOnWhatsApp} disabled={isSharing}>
                    {isSharing ? <Loader2 className="mr-2 animate-spin" /> : <WhatsAppIcon className="mr-2" />}
                    Share
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Printer className="mr-2" />
                      Print
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handlePrint('a4')}>A4 Invoice</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handlePrint('receipt')}>Thermal Receipt</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
                    <CardDescription>
                      For {invoice.customer.name}
                    </CardDescription>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Customer</p>
                        <p>{invoice.customer.name}</p>
                        <p className='text-sm text-muted-foreground'>{invoice.customer.email}</p>
                    </div>
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Issue Date</p>
                        <p>{invoice.issueDate}</p>
                    </div>
                    <div className="grid gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                        <p>{invoice.dueDate}</p>
                    </div>
                </div>
                <Separator />
                 <div className="grid gap-3">
                    <h3 className="text-lg font-medium">Items</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">{item.productName}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">₹{item.sellingPrice.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-medium">₹{item.total.toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 {invoice.orderNote && (
                    <>
                        <Separator />
                        <div className="grid gap-3">
                            <h3 className="text-lg font-medium">Order Note</h3>
                            <p className="text-sm text-muted-foreground">{invoice.orderNote}</p>
                        </div>
                    </>
                 )}
                <div className="flex justify-end">
                    <div className="grid gap-2 w-full max-w-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>₹{invoice.subtotal.toFixed(2)}</span>
                        </div>
                        {invoice.gstAmount !== undefined && (
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">GST ({invoice.gstPercentage || 0}%)</span>
                                <span>₹{invoice.gstAmount.toFixed(2)}</span>
                            </div>
                        )}
                        {invoice.deliveryCharges !== undefined && invoice.deliveryCharges > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Delivery</span>
                                <span>₹{invoice.deliveryCharges.toFixed(2)}</span>
                            </div>
                        )}
                        {invoice.discount !== undefined && invoice.discount > 0 && (
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount</span>
                                <span className="text-destructive">- ₹{invoice.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>₹{invoice.amount.toFixed(2)}</span>
                        </div>
                        <Separator />
                        {invoice.paidAmount !== undefined && (
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Paid</span>
                                <span>₹{invoice.paidAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg">
                            <span>Due</span>
                            <span>₹{(invoice.dueAmount || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
