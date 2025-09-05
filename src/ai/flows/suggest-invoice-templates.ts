
'use server';
/**
 * @fileOverview A flow to suggest invoice templates based on business type.
 *
 * - suggestInvoiceTemplates - A function that suggests templates.
 */

import {ai} from '@/ai/genkit';
import { SuggestInvoiceTemplatesInputSchema, SuggestInvoiceTemplatesOutputSchema, type SuggestInvoiceTemplatesInput, type SuggestInvoiceTemplatesOutput } from './schemas';
import { defineFlow } from 'genkit/flow';
import { generate } from 'genkit/ai';
import { geminiPro } from '@genkit-ai/googleai';


export const suggestInvoiceTemplatesFlow = defineFlow(
  {
    name: 'suggestInvoiceTemplatesFlow',
    inputSchema: SuggestInvoiceTemplatesInputSchema,
    outputSchema: SuggestInvoiceTemplatesOutputSchema,
  },
  async (input) => {
    const prompt = `You are an expert business consultant. Based on the following business type, suggest 3-5 types of invoice templates that would be suitable.

Business Type: ${input.businessType}

Suggestions:`;

    const llmResponse = await generate({
      prompt: prompt,
      model: geminiPro,
      output: {
        schema: SuggestInvoiceTemplatesOutputSchema,
      }
    });

    return llmResponse.output()!;
  }
);


export async function suggestInvoiceTemplates(
  input: SuggestInvoiceTemplatesInput
): Promise<SuggestInvoiceTemplatesOutput> {
  return suggestInvoiceTemplatesFlow(input);
}
