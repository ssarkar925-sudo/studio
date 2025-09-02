
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Package,
  Settings,
  UserCircle,
  Menu,
  Building,
  Contact,
  BarChart,
  LogOut,
  Shield,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { businessProfileDAO, featureFlagsDAO, type FeatureFlag } from '@/lib/data';
import { useAuth } from './auth-provider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';

const allMenuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, admin: false, flagId: null },
  { href: '/invoices', label: 'Invoices', icon: FileText, admin: false, flagId: null },
  { href: '/contacts', label: 'Contacts', icon: Contact, admin: false, flagId: null },
  { href: '/inventory', label: 'Inventory', icon: Package, admin: false, flagId: null },
  { href: '/reports', label: 'Reports', icon: BarChart, admin: false, flagId: 'reportsPage' },
  { href: '/admin', label: 'Admin', icon: Shield, admin: true, flagId: null },
];

function useFeatureFlags() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    useEffect(() => {
        const unsubscribe = featureFlagsDAO.subscribe(setFlags);
        return () => unsubscribe();
    }, []);
    return flags;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profiles } = useFirestoreData(businessProfileDAO);
  const { user, userProfile } = useAuth();
  const featureFlags = useFeatureFlags();

  const companyName = profiles[0]?.companyName || 'SC Billing';
  const logoUrl = profiles[0]?.logoUrl;
  
  const featureFlagsMap = new Map(featureFlags.map(f => [f.id, f.enabled]));

  const availableMenuItems = allMenuItems.filter(item => {
    if (item.admin && !userProfile?.isAdmin) return false;
    if (item.flagId && !featureFlagsMap.get(item.flagId)) return false;
    return true;
  });
  
  if (!user) {
    return null; // Or a loading spinner, this is handled by AuthProvider
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
        <div className="flex items-center md:flex-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <SheetHeader>
                    <SheetTitle asChild>
                        <Link
                        href="/"
                        className="flex items-center gap-2 text-lg font-semibold"
                        >
                          <div className="h-6 w-6">
                            {logoUrl ? <img src={logoUrl} alt={companyName} className="h-full w-full object-contain" /> : <Icons.logo className="h-6 w-6 text-primary" />}
                          </div>
                          <span >{companyName}</span>
                        </Link>
                    </SheetTitle>
                </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium mt-6">
                {availableMenuItems.map((item) => (
                   <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center gap-4 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                        pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)
                          ? 'bg-muted text-primary'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
           <nav className="hidden flex-1 justify-center flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            {availableMenuItems.map((item) => (
                <Link
                key={item.label}
                href={item.href}
                className={`relative px-2 py-1 transition-colors hover:text-primary ${
                    pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
                >
                {item.label}
                 {pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true) && (
                    <span className="absolute bottom-[-2px] left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
            ))}
            </nav>
        </div>

        <div className="flex items-center justify-end gap-4 md:flex-1 md:gap-2 lg:gap-4">
             <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <div className="h-6 w-6">
                {logoUrl ? <img src={logoUrl} alt={companyName} className="h-full w-full object-contain" /> : <Icons.logo className="h-6 w-6 text-primary" />}
              </div>
              <span className="">{companyName}</span>
            </Link>
           <UserMenu />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}

function UserMenu() {
    const router = useRouter();
    const { toast } = useToast();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            toast({
                title: 'Signed Out',
                description: 'You have been successfully signed out.',
            });
            router.push('/login');
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Sign Out Failed',
                description: 'An error occurred while signing out.',
            });
        }
    };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <UserCircle />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
           <Link href="/profile">
            <UserCircle />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
