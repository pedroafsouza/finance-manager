import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisDb, initDb, initDemoAnalysisDb, initLiveAnalysisDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch all analysis reports
export async function GET(request: NextRequest) {
  try {
    await initDb();
    initDemoAnalysisDb();
    initLiveAnalysisDb();
    const db = await getAnalysisDb();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = `
      SELECT
        id,
        llm_provider,
        analysis_type,
        recommendation,
        reasoning,
        confidence_level,
        risk_factors,
        opportunities,
        is_read,
        created_at
      FROM llm_analysis_reports
    `;

    if (unreadOnly) {
      query += ' WHERE is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const reports = db.prepare(query).all();

    // Parse JSON fields
    const parsedReports = reports.map((report: any) => ({
      ...report,
      risk_factors: JSON.parse(report.risk_factors || '[]'),
      opportunities: JSON.parse(report.opportunities || '[]'),
    }));

    // Get unread count
    const unreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM llm_analysis_reports WHERE is_read = 0'
    ).get() as any;

    db.close();

    return NextResponse.json({
      success: true,
      data: parsedReports,
      unreadCount: unreadCount.count,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// PATCH - Mark report as read
export async function PATCH(request: NextRequest) {
  try {
    await initDb();
    initDemoAnalysisDb();
    initLiveAnalysisDb();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Report ID required' },
        { status: 400 }
      );
    }

    const db = await getAnalysisDb();

    db.prepare('UPDATE llm_analysis_reports SET is_read = 1 WHERE id = ?').run(id);

    db.close();

    return NextResponse.json({
      success: true,
      message: 'Report marked as read',
    });
  } catch (error) {
    console.error('Error marking report as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
