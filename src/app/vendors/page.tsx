
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
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
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
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function VendorsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: vendors } = useFirestoreData(vendorsDAO);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  
  const allVendorsSelected = useMemo(() => selectedVendors.length > 0 && selectedVendors.length === vendors.length, [selectedVendors, vendors]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVendors(vendors.map(v => v.id));
    } else {
      setSelectedVendors([]);
    }
  };

  const handleSelectVendor = (vendorId: string, checked: boolean) => {
    if (checked) {
      setSelectedVendors(prev => [...prev, vendorId]);
    } else {
      setSelectedVendors(prev => prev.filter(id => id !== vendorId));
    }
  };

  const handleDeleteSelected = async () => {
    const promises = selectedVendors.map(id => vendorsDAO.remove(id));
    await Promise.all(promises);
    toast({
        title: 'Vendors Deleted',
        description: `${selectedVendors.length} vendor(s) have been deleted.`,
    });
    setSelectedVendors([]);
  };


  const handleAction = async (action: string, vendorId: string, vendorName: string) => {
    if (action === 'View') {
      router.push(`/vendors/${vendorId}`);
    } else if (action === 'Delete') {
        await vendorsDAO.remove(vendorId);
        toast({
          title: `Vendor Deleted`,
          description: `Vendor ${vendorName} has been deleted.`,
        });
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
        <div className='flex items-center gap-4'>
            <h1 className="text-2xl font-semibold">Vendors</h1>
            {selectedVendors.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 /> Delete ({selectedVendors.length})</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedVendors.length} vendor(s).
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
                <TableHead className="w-12">
                   <Checkbox
                    checked={allVendorsSelected}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                    aria-label="Select all"
                  />
                </TableHead>
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
                <TableRow key={vendor.id} data-state={selectedVendors.includes(vendor.id) && "selected"}>
                   <TableCell>
                    <Checkbox
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={(checked) => handleSelectVendor(vendor.id, checked as boolean)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                  <TableCell>{vendor.contactPerson}</TableCell>
                  <TableCell>{vendor.contactNumber}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.gstn}</TableCell>
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
                            <DropdownMenuItem onSelect={() => handleAction('View', vendor.id, vendor.vendorName)}>View</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleAction('Edit', vendor.id, vendor.vendorName)}>Edit</DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete vendor &quot;{vendor.vendorName}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAction('Delete', vendor.id, vendor.vendorName)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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
    </AppLayout>
  );
}
