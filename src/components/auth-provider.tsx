
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { userProfileDAO, UserProfile } from '@/lib/data';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, isLoading: true });

const PROTECTED_ROUTES = ['/', '/invoices', '/contacts', '/inventory', '/reports', '/profile'];
const PUBLIC_ROUTES = ['/login', '/signup'];
const ADMIN_ROUTES = ['/admin'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
          const profile = await userProfileDAO.get(user.uid);
          setUserProfile(profile);
      } else {
          setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route) && (route !== '/' || pathname === '/'));
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    if (!user && (isProtectedRoute || isAdminRoute)) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    } else if (user && isAdminRoute && !userProfile?.isAdmin) {
      // If a non-admin tries to access an admin route, redirect them
      toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.'
      });
      router.push('/');
    }

  }, [user, userProfile, isLoading, pathname, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route) && (route !== '/' || pathname === '/'));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  if ((!user && isProtectedRoute) || (!user && isAdminRoute)) {
     return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }


  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// A helper toast function that can be used outside of components
import { toast } from '@/hooks/use-toast';
