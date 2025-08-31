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
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Customer } from '@/lib/data';

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setCustomers(customersDAO.load());
  }, []);

  const handleAction = (action: string, customerName: string) => {
    toast({
      title: `${action} Customer`,
      description: `You have selected to ${action.toLowerCase()} ${customerName}. This feature is not yet implemented.`,
    });
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
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
                <TableRow key={customer.id}>
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
                        <DropdownMenuItem onSelect={() => handleAction('View', customer.name)}>View</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Edit', customer.name)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Delete', customer.name)}>Delete</DropdownMenuItem>
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
