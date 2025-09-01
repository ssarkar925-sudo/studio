
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/auth-provider';

export default function LoginPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({
                title: 'Login Successful',
                description: "Welcome back! Redirecting you to the dashboard...",
            });
            router.push('/');
        } catch (error: any) {
            console.error("Login failed", error);
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: error.message || "Please check your credentials and try again.",
            });
        } finally {
            setIsLoggingIn(false);
        }
    }
    
    const handleGoogleLogin = async () => {
        setIsGoogleLoggingIn(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
             toast({
                title: 'Login Successful',
                description: "Welcome back!",
            });
            router.push('/');
        } catch (error: any) {
            console.error("Google login failed", error);
            toast({
                variant: 'destructive',
                title: 'Google Login Failed',
                description: error.message || "Could not log in with Google. Please try again.",
            });
        } finally {
            setIsGoogleLoggingIn(false);
        }
    }
    
    const handleForgotPassword = async () => {
        if (!email) {
            toast({
                variant: 'destructive',
                title: 'Email Required',
                description: 'Please enter your email address to reset your password.',
            });
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            toast({
                title: 'Password Reset Email Sent',
                description: 'Check your inbox for a link to reset your password.',
            });
        } catch (error: any) {
             console.error("Password reset failed", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not send password reset email.',
            });
        }
    }
    
    if (isLoading || user) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="relative grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-lg border shadow-lg md:grid-cols-2">
        <div className="relative hidden aspect-square items-center justify-center bg-primary p-10 text-primary-foreground md:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
          <div className="relative z-10 text-center">
            <h1 className="text-4xl font-bold">Welcome Back!</h1>
            <p className="mt-4 text-lg">
              Log in to manage your business with ease.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Button
                            variant="link"
                            type="button"
                            className="p-0 h-auto text-sm font-medium text-primary hover:underline"
                            onClick={handleForgotPassword}
                        >
                            Forgot password?
                        </Button>
                    </div>
                  <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2 pt-2">
                    <Button type="submit" className="w-full" disabled={isLoggingIn || isGoogleLoggingIn}>
                        {isLoggingIn && <Loader2 className="mr-2 animate-spin" />}
                        Login
                    </Button>
                    <Button variant="outline" className="w-full" type="button" onClick={handleGoogleLogin} disabled={isLoggingIn || isGoogleLoggingIn}>
                        {isGoogleLoggingIn && <Loader2 className="mr-2 animate-spin" />}
                        Login with Google
                    </Button>
                </div>
              </form>
               <div className="mt-4 text-center text-sm">
                    Don&apos;t have an account?{' '}
                    <Link 
                        href="/signup" 
                        className="font-medium text-primary hover:underline"
                    >
                        Sign up
                    </Link>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
