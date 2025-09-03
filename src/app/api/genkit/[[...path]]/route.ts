
/**
 * @fileoverview Genkit API route.
 *
 * This file is responsible for exposing Genkit flows as API endpoints.
 * It is configured with a longer max-duration to accommodate
 * potentially long-running AI tasks.
 */
import {nextJSHandler} from '@genkit-ai/next';

export const maxDuration = 120; // 2 minutes

export const GET = nextJSHandler;
export const POST = nextJSHandler;
