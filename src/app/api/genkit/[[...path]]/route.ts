
/**
 * @fileoverview Genkit API route.
 *
 * This file is responsible for exposing Genkit flows as API endpoints.
 * It is configured with a longer max-duration to accommodate
 * potentially long-running AI tasks.
 */
import { createNextJSHandler } from '@genkit-ai/next';
import { defaultFlow } from '@/ai/flows';

export const maxDuration = 120; // 2 minutes

export const GET = createNextJSHandler({
    flows: [defaultFlow],
});
export const POST = createNextJSHandler({
    flows: [defaultFlow],
});
