import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { parseMorganStanleyPDF } from '@/lib/pdf-parser-morgan-stanley';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Initialize database if needed
    await initDb();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if it's a PDF
    if (!file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Read PDF file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF using pdf.js-extract
    let fullText = '';
    try {
      const PDFExtract = require('pdf.js-extract').PDFExtract;
      const pdfExtract = new PDFExtract();
      const data = await pdfExtract.extractBuffer(buffer);

      console.log(`PDF has ${data.pages.length} pages`);

      // Combine all text content from all pages, preserving layout
      fullText = data.pages.map((page: any, pageIndex: number) => {
        console.log(`Processing page ${pageIndex + 1} with ${page.content.length} content items`);
        // Sort content by y position (top to bottom), then x position (left to right)
        const sortedContent = page.content.sort((a: any, b: any) => {
          const yDiff = a.y - b.y;
          // Group items on same line (within 2 pixels)
          if (Math.abs(yDiff) < 2) {
            return a.x - b.x;
          }
          return yDiff;
        });

        // Group items by line based on y position
        const lines: string[] = [];
        let currentLine: string[] = [];
        let lastY = -1;

        for (const item of sortedContent) {
          // If y position changed significantly, start new line
          if (lastY >= 0 && Math.abs(item.y - lastY) > 2) {
            if (currentLine.length > 0) {
              lines.push(currentLine.join(' '));
              currentLine = [];
            }
          }
          currentLine.push(item.str);
          lastY = item.y;
        }

        // Add last line
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }

        return lines.join('\n');
      }).join('\n');
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json(
        { success: false, error: `Failed to parse PDF file: ${(pdfError as Error).message}` },
        { status: 500 }
      );
    }

    // Debug: Log first 1000 chars of extracted text
    console.log('=== EXTRACTED PDF TEXT (first 1000 chars) ===');
    console.log(fullText.substring(0, 1000));
    console.log('=== END EXTRACTED TEXT ===');
    console.log(`Total text length: ${fullText.length} characters`);

    // Parse the PDF text
    const { holdings, transactions } = parseMorganStanleyPDF(fullText);

    console.log(`Parsed ${holdings.length} holdings and ${transactions.length} transactions`);

    // Insert data into database
    const db = await getDb();

    try {
      db.exec('BEGIN TRANSACTION');

      // Insert holdings
      const insertHolding = db.prepare(`
        INSERT INTO holdings (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Log first few holdings to debug
      console.log('=== First 3 Holdings Being Inserted ===');
      holdings.slice(0, 3).forEach((h, idx) => {
        console.log(`${idx + 1}. Ticker: ${h.ticker}, Date: ${h.acquisition_date}, Lot: ${h.lot_number}, Shares: ${h.total_shares}`);
      });

      for (const holding of holdings) {
        insertHolding.run(
          holding.ticker,
          holding.acquisition_date,
          holding.lot_number,
          holding.capital_gain_impact,
          holding.adjusted_gain_loss,
          holding.adjusted_cost_basis,
          holding.adjusted_cost_basis_per_share,
          holding.total_shares,
          holding.current_price_per_share,
          holding.current_value
        );
      }

      // Insert transactions
      const insertTransaction = db.prepare(`
        INSERT INTO transactions (
          entry_date, activity_type, ticker, lot_number,
          num_shares, share_price, book_value, market_value, cash_value
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const transaction of transactions) {
        insertTransaction.run(
          transaction.entry_date,
          transaction.activity_type,
          transaction.ticker,
          transaction.lot_number || null,
          transaction.num_shares || null,
          transaction.share_price || null,
          transaction.book_value || null,
          transaction.market_value || null,
          transaction.cash_value || null
        );
      }

      // Also insert into stock_grants for backward compatibility
      const insertGrant = db.prepare(`
        INSERT INTO stock_grants (
          ticker, acquisition_date, lot_number, capital_gain_impact,
          adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
          total_shares, current_price_per_share, current_value, import_source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const holding of holdings) {
        insertGrant.run(
          holding.ticker,
          holding.acquisition_date,
          holding.lot_number,
          holding.capital_gain_impact,
          holding.adjusted_gain_loss,
          holding.adjusted_cost_basis,
          holding.adjusted_cost_basis_per_share,
          holding.total_shares,
          holding.current_price_per_share,
          holding.current_value,
          'morgan-stanley-pdf'
        );
      }

      db.exec('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'PDF imported successfully',
        holdings: holdings.length,
        transactions: transactions.length,
      });
    } catch (dbError) {
      db.exec('ROLLBACK');
      console.error('Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to save data to database' },
        { status: 500 }
      );
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import PDF' },
      { status: 500 }
    );
  }
}
