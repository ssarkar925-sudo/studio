'use server';
/**
 * @fileOverview A flow to suggest invoice templates based on business type.
 *
 * - suggestInvoiceTemplates - A function that suggests templates.
 * - SuggestInvoiceTemplatesInput - The input type for the function.
 * - SuggestInvoiceTemplatesOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const SuggestInvoiceTemplatesInputSchema = z.object({
  businessType: z.string().describe('A description of the user\'s business (e.g., "freelance photographer").'),
});
export type SuggestInvoiceTemplatesInput = z.infer<
  typeof SuggestInvoiceTemplatesInputSchema
>;

export const SuggestInvoiceTemplatesOutputSchema = z.object({
  templateSuggestions: z
    .array(z.string())
    .describe('A list of 3-5 suggested invoice template types.'),
});
export type SuggestInvoiceTemplatesOutput = z.infer<
  typeof SuggestInvoiceTemplatesOutputSchema
>;

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
