
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { invoices, customers, products } from '@/lib/data';
import { AppLayout } from '@/components/app-layout';
import { Download, Send } from 'lucide-react';

export default function InvoicePage({ params }: { params: { id: string } }) {
  // In a real app, you'd fetch the invoice data based on the id
  const invoice = invoices.find(i => i.id === params.id) ?? invoices[0];
  const customer = customers.find(c => c.name === invoice.customer.name) ?? customers[0];

  const invoiceItems = [
    { ...products[0], quantity: 2, hsn: '998314', gst: '18%', unit: 'pcs' },
    { ...products[1], quantity: 1, hsn: '998315', gst: '12%', unit: 'pcs' },
  ];

  const subTotal = invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const gstAmount = invoiceItems.reduce((acc, item) => acc + (item.price * item.quantity * (parseInt(item.gst) / 100)), 0);
  const total = subTotal + gstAmount;


  return (
    <AppLayout>
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="outline"><Send /> Send</Button>
        <Button><Download /> Download</Button>
      </div>
      <Card className="max-w-4xl mx-auto p-4 sm:p-8">
        <CardContent>
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-lg font-semibold">Vyapar Co</h2>
              <p className="text-sm text-muted-foreground">123 Business Rd, Suite 100</p>
              <p className="text-sm text-muted-foreground">New Delhi, 110001</p>
              <p className="text-sm text-muted-foreground">Mobile: +91 98765 43210</p>
              <p className="text-sm text-muted-foreground">Email: contact@vyaparco.in</p>
            </div>
             <div className="bg-orange-100 border border-orange-300 px-12 py-3">
                <h1 className="text-2xl font-bold text-orange-800 tracking-wider">INVOICE</h1>
            </div>
          </div>
          
          <div className="flex justify-between mb-8">
             <div>
                <p className="font-semibold">Bill To:</p>
                <p className='font-bold'>{customer.name}</p>
                <p className="text-sm text-muted-foreground">{customer.email}</p>
                 <p className="text-sm text-muted-foreground">Contact No.: +91 99999 88888</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold">Invoice No.:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-semibold">Date:</span> {invoice.issueDate}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead className='bg-orange-100 border border-orange-300'>
              <tr>
                <th className="p-2 border border-orange-300 text-left font-semibold text-orange-800">Sl. No.</th>
                <th className="p-2 border border-orange-300 text-left font-semibold text-orange-800">Service Name</th>
                <th className="p-2 border border-orange-300 text-left font-semibold text-orange-800">HSN/SAC</th>
                <th className="p-2 border border-orange-300 text-right font-semibold text-orange-800">Quantity</th>
                <th className="p-2 border border-orange-300 text-right font-semibold text-orange-800">Unit</th>
                <th className="p-2 border border-orange-300 text-right font-semibold text-orange-800">Price/Unit</th>
                <th className="p-2 border border-orange-300 text-right font-semibold text-orange-800">GST</th>
                <th className="p-2 border border-orange-300 text-right font-semibold text-orange-800">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceItems.map((item, index) => (
                <tr key={item.id}>
                  <td className="p-2 border-b">{index + 1}</td>
                  <td className="p-2 border-b">{item.name}</td>
                  <td className="p-2 border-b">{item.hsn}</td>
                  <td className="p-2 border-b text-right">{item.quantity}</td>
                  <td className="p-2 border-b text-right">{item.unit}</td>
                  <td className="p-2 border-b text-right">₹{item.price.toFixed(2)}</td>
                  <td className="p-2 border-b text-right">{item.gst}</td>
                  <td className="p-2 border-b text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={7} className="p-2 text-right font-bold border-t-2 border-black">Total</td>
                <td className="p-2 text-right font-bold border-t-2 border-black">₹{subTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between mt-8">
            <div>
              <p className="font-semibold">Invoice Amount in Words:</p>
              <p className="bg-orange-100 p-2 text-sm">Rupees Two Thousand Eight Hundred Fifty-Three Only</p>
              <p className="font-semibold mt-4">Terms and Conditions:</p>
              <p className="bg-orange-100 p-2 text-sm">Payment due within 15 days.</p>
            </div>
            <div className="w-1/3 text-right">
              <div className="flex justify-between"><p>Sub Total:</p><p>₹{subTotal.toFixed(2)}</p></div>
              <div className="flex justify-between"><p>SGST@9%:</p><p>₹{(gstAmount/2).toFixed(2)}</p></div>
              <div className="flex justify-between"><p>CGST@9%:</p><p>₹{(gstAmount/2).toFixed(2)}</p></div>
              <div className="flex justify-between"><p>Discount:</p><p>₹0.00</p></div>
              <div className="flex justify-between font-bold bg-orange-100 p-2 mt-2"><p>Total:</p><p>₹{total.toFixed(2)}</p></div>
              <div className="flex justify-between font-bold mt-1"><p>Received:</p><p>₹{invoice.status === 'Paid' ? total.toFixed(2) : '0.00'}</p></div>
            </div>
          </div>
          
          <div className="text-right mt-20">
             <p className="text-sm">Seal & Signature</p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
