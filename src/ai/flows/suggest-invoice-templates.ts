
'use server';
/**
 * @fileOverview A flow to suggest invoice templates based on business type.
 *
 * - suggestInvoiceTemplates - A function that suggests templates.
 */

import { ai } from '@/ai/genkit';
import { SuggestInvoiceTemplatesInputSchema, SuggestInvoiceTemplatesOutputSchema, type SuggestInvoiceTemplatesInput, type SuggestInvoiceTemplatesOutput } from './schemas';

const prompt = ai.definePrompt({
  name: 'suggestInvoiceTemplatesPrompt',
  input: { schema: SuggestInvoiceTemplatesInputSchema },
  output: { schema: SuggestInvoiceTemplatesOutputSchema },
  prompt: `You are an expert business consultant. Based on the following business type, suggest 3-5 types of invoice templates that would be suitable.

Business Type: {{{businessType}}}

Suggestions:`,
});

const suggestInvoiceTemplatesFlow = ai.defineFlow(
  {
    name: 'suggestInvoiceTemplatesFlow',
    inputSchema: SuggestInvoiceTemplatesInputSchema,
    outputSchema: SuggestInvoiceTemplatesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);


export async function suggestInvoiceTemplates(
  input: SuggestInvoiceTemplatesInput
): Promise<SuggestInvoiceTemplatesOutput> {
  return suggestInvoiceTemplatesFlow(input);
}
