
/**
 * @fileoverview This file contains all the Zod schemas and TypeScript types
 * for the Genkit flows. Separating them from the flow definitions prevents
 * Next.js build errors related to exporting non-async functions from
 * 'use server' files.
 */
import { z } from 'zod';

// Schemas for: analyze-dashboard-flow.ts
const MonthlyProfitSchema = z.object({
  name: z.string().describe('The month name (e.g., "Jan 24").'),
  profit: z.number().describe('The total profit for that month.'),
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const AnalyzeDashboardInputSchema = z.object({
  totalRevenue: z.number().describe('The total revenue in the selected period.'),
  outstandingAmount: z.number().describe('The total outstanding amount from pending invoices.'),
  overdueInvoices: z.number().describe('The number of overdue invoices.'),
  monthlyProfitData: z.array(MonthlyProfitSchema).describe('An array of profit data for recent months.'),
  query: z.string().optional().describe('The user\'s follow-up question.'),
  history: z.array(ChatMessageSchema).optional().describe('The previous conversation history.'),
});
export type AnalyzeDashboardInput = z.infer<typeof AnalyzeDashboardInputSchema>;

export const AnalyzeDashboardOutputSchema = z.object({
  response: z.string().describe('A concise, one or two-sentence summary of the overall financial health.'),
});
export type AnalyzeDashboardOutput = z.infer<typeof AnalyzeDashboardOutputSchema>;


// Schemas for: extract-purchase-info-flow.ts
export const ExtractPurchaseInfoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a bill or invoice, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
    ),
});
export type ExtractPurchaseInfoInput = z.infer<typeof ExtractPurchaseInfoInputSchema>;

export const ExtractedPurchaseInfoSchema = z.object({
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


// Schemas for: suggest-invoice-templates.ts
export const SuggestInvoiceTemplatesInputSchema = z.object({
  businessType: z.string().describe('A description of the user\'s business (e.g., "freelance photographer").'),
});
export type SuggestInvoiceTemplatesInput = z.infer<typeof SuggestInvoiceTemplatesInputSchema>;

export const SuggestInvoiceTemplatesOutputSchema = z.object({
  templateSuggestions: z
    .array(z.string())
    .describe('A list of 3-5 suggested invoice template types.'),
});
export type SuggestInvoiceTemplatesOutput = z.infer<typeof SuggestInvoiceTemplatesOutputSchema>;
