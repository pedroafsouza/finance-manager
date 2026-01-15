import { Database } from 'bun:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'demo.db');
console.log('Database path:', dbPath);
const db = new Database(dbPath);

// Array of divisors
const divisors = [2, 3, 5, 7];

// Function to get random divisor
function getRandomDivisor() {
  return divisors[Math.floor(Math.random() * divisors.length)];
}

console.log('Starting database anonymization...');

// Anonymize transactions table
const transactions = db.prepare('SELECT id FROM transactions').all();
console.log(`Processing ${transactions.length} transactions...`);

const updateTransaction = db.prepare(`
  UPDATE transactions
  SET
    share_price = CASE WHEN share_price IS NOT NULL THEN share_price / ? ELSE NULL END,
    book_value = CASE WHEN book_value IS NOT NULL THEN book_value / ? ELSE NULL END,
    market_value = CASE WHEN market_value IS NOT NULL THEN market_value / ? ELSE NULL END,
    cash_value = CASE WHEN cash_value IS NOT NULL THEN cash_value / ? ELSE NULL END
  WHERE id = ?
`);

for (const row of transactions) {
  const divisor = getRandomDivisor();
  updateTransaction.run(divisor, divisor, divisor, divisor, row.id);
}

// Anonymize holdings table
const holdings = db.prepare('SELECT id FROM holdings').all();
console.log(`Processing ${holdings.length} holdings...`);

const updateHolding = db.prepare(`
  UPDATE holdings
  SET
    adjusted_gain_loss = CASE WHEN adjusted_gain_loss IS NOT NULL THEN adjusted_gain_loss / ? ELSE NULL END,
    adjusted_cost_basis = CASE WHEN adjusted_cost_basis IS NOT NULL THEN adjusted_cost_basis / ? ELSE NULL END,
    adjusted_cost_basis_per_share = CASE WHEN adjusted_cost_basis_per_share IS NOT NULL THEN adjusted_cost_basis_per_share / ? ELSE NULL END,
    current_price_per_share = CASE WHEN current_price_per_share IS NOT NULL THEN current_price_per_share / ? ELSE NULL END,
    current_value = CASE WHEN current_value IS NOT NULL THEN current_value / ? ELSE NULL END
  WHERE id = ?
`);

for (const row of holdings) {
  const divisor = getRandomDivisor();
  updateHolding.run(divisor, divisor, divisor, divisor, divisor, row.id);
}

// Anonymize stock_grants table
const grants = db.prepare('SELECT id FROM stock_grants').all();
console.log(`Processing ${grants.length} stock grants...`);

const updateGrant = db.prepare(`
  UPDATE stock_grants
  SET
    adjusted_gain_loss = CASE WHEN adjusted_gain_loss IS NOT NULL THEN adjusted_gain_loss / ? ELSE NULL END,
    adjusted_cost_basis = CASE WHEN adjusted_cost_basis IS NOT NULL THEN adjusted_cost_basis / ? ELSE NULL END,
    adjusted_cost_basis_per_share = CASE WHEN adjusted_cost_basis_per_share IS NOT NULL THEN adjusted_cost_basis_per_share / ? ELSE NULL END,
    current_price_per_share = CASE WHEN current_price_per_share IS NOT NULL THEN current_price_per_share / ? ELSE NULL END,
    current_value = CASE WHEN current_value IS NOT NULL THEN current_value / ? ELSE NULL END
  WHERE id = ?
`);

for (const row of grants) {
  const divisor = getRandomDivisor();
  updateGrant.run(divisor, divisor, divisor, divisor, divisor, row.id);
}

db.close();
console.log('Database anonymization complete!');
