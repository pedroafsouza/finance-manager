import { NextRequest, NextResponse } from 'next/server';
import { getAnalysisDb, initDemoAnalysisDb, initLiveAnalysisDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    initDemoAnalysisDb();
    initLiveAnalysisDb();
    const { id } = await params;
    const db = await getAnalysisDb();

    const report = db.prepare(`
      SELECT * FROM llm_analysis_reports
      WHERE id = ?
    `).get(id) as any;

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const parsedReport = {
      ...report,
      risk_factors: JSON.parse(report.risk_factors as string),
      opportunities: JSON.parse(report.opportunities as string),
      data_snapshot: report.data_snapshot ? JSON.parse(report.data_snapshot as string) : null,
    };

    db.close();

    return NextResponse.json({
      success: true,
      data: parsedReport,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
