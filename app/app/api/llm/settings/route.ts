import { NextRequest, NextResponse } from 'next/server';
import { getSecretsDb, initDemoSecretsDb, initLiveSecretsDb } from '@/lib/db';
import { isValidAnthropicKey, isValidGeminiKey } from '@/lib/encryption';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch current LLM settings (without showing keys)
export async function GET() {
  try {
    initDemoSecretsDb();
    initLiveSecretsDb();
    const db = await getSecretsDb();

    const settings = db.prepare(`
      SELECT
        id,
        preferred_llm,
        anthropic_api_key IS NOT NULL AND anthropic_api_key != '' as has_anthropic_key,
        gemini_api_key IS NOT NULL AND gemini_api_key != '' as has_gemini_key,
        last_updated
      FROM llm_settings
      ORDER BY id DESC
      LIMIT 1
    `).get();

    db.close();

    return NextResponse.json({
      success: true,
      data: settings || {
        preferred_llm: 'claude',
        has_anthropic_key: false,
        has_gemini_key: false,
      },
    });
  } catch (error) {
    console.error('Error fetching LLM settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Save LLM settings in plain text
export async function POST(request: NextRequest) {
  try {
    initDemoSecretsDb();
    initLiveSecretsDb();
    const body = await request.json();

    const { anthropicApiKey, geminiApiKey, preferredLlm = 'claude' } = body;

    // Validate at least one key is provided
    if (!anthropicApiKey && !geminiApiKey) {
      return NextResponse.json(
        { success: false, error: 'At least one API key is required' },
        { status: 400 }
      );
    }

    // Validate key formats
    if (anthropicApiKey && !isValidAnthropicKey(anthropicApiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Anthropic API key format' },
        { status: 400 }
      );
    }

    if (geminiApiKey && !isValidGeminiKey(geminiApiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Gemini API key format' },
        { status: 400 }
      );
    }

    const db = await getSecretsDb();

    // Check if settings exist
    const existing = db.prepare('SELECT id FROM llm_settings LIMIT 1').get() as any;

    if (existing) {
      // Update existing
      const updateStmt = db.prepare(`
        UPDATE llm_settings
        SET anthropic_api_key = ?,
            gemini_api_key = ?,
            preferred_llm = ?,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(
        anthropicApiKey || null,
        geminiApiKey || null,
        preferredLlm,
        existing.id
      );
    } else {
      // Insert new
      const insertStmt = db.prepare(`
        INSERT INTO llm_settings (
          anthropic_api_key,
          gemini_api_key,
          preferred_llm
        ) VALUES (?, ?, ?)
      `);

      insertStmt.run(
        anthropicApiKey || null,
        geminiApiKey || null,
        preferredLlm
      );
    }

    db.close();

    return NextResponse.json({
      success: true,
      message: 'LLM settings saved successfully',
    });
  } catch (error) {
    console.error('Error saving LLM settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

// DELETE - Remove API keys
export async function DELETE() {
  try {
    initDemoSecretsDb();
    initLiveSecretsDb();
    const db = await getSecretsDb();

    db.prepare('DELETE FROM llm_settings').run();
    db.close();

    return NextResponse.json({
      success: true,
      message: 'LLM settings deleted',
    });
  } catch (error) {
    console.error('Error deleting LLM settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete settings' },
      { status: 500 }
    );
  }
}
