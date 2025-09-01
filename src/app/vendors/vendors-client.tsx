
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
import { vendorsDAO, Vendor } from '@/lib/data';
import { MoreHorizontal, PlusCircle, Trash2, Printer } from 'lucide-react';
import Link from 'next/link';
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


export function VendorsClient({ vendors: initialVendors }: { vendors: Vendor[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [vendors, setVendors] = useState(initialVendors);

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);
  
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
    const url = `/vendors/${vendorId}`;
    if (action === 'View') {
      router.push(url);
    } else if (action === 'Edit') {
        router.push(`${url}/edit`);
    } else if (action === 'Delete') {
        await vendorsDAO.remove(vendorId);
        toast({
          title: `Vendor Deleted`,
          description: `Vendor ${vendorName} has been deleted.`,
        });
    } else if (action === 'Print') {
        const printWindow = window.open(`${url}/print`, '_blank');
        printWindow?.focus();
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <Button asChild className="w-full sm:w-auto">
          <Link href="/vendors/new">
            <PlusCircle />
            New Vendor
          </Link>
        </Button>
      </div>
      
      <div className="hidden md:block">
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
                              <DropdownMenuItem onSelect={() => handleAction('Print', vendor.id, vendor.vendorName)}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
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
      </div>

       <div className="md:hidden mt-4 space-y-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardHeader>
               <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <Checkbox
                        className="mt-1"
                        checked={selectedVendors.includes(vendor.id)}
                        onCheckedChange={(checked) => handleSelectVendor(vendor.id, checked as boolean)}
                        aria-label="Select row"
                    />
                    <div>
                        <p className="font-medium">{vendor.vendorName}</p>
                        <p className="text-sm text-muted-foreground">{vendor.contactPerson}</p>
                    </div>
                </div>
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
                          <DropdownMenuItem onSelect={() => handleAction('Print', vendor.id, vendor.vendorName)}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
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
               </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="grid gap-1">
                    <p className="text-muted-foreground">Phone</p>
                    <p>{vendor.contactNumber || 'N/A'}</p>
                </div>
                 <div className="grid gap-1">
                    <p className="text-muted-foreground">Email</p>
                    <p className="truncate">{vendor.email || 'N/A'}</p>
                </div>
                 <div className="grid gap-1 col-span-2">
                    <p className="text-muted-foreground">GSTN</p>
                    <p>{vendor.gstn || 'N/A'}</p>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
