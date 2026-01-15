import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve(__dirname, '../../data/morgan-stanley.xlsx');
const outputPath = path.resolve(__dirname, '../../data/morgan-stanley.xlsx');
const divisor = 10; // Divide values by 10 to anonymize

console.log('Reading file:', filePath);

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON to manipulate data
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

console.log(`\nOriginal data has ${jsonData.length} rows`);
console.log('Sample original data (row 2):');
console.log(jsonData[2]);

// Function to divide monetary value
const divideMonetary = (value: any): any => {
  if (typeof value === 'string' && value.includes('$')) {
    // Parse monetary value
    const numValue = parseFloat(value.replace(/\$/g, '').replace(/USD/g, '').replace(/,/g, '').trim());
    if (!isNaN(numValue)) {
      const newValue = numValue / divisor;
      return `$${newValue.toFixed(2)} USD`;
    }
  } else if (typeof value === 'number' && value > 0.01) {
    // Divide numeric values (but not dates which are large numbers)
    // Dates are typically > 40000, shares/prices are smaller
    if (value < 10000) {
      return value / divisor;
    }
  }
  return value;
};

// Modify data
const modifiedData = jsonData.map((row, rowIndex) => {
  // Skip header row (row 0)
  if (rowIndex === 0) return row;

  // Skip ticker info rows (row 1, and any row with "Type of Money:")
  if (row[0] && typeof row[0] === 'string' && row[0].includes('Type of Money:')) {
    return row;
  }

  // Skip empty rows
  if (!row[0] || row[0] === '') return row;

  // Modify data rows (columns 3-8 contain values to anonymize)
  return row.map((cell, colIndex) => {
    // Column 0: Date (keep as is)
    // Column 1: Lot number (keep as is)
    // Column 2: Capital gain impact (keep as is)
    // Columns 3-8: Values to divide
    if (colIndex >= 3 && colIndex <= 8) {
      return divideMonetary(cell);
    }
    return cell;
  });
});

console.log('\nSample modified data (row 2):');
console.log(modifiedData[2]);

// Create new worksheet
const newWorksheet = XLSX.utils.aoa_to_sheet(modifiedData);

// Copy original column widths if they exist
if (worksheet['!cols']) {
  newWorksheet['!cols'] = worksheet['!cols'];
}

// Replace worksheet in workbook
workbook.Sheets[sheetName] = newWorksheet;

// Save the modified workbook
XLSX.writeFile(workbook, outputPath);

console.log('\n✓ File anonymized successfully!');
console.log(`Saved to: ${outputPath}`);
console.log(`All monetary values and shares divided by ${divisor}`);

// Verify the changes
console.log('\nVerifying changes...');
const verifyWorkbook = XLSX.readFile(outputPath);
const verifyWorksheet = verifyWorkbook.Sheets[verifyWorkbook.SheetNames[0]];
const verifyData = XLSX.utils.sheet_to_json(verifyWorksheet, { header: 1 }) as any[][];

console.log('First data row after modification:');
console.log(verifyData[2]);

console.log('\n✓ Anonymization complete!');
