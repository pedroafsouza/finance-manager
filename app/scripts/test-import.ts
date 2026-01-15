import * as fs from 'fs';
import * as path from 'path';
import { parseMorganStanleyExcel } from '../lib/excel-parser';
import { getDb, initDb } from '../lib/db';

const filePath = path.resolve(__dirname, '../../data/morgan-stanley.xlsx');

async function main() {
  console.log('Testing Excel import...\n');

  // Initialize database
  console.log('1. Initializing database...');
  initDb();
  console.log('✓ Database initialized\n');

  // Read and parse Excel file
  console.log('2. Reading Excel file:', filePath);
  const buffer = fs.readFileSync(filePath);
  const grants = parseMorganStanleyExcel(buffer);
  console.log(`✓ Parsed ${grants.length} stock grants\n`);

  // Display first few records
  console.log('3. Sample records:');
  grants.slice(0, 3).forEach((grant, idx) => {
    console.log(`\nRecord ${idx + 1}:`);
    console.log(`  Ticker: ${grant.ticker}`);
    console.log(`  Acquisition Date: ${grant.acquisitionDate.toLocaleDateString()}`);
    console.log(`  Lot: ${grant.lotNumber}`);
    console.log(`  Type: ${grant.capitalGainImpact}`);
    console.log(`  Shares: ${grant.totalShares}`);
    console.log(`  Cost Basis: $${grant.adjustedCostBasis.toFixed(2)}`);
    console.log(`  Current Value: $${grant.currentValue.toFixed(2)}`);
    console.log(`  Gain/Loss: $${grant.adjustedGainLoss.toFixed(2)}`);
  });

  // Insert into database
  console.log('\n4. Inserting into database...');
  const db = await getDb();

  const insertStmt = db.prepare(`
    INSERT INTO stock_grants (
      ticker, acquisition_date, lot_number, capital_gain_impact,
      adjusted_gain_loss, adjusted_cost_basis, adjusted_cost_basis_per_share,
      total_shares, current_price_per_share, current_value
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((grants: any) => {
    for (const grant of grants) {
      insertStmt.run(
        grant.ticker,
        grant.acquisitionDate.toISOString(),
        grant.lotNumber,
        grant.capitalGainImpact,
        grant.adjustedGainLoss,
        grant.adjustedCostBasis,
        grant.adjustedCostBasisPerShare,
        grant.totalShares,
        grant.currentPricePerShare,
        grant.currentValue
      );
    }
  });

  insertMany(grants);
  console.log('✓ Inserted records into database\n');

  // Verify data in database
  console.log('5. Verifying database contents...');
  const count = db.prepare('SELECT COUNT(*) as count FROM stock_grants').get() as { count: number };
  console.log(`✓ Total records in database: ${count.count}`);

  const sampleRecords = db.prepare('SELECT * FROM stock_grants LIMIT 3').all();
  console.log('\nSample from database:');
  sampleRecords.forEach((record: any, idx: number) => {
    console.log(`\nRecord ${idx + 1}:`);
    console.log(`  ID: ${record.id}`);
    console.log(`  Ticker: ${record.ticker}`);
    console.log(`  Acquisition Date: ${new Date(record.acquisition_date).toLocaleDateString()}`);
    console.log(`  Lot: ${record.lot_number}`);
    console.log(`  Shares: ${record.total_shares}`);
    console.log(`  Current Value: $${record.current_value.toFixed(2)}`);
  });

  db.close();

  console.log('\n✓ Test completed successfully!');
  console.log('\nYou can now:');
  console.log('1. Visit http://localhost:3000 to see the home page');
  console.log('2. Visit http://localhost:3000/imports to upload Excel files');
}

main().catch(console.error);
