
'use server';
/**
 * @fileOverview A flow to extract purchase information from a bill image.
 *
 * - extractPurchaseInfoFromBill - A function that extracts structured data from a bill image.
 * - ExtractPurchaseInfoInput - The input type for the function.
 * - ExtractPurchaseInfoOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractPurchaseInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a bill or invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractPurchaseInfoInput = z.infer<typeof ExtractPurchaseInfoInputSchema>;

const ExtractedPurchaseInfoSchema = z.object({
  vendorName: z.string().optional().describe('The name of the vendor or seller.'),
  orderDate: z.string().optional().describe("The date of the order in 'dd/MM/yyyy' format (e.g., '02/07/2024')."),
  items: z.array(z.object({
    productName: z.string().describe('The name of the item.'),
    quantity: z.number().describe('The quantity of the item.'),
    purchasePrice: z.number().describe('The price per unit of the item.'),
    total: z.number().describe('The total price for this line item (quantity * purchasePrice).')
  })).describe('An array of items from the bill.'),
  gst: z.number().optional().describe('The GST percentage if available.'),
  deliveryCharges: z.number().optional().describe('The delivery charges if available.'),
  totalAmount: z.number().optional().describe('The grand total amount of the bill.'),
  paymentDone: z.number().optional().describe('The amount paid if mentioned.'),
});
export type ExtractPurchaseInfoOutput = z.infer<typeof ExtractedPurchaseInfoSchema>;

export async function extractPurchaseInfoFromBill(
  input: ExtractPurchaseInfoInput
): Promise<ExtractPurchaseInfoOutput> {
  return extractPurchaseInfoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPurchaseInfoPrompt',
  input: {schema: ExtractPurchaseInfoInputSchema},
  output: {schema: ExtractedPurchaseInfoSchema},
  prompt: `You are an expert at extracting structured information from images of invoices and bills. Analyze the provided image and extract the following details. If a value is not present, omit the field.

- The vendor's name.
- The date of the order. Format it as dd/MM/yyyy (e.g., '02/07/2024').
- A list of all items, including their name, quantity, and unit price (purchasePrice). You must calculate the total for each item by multiplying the quantity and purchasePrice.
- The GST percentage, if mentioned.
- Any delivery or shipping charges.
- The grand total amount.
- The amount paid, if mentioned.

Photo: {{media url=photoDataUri}}`,
});

const extractPurchaseInfoFlow = ai.defineFlow(
  {
    name: 'extractPurchaseInfoFlow',
    inputSchema: ExtractPurchaseInfoInputSchema,
    outputSchema: ExtractedPurchaseInfoSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
