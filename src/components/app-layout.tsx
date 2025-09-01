
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { businessProfileDAO } from '@/lib/data';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/contacts', label: 'Contacts', icon: Contact },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/reports', label: 'Reports', icon: BarChart },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: profiles } = useFirestoreData(businessProfileDAO);
  const companyName = profiles[0]?.companyName || 'SC Billing';
  const logoUrl = profiles[0]?.logoUrl;

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
                {menuItems.map((item) => (
                   <Link
                      key={item.label}
                      href={item.href}
                      className={`transition-colors hover:text-foreground ${
                        pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
           <nav className="hidden flex-1 justify-center flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            {menuItems.map((item) => (
                <Link
                key={item.label}
                href={item.href}
                className={`transition-colors hover:text-foreground ${
                    pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground'
                }`}
                >
                {item.label}
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
        <DropdownMenuItem>
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
