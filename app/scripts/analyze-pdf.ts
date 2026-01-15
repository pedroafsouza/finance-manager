const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfPath = path.join(process.cwd(), '..', 'data', 'statement.pdf');

async function analyzePDF() {
  console.log('📄 Analyzing Morgan Stanley PDF Statement\n');
  console.log(`Reading: ${pdfPath}\n`);

  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(dataBuffer);

  console.log('=== PDF METADATA ===');
  console.log(`Pages: ${data.numpages}`);
  console.log(`Info:`, data.info);
  console.log('\n=== RAW TEXT CONTENT ===\n');
  console.log(data.text);
  console.log('\n=== ANALYSIS ===');

  // Look for common patterns
  const text = data.text;

  // Check for transaction types
  const patterns = {
    'Stock Sales': /sell|sold|sale/gi,
    'Dividends': /dividend/gi,
    'Reinvestments': /reinvest/gi,
    'Acquisitions/Vesting': /vest|grant|award/gi,
    'Dates': /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    'Currency': /\$\s*[\d,]+\.?\d*/g,
    'Shares': /\d+\.\d+\s*(shares?|shs?)/gi,
  };

  console.log('\nPattern Matches:');
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern);
    if (matches) {
      console.log(`  ${name}: ${matches.length} matches`);
      if (name !== 'Dates' && name !== 'Currency' && name !== 'Shares') {
        console.log(`    Examples: ${matches.slice(0, 3).join(', ')}`);
      }
    }
  }

  // Try to identify sections
  console.log('\n=== POTENTIAL SECTIONS ===');
  const lines = text.split('\n').filter((line: string) => line.trim().length > 0);
  const sections = lines.filter((line: string) => line.toUpperCase() === line && line.length > 10);
  sections.forEach((section: string) => {
    console.log(`  - ${section}`);
  });
}

analyzePDF().catch(console.error);
