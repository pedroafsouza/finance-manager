import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { encrypt, decrypt, isValidAnthropicKey, isValidGeminiKey } from '@/lib/encryption';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch current LLM settings (without decrypted keys)
export async function GET() {
  try {
    await initDb();
    const db = await getDb();

    const settings = db.prepare(`
      SELECT
        id,
        preferred_llm,
        anthropic_api_key_encrypted IS NOT NULL as has_anthropic_key,
        gemini_api_key_encrypted IS NOT NULL as has_gemini_key,
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

// POST - Save LLM settings with encrypted API keys
export async function POST(request: NextRequest) {
  try {
    await initDb();
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

    // Encrypt keys
    let anthropicEncrypted = null;
    let geminiEncrypted = null;
    let iv = null;
    let tag = null;

    if (anthropicApiKey) {
      const encrypted = encrypt(anthropicApiKey);
      anthropicEncrypted = encrypted.encrypted;
      iv = encrypted.iv;
      tag = encrypted.tag;
    }

    if (geminiApiKey) {
      const encrypted = encrypt(geminiApiKey);
      geminiEncrypted = encrypted.encrypted;
      if (!iv) {
        iv = encrypted.iv;
        tag = encrypted.tag;
      }
    }

    const db = await getDb();

    // Check if settings exist
    const existing = db.prepare('SELECT id FROM llm_settings LIMIT 1').get() as any;

    if (existing) {
      // Update existing
      const updateStmt = db.prepare(`
        UPDATE llm_settings
        SET anthropic_api_key_encrypted = ?,
            gemini_api_key_encrypted = ?,
            preferred_llm = ?,
            encryption_iv = ?,
            last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      updateStmt.run(
        anthropicEncrypted,
        geminiEncrypted,
        preferredLlm,
        JSON.stringify({ iv, tag }),
        existing.id
      );
    } else {
      // Insert new
      const insertStmt = db.prepare(`
        INSERT INTO llm_settings (
          anthropic_api_key_encrypted,
          gemini_api_key_encrypted,
          preferred_llm,
          encryption_iv
        ) VALUES (?, ?, ?, ?)
      `);

      insertStmt.run(
        anthropicEncrypted,
        geminiEncrypted,
        preferredLlm,
        JSON.stringify({ iv, tag })
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
    await initDb();
    const db = await getDb();

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
