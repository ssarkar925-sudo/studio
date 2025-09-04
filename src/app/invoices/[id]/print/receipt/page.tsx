
'use client';

import { PrintLayout } from '@/app/print-layout';
import { invoicesDAO, businessProfileDAO, type Invoice, type BusinessProfile } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Separator } from '@/components/ui/separator';

export default function PrintReceiptPage() {
  const params = useParams();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
  const { data: businessProfiles, isLoading: profileLoading } = useFirestoreData(businessProfileDAO);
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const printTriggered = useRef(false);

  const isLoading = invoicesLoading || profileLoading;

  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
      const foundInvoice = invoices.find((i) => i.id === invoiceId);
      setInvoice(foundInvoice || null);
    }
     if (!isLoading && businessProfiles.length > 0) {
      setBusinessProfile(businessProfiles[0]);
    }
  }, [invoiceId, invoices, businessProfiles, isLoading]);

  useEffect(() => {
    if (invoice && businessProfile && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        // Adding a small delay to ensure content is rendered before printing
        setTimeout(() => window.print(), 500);
    }
  }, [invoice, businessProfile, isLoading]);

  if (isLoading || !invoice || !businessProfile) {
    return (
        <PrintLayout>
            <div className='w-[58mm] mx-auto p-1 bg-white text-black text-xs'>
                <p>Loading receipt...</p>
            </div>
        </PrintLayout>
    );
  }

  return (
    <PrintLayout>
        <div className='w-[58mm] mx-auto p-1 bg-white text-black font-mono text-[10px] leading-tight'>
            <div className='text-center mb-2'>
                {businessProfile?.companyName && <h1 className="text-sm font-bold uppercase">{businessProfile.companyName}</h1>}
                {businessProfile?.address && <p>{businessProfile.address}</p>}
                {businessProfile?.contactNumber && <p>Ph: {businessProfile.contactNumber}</p>}
            </div>

            <Separator className='border-dashed border-black my-2' />

            <div className='mb-2'>
                <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> {invoice.issueDate}</p>
                <p><strong>Billed to:</strong> {invoice.customer.name}</p>
            </div>

            <Separator className='border-dashed border-black my-2' />

            <div>
                <div className="flex justify-between font-bold">
                    <p className='w-[60%]'>Item</p>
                    <p className='w-[15%] text-right'>Qty</p>
                    <p className='w-[25%] text-right'>Total</p>
                </div>
                 <Separator className='border-black my-1' />
                {invoice.items.map((item, index) => (
                    <div key={index} className='flex flex-col mb-1'>
                        <span>{item.productName}</span>
                         <div className='flex justify-between'>
                            <span className='w-[60%]'>{item.quantity} x ₹{item.sellingPrice.toFixed(2)}</span>
                            <span className='w-[40%] text-right'>₹{item.total.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>

            <Separator className='border-dashed border-black my-2' />

            <div className="space-y-1">
                <div className="flex justify-between">
                    <p>Subtotal:</p>
                    <p>₹{invoice.subtotal.toFixed(2)}</p>
                </div>
                 {invoice.gstAmount !== undefined && invoice.gstAmount > 0 && (
                    <div className="flex justify-between">
                        <p>GST ({invoice.gstPercentage || 0}%):</p>
                        <p>₹{invoice.gstAmount.toFixed(2)}</p>
                    </div>
                )}
                 {invoice.deliveryCharges !== undefined && invoice.deliveryCharges > 0 && (
                    <div className="flex justify-between">
                        <p>Delivery:</p>
                        <p>₹{invoice.deliveryCharges.toFixed(2)}</p>
                    </div>
                )}
                 {invoice.discount !== undefined && invoice.discount > 0 && (
                    <div className="flex justify-between">
                        <p>Discount:</p>
                        <p>- ₹{invoice.discount.toFixed(2)}</p>
                    </div>
                )}
                <Separator className='border-black my-1' />
                <div className="flex justify-between font-bold text-xs">
                    <p>Total:</p>
                    <p>₹{invoice.amount.toFixed(2)}</p>
                </div>
                <div className="flex justify-between">
                    <p>Paid:</p>
                    <p>₹{(invoice.paidAmount || 0).toFixed(2)}</p>
                </div>
                <div className="flex justify-between font-bold text-xs">
                    <p>Due:</p>
                    <p>₹{(invoice.dueAmount || 0).toFixed(2)}</p>
                </div>
            </div>

            <Separator className='border-dashed border-black my-2' />
            
             {invoice.orderNote && (
                <>
                    <p className='text-center text-[9px]'>{invoice.orderNote}</p>
                    <Separator className='border-dashed border-black my-2' />
                </>
             )}


            <p className='text-center text-[9px]'>Thank you for your business!</p>
        </div>
    </PrintLayout>
  );
}
