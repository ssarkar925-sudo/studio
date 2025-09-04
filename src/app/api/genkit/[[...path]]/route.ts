
/**
 * @fileoverview Genkit API route.
 *
 * This file is responsible for exposing Genkit flows as API endpoints.
 * It is configured with a longer max-duration to accommodate
 * potentially long-running AI tasks.
 */
import { createNextJSHandler } from '@genkit-ai/next';
import {defineFlow} from 'genkit';

export const maxDuration = 120; // 2 minutes

const handler = createNextJSHandler({
    flows: [
        defineFlow(
            {
                name: 'default',
                inputSchema: undefined,
                outputSchema: undefined,
            },
            () => {
                // Default flow
            }
        ),
    ]
});


export const GET = handler;
export const POST = handler;


