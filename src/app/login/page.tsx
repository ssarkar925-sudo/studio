
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
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
          <Card className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-1000">
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  <LogIn className="mr-2" /> Login
                </Button>
                 <Button variant="outline" className="w-full">
                  Login with Google
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
