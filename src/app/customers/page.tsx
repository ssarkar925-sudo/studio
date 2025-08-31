'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { customersDAO } from '@/lib/data';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState, useMemo } from 'react';
import type { Customer } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export default function CustomersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  useEffect(() => {
    setCustomers(customersDAO.load());
  }, []);
  
  const allCustomersSelected = useMemo(() => selectedCustomers.length > 0 && selectedCustomers.length === customers.length, [selectedCustomers, customers]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers(prev => [...prev, customerId]);
    } else {
      setSelectedCustomers(prev => prev.filter(id => id !== customerId));
    }
  };

  const handleDeleteSelected = () => {
    selectedCustomers.forEach(id => customersDAO.remove(id));
    const remainingCustomers = customersDAO.load();
    setCustomers(remainingCustomers);
    toast({
        title: 'Customers Deleted',
        description: `${selectedCustomers.length} customer(s) have been deleted.`,
    });
    setSelectedCustomers([]);
  };


  const handleAction = (action: string, customerId: string, customerName: string) => {
    if (action === 'View') {
      router.push(`/customers/${customerId}`);
    } else {
      toast({
        title: `${action} Customer`,
        description: `You have selected to ${action.toLowerCase()} ${customerName}. This feature is not yet implemented.`,
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Customers</h1>
           {selectedCustomers.length > 0 && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 /> Delete ({selectedCustomers.length})</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete {selectedCustomers.length} customer(s).
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <PlusCircle />
            New Customer
          </Link>
        </Button>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Manage your customers and view their sales history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-12">
                   <Checkbox
                    checked={allCustomersSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all"
                  />
                 </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className='text-right'>Total Invoiced</TableHead>
                <TableHead className='text-right'>Total Paid</TableHead>
                <TableHead className='text-right'>Invoices</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} data-state={selectedCustomers.includes(customer.id) && "selected"}>
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className='h-9 w-9'>
                        <AvatarImage
                          src={`https://picsum.photos/40/40?random=${customer.id}`}
                          data-ai-hint="profile picture"
                        />
                        <AvatarFallback>
                          {customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>₹{customer.totalInvoiced.toFixed(2)}</TableCell>
                  <TableCell className='text-right'>₹{customer.totalPaid.toFixed(2)}</TableCell>
                  <TableCell className='text-right'>{customer.invoices}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleAction('View', customer.id, customer.name)}>View</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Edit', customer.id, customer.name)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Delete', customer.id, customer.name)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
