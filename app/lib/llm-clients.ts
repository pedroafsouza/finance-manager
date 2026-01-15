import { GoogleGenAI } from "@google/genai";
import Anthropic from '@anthropic-ai/sdk';

interface AnalysisResult {
  recommendation: 'buy' | 'sell' | 'hold';
  reasoning: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  riskFactors: string[];
  opportunities: string[];
  promptTokens: number;
  completionTokens: number;
}

interface DataSnapshot {
  transactions: any[];
  holdings: any[];
  taxCalculations: any[];
  timestamp: string;
}

/**
 * Generate prompt for LLM analysis
 */
function generateAnalysisPrompt(data: DataSnapshot): string {
  const totalHoldings = data.holdings.reduce((sum, h) => sum + (h.current_value || 0), 0);
  const totalCostBasis = data.holdings.reduce((sum, h) => sum + (h.adjusted_cost_basis || 0), 0);
  const unrealizedGains = totalHoldings - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? ((unrealizedGains / totalCostBasis) * 100) : 0;

  // Calculate portfolio concentration
  const holdingsByTicker = data.holdings.reduce((acc, h) => {
    acc[h.ticker] = (acc[h.ticker] || 0) + h.current_value;
    return acc;
  }, {} as Record<string, number>);

  const concentrationData = Object.entries(holdingsByTicker)
    .map(([ticker, value]) => ({
      ticker,
      value,
      percentage: totalHoldings > 0 ? (value / totalHoldings) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate average gain/loss per holding
  const avgGainLoss = data.holdings.length > 0
    ? data.holdings.reduce((sum, h) => sum + (h.adjusted_gain_loss || 0), 0) / data.holdings.length
    : 0;

  // Get vesting/acquisition pattern
  const vestingDates = data.holdings.map(h => h.acquisition_date).filter(Boolean);
  const recentVestings = vestingDates.filter(d => {
    const date = new Date(d);
    const now = new Date();
    const monthsAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 6;
  }).length;

  // Transaction activity analysis
  const recentTransactions = data.transactions.filter(t => {
    const date = new Date(t.entry_date);
    const now = new Date();
    const monthsAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 3;
  });

  const vestActivity = recentTransactions.filter(t => t.activity_type?.toLowerCase().includes('vest')).length;
  const sellActivity = recentTransactions.filter(t => t.activity_type?.toLowerCase().includes('sale')).length;

  return `You are a financial advisor analyzing a portfolio for an individual living in Denmark with RSU (Restricted Stock Unit) compensation.

**Portfolio Overview:**
- Total Holdings Value: $${totalHoldings.toFixed(2)}
- Total Cost Basis: $${totalCostBasis.toFixed(2)}
- Unrealized Gains/Loss: $${unrealizedGains.toFixed(2)} (${gainLossPercent > 0 ? '+' : ''}${gainLossPercent.toFixed(2)}%)
- Number of Holdings/Grants: ${data.holdings.length}
- Total Transactions: ${data.transactions.length}
- Average Gain/Loss per Holding: $${avgGainLoss.toFixed(2)}

**Portfolio Concentration:**
${concentrationData.map(c =>
  `- ${c.ticker}: $${c.value.toFixed(2)} (${c.percentage.toFixed(1)}% of portfolio)`
).join('\n')}

**Recent Activity (Last 3 months):**
- Total Transactions: ${recentTransactions.length}
- Vesting Events: ${vestActivity}
- Sale Events: ${sellActivity}
- Recent Vestings (Last 6 months): ${recentVestings} grants

**Recent Transactions (Last 10):**
${data.transactions.slice(0, 10).map(t =>
  `- ${t.entry_date}: ${t.activity_type} - ${t.num_shares} shares of ${t.ticker} at $${t.share_price} (Total: $${(t.num_shares * t.share_price).toFixed(2)})`
).join('\n')}

**Detailed Holdings by Grant:**
${data.holdings.map(h =>
  `- ${h.ticker} (Acquired: ${h.acquisition_date}): ${h.total_shares} shares
    • Cost Basis: $${h.adjusted_cost_basis.toFixed(2)}
    • Current Value: $${h.current_value.toFixed(2)}
    • Gain/Loss: $${h.adjusted_gain_loss.toFixed(2)} (${h.adjusted_cost_basis > 0 ? ((h.adjusted_gain_loss / h.adjusted_cost_basis) * 100).toFixed(2) : 0}%)`
).join('\n')}

**Tax Context (Denmark):**
${data.taxCalculations.length > 0 ? data.taxCalculations.map(tc =>
  `- Year ${tc.year}: Total tax: ${tc.total_tax_dkk} DKK, Effective rate: ${((tc.total_tax_dkk / tc.yearly_salary_dkk) * 100).toFixed(2)}%`
).join('\n') : 'No tax calculations available'}

**Important Context:**
- This individual receives RSU compensation from tech companies
- All positions are subject to Danish taxation rules:
  • RSU income is taxed as salary at vesting (up to 52.07% in top bracket)
  • Capital gains are taxed as share income (aktieindkomst) at 27% (first ~58,900 DKK) and 42% above
- Portfolio is concentrated in tech sector (${concentrationData[0]?.ticker} represents ${concentrationData[0]?.percentage.toFixed(1)}% of holdings)
- Individual must report foreign holdings annually to SKAT (Danish Tax Authority)

**CRITICAL INSTRUCTION:**
- DO NOT flag portfolio concentration in a single company as a risk factor
- This application is specifically designed to manage RSU compensation from the user's employer
- Having all holdings in one company is BY DESIGN and expected for this use case
- Focus your analysis on other aspects: tax optimization, timing of sales, market conditions, vesting schedules, etc.

**Analysis Request:**
Based on this detailed portfolio analysis, provide:
1. A recommendation: BUY, SELL, or HOLD
2. Detailed reasoning (2-3 paragraphs considering the full context above)
3. Confidence level: HIGH, MEDIUM, or LOW
4. Key risk factors (3-5 items) - be specific to this portfolio
5. Opportunities or advantages (3-5 items) - be specific to this portfolio

Consider:
- Danish tax implications and optimization strategies
- Recent vesting activity and potential future vestings
- Market timing based on current gains/losses
- Currency exposure (USD holdings for DKK tax resident)
- Tax-loss harvesting opportunities if applicable
- Whether to hold or sell vested shares based on current market conditions
- Optimal timing for realizing gains/losses given Danish tax brackets

DO NOT CONSIDER:
- Portfolio concentration or diversification (this is by design for RSU management)

Respond in JSON format:
{
  "recommendation": "buy|sell|hold",
  "reasoning": "detailed explanation...",
  "confidence_level": "high|medium|low",
  "risk_factors": ["risk 1", "risk 2", ...],
  "opportunities": ["opportunity 1", "opportunity 2", ...]
}`;
}

/**
 * Analyze with Claude (Anthropic)
 */
export async function analyzeWithClaude(apiKey: string, data: DataSnapshot): Promise<AnalysisResult> {
  const prompt = generateAnalysisPrompt(data);

  const client = new Anthropic({
    apiKey: apiKey,
  });

  const message = await client.messages.create({
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
    model: 'claude-sonnet-4-5-20250929',
  });

  // Extract text content from the response
  const content = message.content[0].type === 'text' ? message.content[0].text : '';

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Claude response');
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    recommendation: analysis.recommendation,
    reasoning: analysis.reasoning,
    confidenceLevel: analysis.confidence_level,
    riskFactors: analysis.risk_factors,
    opportunities: analysis.opportunities,
    promptTokens: message.usage.input_tokens,
    completionTokens: message.usage.output_tokens,
  };
}

/**
 * Analyze with Gemini (Google)
 */
export async function analyzeWithGemini(apiKey: string, data: DataSnapshot): Promise<AnalysisResult> {
  const prompt = generateAnalysisPrompt(data);

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  const content = response.text;

  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse Gemini response');
  }

  const analysis = JSON.parse(jsonMatch[0]);

  return {
    recommendation: analysis.recommendation,
    reasoning: analysis.reasoning,
    confidenceLevel: analysis.confidence_level,
    riskFactors: analysis.risk_factors,
    opportunities: analysis.opportunities,
    promptTokens: response.usageMetadata?.promptTokenCount || 0,
    completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
  };
}
