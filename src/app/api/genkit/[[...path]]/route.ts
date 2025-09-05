/**
 * @fileoverview Genkit API route.
 *
 * This file is responsible for exposing Genkit flows as API endpoints.
 * It is configured with a longer max-duration to accommodate
 * potentially long-running AI tasks.
 */
import { createNextJSHandler } from '@genkit-ai/next/app';
import { defaultFlow } from '@/ai/flows';
import { analyzeDashboard } from '@/ai/flows/analyze-dashboard-flow';
import { extractPurchaseInfoFromBill } from '@/ai/flows/extract-purchase-info-flow';
import { suggestInvoiceTemplates } from '@/ai/flows/suggest-invoice-templates';

export const maxDuration = 120; // 2 minutes

export const { GET, POST } = createNextJSHandler({
    flows: [defaultFlow, analyzeDashboard, extractPurchaseInfoFromBill, suggestInvoiceTemplates],
});
