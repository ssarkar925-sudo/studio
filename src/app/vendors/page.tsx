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
import { vendorsDAO } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Vendor } from '@/lib/data';
import { useRouter } from 'next/navigation';

export default function VendorsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    setVendors(vendorsDAO.load());
  }, []);

  const handleAction = (action: string, vendorId: string, vendorName: string) => {
    if (action === 'View') {
      router.push(`/vendors/${vendorId}`);
    } else {
      toast({
        title: `${action} Vendor`,
        description: `You have selected to ${action.toLowerCase()} ${vendorName}. This feature is not yet implemented.`,
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <Button asChild>
          <Link href="/vendors/new">
            <PlusCircle />
            New Vendor
          </Link>
        </Button>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
          <CardDescription>Manage your vendors.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>GSTN</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                  <TableCell>{vendor.contactPerson}</TableCell>
                  <TableCell>{vendor.contactNumber}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.gstn}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleAction('View', vendor.id, vendor.vendorName)}>View</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Edit', vendor.id, vendor.vendorName)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Delete', vendor.id, vendor.vendorName)}>Delete</DropdownMenuItem>
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
