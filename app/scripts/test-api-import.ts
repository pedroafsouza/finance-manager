import * as fs from 'fs';
import * as path from 'path';

const filePath = path.resolve(__dirname, '../../data/morgan-stanley.xlsx');

async function testImport() {
  console.log('Testing Excel import via API...\n');

  // Read the file
  const fileBuffer = fs.readFileSync(filePath);
  const blob = new Blob([fileBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Create FormData
  const formData = new FormData();
  formData.append('file', blob, 'morgan-stanley.xlsx');

  try {
    console.log('1. Uploading file to API...');
    const response = await fetch('http://localhost:3000/api/import', {
      method: 'POST',
      body: formData,
    });

    console.log(`Status: ${response.status}`);

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.success) {
      console.log(`\n✓ Successfully imported ${data.count} records!`);

      // Fetch and display the data
      console.log('\n2. Fetching imported data...');
      const getResponse = await fetch('http://localhost:3000/api/grants');
      const getData = await getResponse.json();

      console.log(`✓ Retrieved ${getData.count} records`);
      console.log('\nFirst 3 records:');
      getData.data.slice(0, 3).forEach((record: any, idx: number) => {
        console.log(`\nRecord ${idx + 1}:`);
        console.log(`  Ticker: ${record.ticker}`);
        console.log(`  Acquisition Date: ${new Date(record.acquisition_date).toLocaleDateString()}`);
        console.log(`  Shares: ${record.total_shares}`);
        console.log(`  Current Value: $${record.current_value.toFixed(2)}`);
      });
    } else {
      console.error('\n✗ Import failed:', data.error);
    }
  } catch (error) {
    console.error('\n✗ Error:', error);
  }
}

testImport();
