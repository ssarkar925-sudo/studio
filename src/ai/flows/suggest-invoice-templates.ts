'use server';

/**
 * @fileOverview A flow to suggest invoice templates based on the business type.
 *
 * - suggestInvoiceTemplates - A function that suggests invoice templates.
 * - SuggestInvoiceTemplatesInput - The input type for the suggestInvoiceTemplates function.
 * - SuggestInvoiceTemplatesOutput - The return type for the suggestInvoiceTemplates function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestInvoiceTemplatesInputSchema = z.object({
  businessType: z.string().describe('The type of business the invoice is for.'),
});
export type SuggestInvoiceTemplatesInput = z.infer<typeof SuggestInvoiceTemplatesInputSchema>;

const SuggestInvoiceTemplatesOutputSchema = z.object({
  templateSuggestions: z
    .array(z.string())
    .describe('An array of suggested invoice templates.'),
});
export type SuggestInvoiceTemplatesOutput = z.infer<typeof SuggestInvoiceTemplatesOutputSchema>;

export async function suggestInvoiceTemplates(
  input: SuggestInvoiceTemplatesInput
): Promise<SuggestInvoiceTemplatesOutput> {
  return suggestInvoiceTemplatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInvoiceTemplatesPrompt',
  input: {schema: SuggestInvoiceTemplatesInputSchema},
  output: {schema: SuggestInvoiceTemplatesOutputSchema},
  prompt: `You are an expert in invoice templates. Given the business type, suggest a list of suitable invoice templates.

Business Type: {{{businessType}}}

Suggest invoice templates:`,
});

const suggestInvoiceTemplatesFlow = ai.defineFlow(
  {
    name: 'suggestInvoiceTemplatesFlow',
    inputSchema: SuggestInvoiceTemplatesInputSchema,
    outputSchema: SuggestInvoiceTemplatesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
