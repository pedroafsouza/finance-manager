import * as XLSX from 'xlsx';
import * as path from 'path';

const filePath = path.resolve(__dirname, '../../data/morgan-stanley.xlsx');

console.log('Reading file:', filePath);

const workbook = XLSX.readFile(filePath);

console.log('\n=== WORKBOOK ANALYSIS ===\n');
console.log('Sheet names:', workbook.SheetNames);

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n=== SHEET: ${sheetName} ===\n`);
  const worksheet = workbook.Sheets[sheetName];

  // Get the range of the worksheet
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  console.log(`Range: ${worksheet['!ref']}`);
  console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}`);

  // Convert to JSON to see the data structure
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  console.log('\n--- First 10 rows ---');
  jsonData.slice(0, 10).forEach((row, idx) => {
    console.log(`Row ${idx}:`, row);
  });

  // Try to detect headers
  if (jsonData.length > 0) {
    console.log('\n--- Detected Headers (Row 0) ---');
    console.log(jsonData[0]);

    if (jsonData.length > 1) {
      console.log('\n--- Sample Data (Row 1) ---');
      console.log(jsonData[1]);
    }
  }

  // Convert with first row as headers
  const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
  console.log('\n--- First record with headers ---');
  console.log(JSON.stringify(dataWithHeaders[0], null, 2));
});
