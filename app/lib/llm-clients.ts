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

  return `You are a financial advisor analyzing a portfolio for an individual living in Denmark with RSU (Restricted Stock Unit) compensation.

**Portfolio Summary:**
- Total Holdings Value: $${totalHoldings.toFixed(2)}
- Total Cost Basis: $${totalCostBasis.toFixed(2)}
- Unrealized Gains: $${unrealizedGains.toFixed(2)}
- Number of Transactions: ${data.transactions.length}
- Number of Holdings: ${data.holdings.length}

**Recent Transactions (last 10):**
${data.transactions.slice(0, 10).map(t =>
  `- ${t.entry_date}: ${t.activity_type} ${t.num_shares} shares of ${t.ticker} at $${t.share_price}`
).join('\n')}

**Current Holdings:**
${data.holdings.map(h =>
  `- ${h.ticker}: ${h.total_shares} shares, Cost basis: $${h.adjusted_cost_basis}, Current value: $${h.current_value}`
).join('\n')}

**Tax Information:**
${data.taxCalculations.length > 0 ? data.taxCalculations.map(tc =>
  `- Year ${tc.year}: Total tax: ${tc.total_tax_dkk} DKK, Effective rate: ${((tc.total_tax_dkk / tc.yearly_salary_dkk) * 100).toFixed(2)}%`
).join('\n') : 'No tax calculations available'}

**Analysis Request:**
Based on this portfolio data, provide:
1. A recommendation: BUY, SELL, or HOLD
2. Detailed reasoning (2-3 paragraphs)
3. Confidence level: HIGH, MEDIUM, or LOW
4. Key risk factors (3-5 items)
5. Opportunities or advantages (3-5 items)

Consider:
- Danish tax implications (capital gains, RSU taxation)
- Portfolio concentration risk
- Market timing and recent transaction patterns
- Tax optimization opportunities

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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  const content = result.content[0].text;

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
    promptTokens: result.usage.input_tokens,
    completionTokens: result.usage.output_tokens,
  };
}

/**
 * Analyze with Gemini (Google)
 */
export async function analyzeWithGemini(apiKey: string, data: DataSnapshot): Promise<AnalysisResult> {
  const prompt = generateAnalysisPrompt(data);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
  }

  const result = await response.json();
  const content = result.candidates[0].content.parts[0].text;

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
    promptTokens: result.usageMetadata?.promptTokenCount || 0,
    completionTokens: result.usageMetadata?.candidatesTokenCount || 0,
  };
}
