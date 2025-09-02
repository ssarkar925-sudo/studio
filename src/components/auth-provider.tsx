
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { userProfileDAO, UserProfile } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, userProfile: null, isLoading: true });

const PROTECTED_ROUTES = ['/', '/invoices', '/contacts', '/inventory', '/reports', '/profile', '/customers', '/vendors', '/products', '/settings'];
const PUBLIC_ROUTES = ['/login', '/signup'];
const ADMIN_ROUTES = ['/admin'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
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

    const isProtectedRoute = PROTECTED_ROUTES.some(route => {
        if (route === '/') return pathname === '/';
        return pathname.startsWith(route);
    });

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

    if (!user && (isProtectedRoute || isAdminRoute)) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/');
    } else if (user && isAdminRoute && !userProfile?.isAdmin) {
      toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.'
      });
      router.push('/');
    }

  }, [user, userProfile, isLoading, pathname, router, toast]);

  const isAuthCheckComplete = !isLoading;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // While auth is resolving, show a loader.
  // Or if we're on a protected route without a user, show a loader while we redirect.
  if (isLoading || (!user && !isPublicRoute)) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (user && isPublicRoute) {
      // While redirecting a logged-in user from a public page, show loader.
      return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading }}>
      {isAuthCheckComplete ? children : <div className="flex h-screen items-center justify-center">Loading...</div>}
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
