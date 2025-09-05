
'use server';
/**
 * @fileOverview A flow to analyze dashboard data and provide insights.
 *
 * - analyzeDashboard - A function that provides an analysis of financial data.
 */
import {ai} from '@/ai/genkit';
import { AnalyzeDashboardInputSchema, AnalyzeDashboardOutputSchema, type AnalyzeDashboardInput, type AnalyzeDashboardOutput } from './schemas';
import { defineFlow } from 'genkit/flow';
import { generate } from 'genkit/ai';
import { geminiPro } from '@genkit-ai/googleai';


export async function analyzeDashboard(
  input: AnalyzeDashboardInput
): Promise<AnalyzeDashboardOutput> {
    return analyzeDashboardFlow(input);
}

export const analyzeDashboardFlow = defineFlow(
  {
    name: 'analyzeDashboardFlow',
    inputSchema: AnalyzeDashboardInputSchema,
    outputSchema: AnalyzeDashboardOutputSchema,
  },
  async (input) => {
    const prompt = `You are a helpful business analyst AI. Your goal is to provide a clear and concise analysis of the user's dashboard data.

Analyze the following financial data:
- Total Revenue: ${input.totalRevenue}
- Outstanding Amount: ${input.outstandingAmount}
- Overdue Invoices: ${input.overdueInvoices}
- Monthly Profit Trend:
${input.monthlyProfitData.map(d => `  - ${d.name}: ${d.profit}`).join('\n')}

${input.query ? "Based on this data and the conversation history, answer the user's question." : `Based on this data, provide:
1. A brief, encouraging summary of the business's current state.
2. 2-3 bullet-point insights that highlight important trends or numbers.
3. 2-3 actionable suggestions to help the user improve their business finances (e.g., follow up on overdue invoices, analyze top-selling products).
Your response should be formatted as markdown.`}

${input.history ? `Conversation History:
${input.history.map(m => `  - ${m.role}: ${m.content}`).join('\n')}` : ''}

${input.query ? `User Question: ${input.query}` : ''}

Your response:
`;

    const llmResponse = await generate({
      prompt: prompt,
      model: geminiPro,
      output: {
        schema: AnalyzeDashboardOutputSchema
      }
    });

    return llmResponse.output()!;
  }
);
