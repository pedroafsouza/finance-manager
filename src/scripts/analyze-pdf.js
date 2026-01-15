const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const pdfPath = path.join(__dirname, '..', '..', 'data', 'statement.pdf');

async function analyzePDF() {
  console.log('📄 Analyzing Morgan Stanley PDF Statement\n');
  console.log(`Reading: ${pdfPath}\n`);

  const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument(dataBuffer);
  const pdfDocument = await loadingTask.promise;

  console.log('=== PDF METADATA ===');
  console.log(`Pages: ${pdfDocument.numPages}`);

  let fullText = '';

  // Extract text from all pages
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  console.log('\n=== RAW TEXT CONTENT ===\n');
  console.log(fullText.substring(0, 5000)); // First 5000 chars

  if (fullText.length > 5000) {
    console.log(`\n... (${fullText.length - 5000} more characters)`);
  }

  console.log('\n\n=== ANALYSIS ===');

  // Look for common patterns
  const patterns = {
    'Stock Sales': /sell|sold|sale/gi,
    'Dividends': /dividend/gi,
    'Reinvestments': /reinvest/gi,
    'Acquisitions/Vesting': /vest|grant|award|acquisition/gi,
    'Dates': /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    'Currency': /\$\s*[\d,]+\.?\d*/g,
    'Shares': /\d+\.\d+\s*(shares?|shs?)/gi,
  };

  console.log('\nPattern Matches:');
  for (const [name, pattern] of Object.entries(patterns)) {
    const matches = fullText.match(pattern);
    if (matches) {
      console.log(`  ${name}: ${matches.length} matches`);
      if (name !== 'Dates' && name !== 'Currency' && name !== 'Shares') {
        console.log(`    Examples: ${matches.slice(0, 5).join(', ')}`);
      }
    }
  }

  // Try to identify sections
  console.log('\n=== POTENTIAL SECTIONS ===');
  const lines = fullText.split('\n').filter(line => line.trim().length > 10);
  const sections = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.toUpperCase() === trimmed && trimmed.length > 15 && trimmed.length < 100;
  });

  const uniqueSections = [...new Set(sections)];
  uniqueSections.slice(0, 20).forEach(section => {
    console.log(`  - ${section}`);
  });

  // Look for table-like structures
  console.log('\n=== SAMPLE LINES (first 50) ===');
  lines.slice(0, 50).forEach((line, i) => {
    console.log(`${i + 1}: ${line.substring(0, 150)}`);
  });
}

analyzePDF().catch(console.error);
