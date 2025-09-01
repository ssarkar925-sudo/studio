
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { customersDAO } from '@/lib/data';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function getCustomer(id: string) {
    // We will add a `get` method to the DAO for fetching a single document
    if (customersDAO.get) {
        return await customersDAO.get(id);
    }
    // Fallback for safety
    const customers = await customersDAO.load();
    const customer = customers.find(c => c.id === id);
    if (!customer) {
        throw new Error("Customer not found");
    }
    return customer;
}

export default async function CustomerDetailsPage({ params }: { params: { id: string }}) {
  const customer = await getCustomer(params.id);

  if (!customer) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-2xl gap-2">
                <h1 className="text-2xl font-semibold">Customer not found</h1>
                 <Button variant="outline" asChild>
                    <Link href="/contacts?tab=customers">Back to Customers</Link>
                </Button>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" asChild>
                <Link href="/contacts?tab=customers">
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold">Customer Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{customer.name}</CardTitle>
            <CardDescription>
              {customer.email || 'No email provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p>{customer.phone || 'N/A'}</p>
                </div>
                 <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Address</p>
                    <p>{customer.address || 'N/A'}</p>
                </div>
              </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Invoiced</p>
                    <p>₹{customer.totalInvoiced.toFixed(2)}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                    <p>₹{customer.totalPaid.toFixed(2)}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Invoices</p>
                    <p>{customer.invoices}</p>
                </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
