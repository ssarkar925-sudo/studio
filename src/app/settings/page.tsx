
'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { suggestInvoiceTemplates } from '@/ai/flows/suggest-invoice-templates';
import { Wand2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [businessType, setBusinessType] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please describe your business type.',
      });
      return;
    }
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await suggestInvoiceTemplates({ businessType });
      setSuggestions(result.templateSuggestions);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get suggestions. Please try again.',
      });
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>AI Template Suggestions</CardTitle>
              <CardDescription>
                Describe your business, and our AI will suggest invoice
                templates tailored for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="businessType">Business Type</Label>
                <Textarea
                  id="businessType"
                  placeholder="e.g., freelance photographer, small construction company, digital marketing agency"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Get Suggestions
              </Button>
            </CardFooter>
          </form>
        </Card>

        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Suggested Templates</CardTitle>
              <CardDescription>Here are some templates that might work for your business.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc list-inside text-sm">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
