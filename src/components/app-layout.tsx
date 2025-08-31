'use client';

import * as React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Settings,
  UserCircle,
} from 'lucide-react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/products', label: 'Products', icon: Package },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.startsWith('/invoices/new')) return 'New Invoice';
    if (pathname.match(/\/invoices\/.+/)) return 'Invoice Details';
    
    const allItems = [...menuItems, { href: '/settings', label: 'Settings' }];
    const item = allItems.find((item) =>
      pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true)
    );
    return item?.label || 'Dashboard';
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="size-7 text-primary" />
            <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
              Sarkar Co
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={
                      pathname.startsWith(item.href) &&
                      (item.href === '/' ? pathname === '/' : true)
                    }
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarContent className="!flex-1 justify-end">
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings" legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith('/settings')}
                  tooltip={'Settings'}
                >
                  <Settings />
                  <span className="group-data-[collapsible=icon]:hidden">
                    Settings
                  </span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <div className="flex-1">
            <SidebarTrigger className="-ml-2 md:hidden" />
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://picsum.photos/40/40" data-ai-hint="profile picture" alt="@user" />
            <AvatarFallback>SC</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserCircle className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
            <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
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
