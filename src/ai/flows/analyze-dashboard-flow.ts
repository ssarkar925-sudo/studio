'use server';
/**
 * @fileOverview A flow to analyze dashboard data and provide insights.
 *
 * - analyzeDashboard - A function that provides an analysis of financial data.
 * - AnalyzeDashboardInput - The input type for the function.
 * - AnalyzeDashboardOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MonthlyProfitSchema = z.object({
  name: z.string().describe('The month name (e.g., "Jan 24").'),
  profit: z.number().describe('The total profit for that month.'),
});

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

const AnalyzeDashboardInputSchema = z.object({
  totalRevenue: z.number().describe('The total revenue in the selected period.'),
  outstandingAmount: z.number().describe('The total outstanding amount from pending invoices.'),
  overdueInvoices: z.number().describe('The number of overdue invoices.'),
  monthlyProfitData: z.array(MonthlyProfitSchema).describe('An array of profit data for recent months.'),
  query: z.string().optional().describe('The user\'s follow-up question.'),
  history: z.array(ChatMessageSchema).optional().describe('The previous conversation history.'),
});
export type AnalyzeDashboardInput = z.infer<typeof AnalyzeDashboardInputSchema>;

const AnalyzeDashboardOutputSchema = z.object({
  response: z.string().describe('A concise, one or two-sentence summary of the overall financial health.'),
});
export type AnalyzeDashboardOutput = z.infer<typeof AnalyzeDashboardOutputSchema>;


export async function analyzeDashboard(
  input: AnalyzeDashboardInput
): Promise<AnalyzeDashboardOutput> {
  return analyzeDashboardFlow(input);
}


const prompt = ai.definePrompt({
  name: 'analyzeDashboardPrompt',
  input: { schema: AnalyzeDashboardInputSchema },
  output: { schema: AnalyzeDashboardOutputSchema },
  prompt: `You are a helpful business analyst AI. Your goal is to provide a clear and concise analysis of the user's dashboard data.

Analyze the following financial data:
- Total Revenue: {{totalRevenue}}
- Outstanding Amount: {{outstandingAmount}}
- Overdue Invoices: {{overdueInvoices}}
- Monthly Profit Trend:
{{#each monthlyProfitData}}
  - {{name}}: {{profit}}
{{/each}}

{{#if query}}
Based on this data and the conversation history, answer the user's question.
{{else}}
Based on this data, provide:
1. A brief, encouraging summary of the business's current state.
2. 2-3 bullet-point insights that highlight important trends or numbers.
3. 2-3 actionable suggestions to help the user improve their business finances (e.g., follow up on overdue invoices, analyze top-selling products).
Your response should be formatted as markdown.
{{/if}}

{{#if history}}
Conversation History:
{{#each history}}
  - {{role}}: {{content}}
{{/each}}
{{/if}}

{{#if query}}
User Question: {{{query}}}
{{/if}}

Your response:
`,
});

const analyzeDashboardFlow = ai.defineFlow(
  {
    name: 'analyzeDashboardFlow',
    inputSchema: AnalyzeDashboardInputSchema,
    outputSchema: AnalyzeDashboardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return { response: output!.response };
  }
);
