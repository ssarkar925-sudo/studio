
'use client';

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
import { customersDAO, type Customer } from '@/lib/data';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo, useEffect } from 'react';
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


export function CustomersClient({ customers: initialCustomers }: { customers: Customer[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customers, setCustomers] = useState(initialCustomers);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);
  
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

  const handleDeleteSelected = async () => {
    const promises = selectedCustomers.map(id => customersDAO.remove(id));
    await Promise.all(promises);
    toast({
        title: 'Customers Deleted',
        description: `${selectedCustomers.length} customer(s) have been deleted.`,
    });
    setSelectedCustomers([]);
    // No need for router.refresh(), live updates will handle it
  };

  const handleDelete = async (customerId: string, customerName: string) => {
    await customersDAO.remove(customerId);
    toast({
        title: 'Customer Deleted',
        description: `Successfully deleted customer: ${customerName}.`,
    });
    // No need for router.refresh()
  };


  const handleAction = (action: string, customerId: string) => {
    if (action === 'View') {
      router.push(`/customers/${customerId}`);
    } else if (action === 'Edit') {
        router.push(`/customers/${customerId}/edit`);
    }
  };

  return (
    <>
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
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => handleAction('View', customer.id)}>View</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleAction('Edit', customer.id)}>Edit</DropdownMenuItem>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete customer "{customer.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(customer.id, customer.name)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
