
/**
 * @fileoverview Genkit API route.
 *
 * This file is responsible for exposing Genkit flows as API endpoints.
 * It is configured with a longer max-duration to accommodate
 * potentially long-running AI tasks.
 */
import { defaultFlow } from '@/ai/flows';
import { analyzeDashboardFlow } from '@/ai/flows/analyze-dashboard-flow';
import { extractPurchaseInfoFlow } from '@/ai/flows/extract-purchase-info-flow';
import { suggestInvoiceTemplatesFlow } from '@/ai/flows/suggest-invoice-templates';

export const maxDuration = 120; // 2 minutes

// NOTE: @genkit-ai/next is not used in this project due to dependency conflicts.
// The API routes are not active. This file remains for future reference.

export async function GET() {
  return new Response('Genkit server is running, but API endpoint is disabled.', { status: 200 });
}

export async function POST() {
    return new Response('Genkit API endpoint is disabled.', { status: 404 });
}
