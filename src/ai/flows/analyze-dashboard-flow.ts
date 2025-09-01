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

const AnalyzeDashboardInputSchema = z.object({
  totalRevenue: z.number().describe('The total revenue in the selected period.'),
  outstandingAmount: z.number().describe('The total outstanding amount from pending invoices.'),
  overdueInvoices: z.number().describe('The number of overdue invoices.'),
  monthlyProfitData: z.array(MonthlyProfitSchema).describe('An array of profit data for recent months.'),
});
export type AnalyzeDashboardInput = z.infer<typeof AnalyzeDashboardInputSchema>;

const AnalyzeDashboardOutputSchema = z.object({
  summary: z.string().describe('A concise, one or two-sentence summary of the overall financial health.'),
  insights: z.array(z.string()).describe('A list of 2-3 key insights or trends discovered from the data.'),
  suggestions: z.array(z.string()).describe('A list of 2-3 actionable suggestions for the user.'),
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

Based on this data, provide:
1. A brief, encouraging summary of the business's current state.
2. 2-3 bullet-point insights that highlight important trends or numbers.
3. 2-3 actionable suggestions to help the user improve their business finances (e.g., follow up on overdue invoices, analyze top-selling products).`,
});

const analyzeDashboardFlow = ai.defineFlow(
  {
    name: 'analyzeDashboardFlow',
    inputSchema: AnalyzeDashboardInputSchema,
    outputSchema: AnalyzeDashboardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
