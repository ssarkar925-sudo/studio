
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { businessProfileDAO, userProfileDAO } from '@/lib/data';
import { useAuth } from '@/components/auth-provider';

export default function SignupPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, isLoading } = useAuth();
    
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    
    if (isLoading || user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast({
                variant: 'destructive',
                title: 'Password too short',
                description: 'Password should be at least 6 characters long.',
            });
            return;
        }
        setIsSigningUp(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            await updateProfile(firebaseUser, { displayName: name });
            
            // Create user profile in Firestore
            await setDoc(doc(db, "userProfile", firebaseUser.uid), {
                name: name,
                email: email,
            });

            // Create a business profile for the user
            await businessProfileDAO.add({
                userId: firebaseUser.uid,
                companyName: companyName,
            });

            toast({
                title: 'Account Created',
                description: "Welcome! Redirecting you to the dashboard...",
            });
            router.push('/');
        } catch (error: any) {
             console.error("Sign up failed", error);
            toast({
                variant: 'destructive',
                title: 'Sign Up Failed',
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsSigningUp(false);
        }
    }
    

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-lg border shadow-lg md:grid-cols-2">
        <div className="relative hidden aspect-square items-center justify-center bg-primary p-10 text-primary-foreground md:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
           <div className="relative z-10 text-center">
            <h1 className="text-4xl font-bold">Get Started!</h1>
            <p className="mt-4 text-lg">
              Create an account to start managing your business.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>
                Enter your details below to create your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" type="text" placeholder="John Doe" required value={name} onChange={e => setName(e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" type="text" placeholder="Acme Inc." required value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2 pt-2">
                    <Button type="submit" className="w-full" disabled={isSigningUp}>
                        {isSigningUp && <Loader2 className="mr-2 animate-spin" />}
                        Create Account
                    </Button>
                </div>
              </form>
               <div className="mt-4 text-center text-sm">
                    Already have an account?{' '}
                    <Link 
                        href="/login" 
                        className="font-medium text-primary hover:underline"
                    >
                        Login
                    </Link>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
