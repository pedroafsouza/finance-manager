import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { analyzeWithClaude, analyzeWithGemini } from '@/lib/llm-clients';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 second timeout for LLM calls

// POST - Trigger portfolio analysis
export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = await getDb();

    // 1. Get LLM settings
    const settings = db.prepare(`
      SELECT * FROM llm_settings ORDER BY id DESC LIMIT 1
    `).get() as any;

    if (!settings) {
      db.close();
      return NextResponse.json(
        { success: false, error: 'LLM not configured. Please add API keys in settings.' },
        { status: 400 }
      );
    }

    // 2. Decrypt API key based on preferred LLM
    const encryptionData = JSON.parse(settings.encryption_iv);
    let apiKey: string;
    let llmProvider: string;

    if (settings.preferred_llm === 'claude' && settings.anthropic_api_key_encrypted) {
      apiKey = decrypt({
        encrypted: settings.anthropic_api_key_encrypted,
        iv: encryptionData.iv,
        tag: encryptionData.tag,
      });
      llmProvider = 'claude';
    } else if (settings.preferred_llm === 'gemini' && settings.gemini_api_key_encrypted) {
      apiKey = decrypt({
        encrypted: settings.gemini_api_key_encrypted,
        iv: encryptionData.iv,
        tag: encryptionData.tag,
      });
      llmProvider = 'gemini';
    } else {
      db.close();
      return NextResponse.json(
        { success: false, error: `No API key configured for ${settings.preferred_llm}` },
        { status: 400 }
      );
    }

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
    if (llmProvider === 'claude') {
      analysis = await analyzeWithClaude(apiKey, dataSnapshot);
    } else {
      analysis = await analyzeWithGemini(apiKey, dataSnapshot);
    }

    // 5. Save analysis to database
    const insertStmt = db.prepare(`
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
        error: 'Analysis failed',
        details: (error as Error).message
      },
      { status: 500 }
    );
  }
}
