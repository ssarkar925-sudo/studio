
'use server';
/**
 * @fileOverview A flow to suggest invoice templates based on business type.
 *
 * - suggestInvoiceTemplates - A function that suggests templates.
 */

import {ai} from '@/ai/genkit';
import { SuggestInvoiceTemplatesInputSchema, SuggestInvoiceTemplatesOutputSchema, type SuggestInvoiceTemplatesInput, type SuggestInvoiceTemplatesOutput } from './schemas';


export const suggestInvoiceTemplatesFlow = ai.defineFlow(
  {
    name: 'suggestInvoiceTemplatesFlow',
    inputSchema: SuggestInvoiceTemplatesInputSchema,
    outputSchema: SuggestInvoiceTemplatesOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert business consultant. Based on the following business type, suggest 3-5 types of invoice templates that would be suitable.

Business Type: ${input.businessType}

Suggestions:`;

    const llmResponse = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-pro',
      output: {
        schema: SuggestInvoiceTemplatesOutputSchema,
      }
    });

    return llmResponse.output!;
  }
);


export async function suggestInvoiceTemplates(
  input: SuggestInvoiceTemplatesInput
): Promise<SuggestInvoiceTemplatesOutput> {
  return suggestInvoiceTemplatesFlow(input);
}
