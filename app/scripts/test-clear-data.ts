/**
 * Test script for the clear data functionality
 * This verifies that the clear endpoints work correctly
 */

const baseUrl = 'http://localhost:3000';

async function testClearFunctionality() {
  console.log('🧪 Testing Clear Data Functionality\n');

  try {
    // Step 1: Check initial data
    console.log('1. Checking current data...');
    const initialResponse = await fetch(`${baseUrl}/api/grants`);
    const initialData = await initialResponse.json();
    console.log(`   ✓ Current records: ${initialData.count}`);

    if (initialData.count === 0) {
      console.log('\n⚠️  No data to clear. Import some data first.');
      console.log('   Visit: http://localhost:3000/imports\n');
      return;
    }

    // Step 2: Test clear records (POST)
    console.log('\n2. Testing Clear Records (DELETE records, keep database)...');
    const clearResponse = await fetch(`${baseUrl}/api/clear-all`, {
      method: 'POST',
    });

    if (!clearResponse.ok) {
      throw new Error(`Clear failed: ${clearResponse.status}`);
    }

    const clearData = await clearResponse.json();
    console.log(`   ✓ Deleted ${clearData.recordsDeleted} records`);
    console.log(`   ✓ Message: ${clearData.message}`);

    // Step 3: Verify data was cleared
    console.log('\n3. Verifying records were cleared...');
    const afterClearResponse = await fetch(`${baseUrl}/api/grants`);
    const afterClearData = await afterClearResponse.json();
    console.log(`   ✓ Current records: ${afterClearData.count}`);

    if (afterClearData.count === 0) {
      console.log('   ✓ SUCCESS: All records cleared!');
    } else {
      console.log(`   ✗ FAILED: Still have ${afterClearData.count} records`);
    }

    // Step 4: Test database file deletion (DELETE)
    console.log('\n4. Testing Database File Deletion...');
    console.log('   ⚠️  This will delete the actual database files');
    console.log('   (Uncomment the code below to test this dangerous operation)\n');

    /*
    const deleteDbResponse = await fetch(`${baseUrl}/api/clear-all`, {
      method: 'DELETE',
    });

    if (!deleteDbResponse.ok) {
      throw new Error(`Delete failed: ${deleteDbResponse.status}`);
    }

    const deleteDbData = await deleteDbResponse.json();
    console.log(`   ✓ Deleted files: ${deleteDbData.filesDeleted.join(', ')}`);
    console.log(`   ✓ Message: ${deleteDbData.message}`);
    */

    console.log('\n✅ Clear data functionality tests completed!');
    console.log('\nNext steps:');
    console.log('  • Visit http://localhost:3000/settings to test the UI');
    console.log('  • Import new data at http://localhost:3000/imports');
    console.log('  • Test clearing from the Settings page\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nMake sure:');
    console.error('  1. Development server is running (bun dev)');
    console.error('  2. Visit http://localhost:3000 first\n');
  }
}

// Run the test
testClearFunctionality();
