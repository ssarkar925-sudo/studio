
'use server';
/**
 * @fileOverview A flow to extract purchase information from a bill image.
 *
 * - extractPurchaseInfoFromBill - A function that extracts structured data from a bill image.
 */

import {ai} from '@/ai/genkit';
import { ExtractPurchaseInfoInputSchema, ExtractedPurchaseInfoSchema, type ExtractPurchaseInfoInput, type ExtractPurchaseInfoOutput } from './schemas';


// This is the exported server action that the application will call.
export async function extractPurchaseInfoFromBill(
  input: ExtractPurchaseInfoInput
): Promise<ExtractPurchaseInfoOutput> {
   try {
      // It calls the internal Genkit flow and returns the result.
      return await extractPurchaseInfoFlow(input);
    } catch (e: any) {
      console.error("=============================================");
      console.error("[extractPurchaseInfoFromBill] Critical Error:", e);
      console.error("[extractPurchaseInfoFromBill] Error Message:", e.message);
      console.error("[extractPurchaseInfoFromBill] API Key available:", !!process.env.GEMINI_API_KEY);
      console.error("=============================================");
      // Re-throw the error to be caught by the calling function on the client-side.
      throw new Error('Extraction failed. Please check the server logs for more information.');
    }
}


// Internal prompt definition. Not exported.
const prompt = ai.definePrompt({
  name: 'extractPurchaseInfoPrompt',
  input: {schema: ExtractPurchaseInfoInputSchema},
  output: {schema: ExtractedPurchaseInfoSchema},
  prompt: `You are an expert at extracting structured information from images of invoices and bills. Analyze the provided image and extract the following details. If a value is not present or is illegible, omit the field. Do not fail if there are OCR errors; extract what you can.

- The vendor's name.
- The date of the order. Format it as dd/MM/yyyy (e.g., '02/07/2024').
- A list of all items, including their name, quantity, and unit price (purchasePrice). You must calculate the total for each item by multiplying the quantity and purchasePrice.
- The GST percentage, if mentioned.
- Any delivery or shipping charges.
- The grand total amount.
- The amount paid, if mentioned.

Photo: {{media url=photoDataUri}}`,
  config: {
    safetySettings: [
        {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
        }
    ]
  }
});


// Internal Genkit flow definition. Not exported.
const extractPurchaseInfoFlow = ai.defineFlow(
  {
    name: 'extractPurchaseInfoFlow',
    inputSchema: ExtractPurchaseInfoInputSchema,
    outputSchema: ExtractedPurchaseInfoSchema,
  },
  async (input) => {
    // Explicitly call the prompt with the flash model.
    const { output } = await prompt(input, { model: 'googleai/gemini-1.5-flash' });
    
    // Ensure output is not null or undefined before returning.
    if (!output) {
      throw new Error("The AI model returned no output.");
    }
    return output;
  }
);
