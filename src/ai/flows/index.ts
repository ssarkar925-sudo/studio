
'use server';

import { defineFlow } from 'genkit/flow';

export const defaultFlow = defineFlow(
    {
        name: 'default',
        inputSchema: undefined,
        outputSchema: undefined,
    },
    async () => {
        // Default flow
    }
);
