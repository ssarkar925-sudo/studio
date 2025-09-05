
'use server';

import {ai} from '@/ai/genkit';

export const defaultFlow = ai.defineFlow(
    {
        name: 'default',
        inputSchema: undefined,
        outputSchema: undefined,
    },
    async () => {
        // Default flow
    }
);
