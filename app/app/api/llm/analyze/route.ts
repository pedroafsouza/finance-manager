import { NextRequest, NextResponse } from 'next/server';
import { getDb, getAnalysisDb, getSecretsDb, initDb, initDemoAnalysisDb, initLiveAnalysisDb, initDemoSecretsDb, initLiveSecretsDb } from '@/lib/db';
import { analyzeWithClaude, analyzeWithGemini } from '@/lib/llm-clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for LLM calls

// POST - Trigger portfolio analysis
export async function POST(request: NextRequest) {
  try {
    await initDb();
    initDemoAnalysisDb(); // Initialize demo analysis database
    initLiveAnalysisDb(); // Initialize live analysis database
    initDemoSecretsDb(); // Initialize demo secrets database
    initLiveSecretsDb(); // Initialize live secrets database

    const db = await getDb();
    const secretsDb = await getSecretsDb();

    // 1. Get LLM settings from secrets database
    const settings = secretsDb.prepare(`
      SELECT * FROM llm_settings ORDER BY id DESC LIMIT 1
    `).get() as any;

    if (!settings) {
      secretsDb.close();
      db.close();
      return NextResponse.json(
        { success: false, error: 'LLM not configured. Please add API keys in settings.' },
        { status: 400 }
      );
    }

    // 2. Get API key based on preferred LLM (plain text, no decryption needed)
    let apiKey: string;
    let llmProvider: string;

    if (settings.preferred_llm === 'claude' && settings.anthropic_api_key) {
      apiKey = settings.anthropic_api_key;
      llmProvider = 'claude';
    } else if (settings.preferred_llm === 'gemini' && settings.gemini_api_key) {
      apiKey = settings.gemini_api_key;
      llmProvider = 'gemini';
    } else {
      secretsDb.close();
      db.close();
      return NextResponse.json(
        { success: false, error: `No API key configured for ${settings.preferred_llm}` },
        { status: 400 }
      );
    }

    secretsDb.close();

    // 3. Gather data for analysis
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY entry_date DESC').all();
    const holdings = db.prepare('SELECT * FROM holdings').all();
    const taxCalculations = db.prepare('SELECT * FROM tax_calculations ORDER BY year DESC').all();

    const dataSnapshot = {
      transactions,
      holdings,
      taxCalculations,
      timestamp: new Date().toISOString(),
    };

    // 4. Call appropriate LLM
    let analysis;
    try {
      if (llmProvider === 'claude') {
        analysis = await analyzeWithClaude(apiKey, dataSnapshot);
      } else {
        analysis = await analyzeWithGemini(apiKey, dataSnapshot);
      }
    } catch (llmError: any) {
      // Parse error messages from LLM providers
      let errorMessage = 'Analysis failed';
      let errorType = 'unknown';

      if (llmError.status === 401) {
        errorMessage = 'Invalid API key. Please check your API keys in settings.';
        errorType = 'auth';
      } else if (llmError.status === 400) {
        // Extract the specific error message from Anthropic/Google
        const errorDetail = llmError.error?.error?.message || llmError.message;
        if (errorDetail?.includes('credit balance')) {
          errorMessage = 'Your credit balance is too low. Please add credits to your account.';
          errorType = 'credits';
        } else if (errorDetail?.includes('rate limit')) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
          errorType = 'rate_limit';
        } else {
          errorMessage = errorDetail || 'Invalid request to LLM provider.';
          errorType = 'bad_request';
        }
      } else if (llmError.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        errorType = 'rate_limit';
      } else if (llmError.status === 500 || llmError.status === 503) {
        errorMessage = `${llmProvider === 'claude' ? 'Claude' : 'Gemini'} service is temporarily unavailable. Please try again later.`;
        errorType = 'service_unavailable';
      } else {
        errorMessage = llmError.message || 'An unexpected error occurred during analysis.';
      }

      console.error('LLM Error:', {
        provider: llmProvider,
        status: llmError.status,
        error: llmError.error,
        message: errorMessage,
      });

      // Save error notification to database
      try {
        const analysisDb = await getAnalysisDb();
        const insertStmt = analysisDb.prepare(`
          INSERT INTO llm_analysis_reports (
            llm_provider,
            analysis_type,
            reasoning,
            is_read,
            is_error,
            error_type
          ) VALUES (?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          llmProvider,
          'portfolio',
          errorMessage,
          0, // unread
          1, // is_error = true
          errorType
        );

        analysisDb.close();
      } catch (dbError) {
        console.error('Failed to save error notification:', dbError);
      }

      db.close();

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          errorType,
          provider: llmProvider,
        },
        { status: llmError.status || 500 }
      );
    }

    // 5. Save analysis to appropriate database (demo or live)
    const analysisDb = await getAnalysisDb();
    const insertStmt = analysisDb.prepare(`
      INSERT INTO llm_analysis_reports (
        llm_provider,
        analysis_type,
        prompt_tokens,
        completion_tokens,
        recommendation,
        reasoning,
        confidence_level,
        risk_factors,
        opportunities,
        data_snapshot,
        is_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      llmProvider,
      'portfolio',
      analysis.promptTokens,
      analysis.completionTokens,
      analysis.recommendation,
      analysis.reasoning,
      analysis.confidenceLevel,
      JSON.stringify(analysis.riskFactors),
      JSON.stringify(analysis.opportunities),
      JSON.stringify(dataSnapshot),
      0 // unread
    );

    analysisDb.close();
    db.close();

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        ...analysis,
      },
    });
  } catch (error) {
    console.error('Error during LLM analysis:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
