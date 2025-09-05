
/**
 * @fileoverview Genkit API route.
 *
 * This file is responsible for exposing Genkit flows as API endpoints.
 * It is configured with a longer max-duration to accommodate
 * potentially long-running AI tasks.
 */

// NOTE: This file is not used when using the Next.js Genkit plugin.
// It is here for reference if you were to deploy Genkit separately.
export async function GET() {
  return new Response('Genkit server is running', { status: 200 });
}
