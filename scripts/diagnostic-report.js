const axios = require('axios');

async function generateDiagnosticReport() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  iTOP DATA VALIDATION DIAGNOSTIC REPORT                       ║');
  console.log('║                         Generated: April 1, 2026 11:55 AM                      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  // Check HTTP connectivity
  console.log('📡 CONNECTIVITY STATUS:');
  console.log('─'.repeat(80));
  
  try {
    const httpTest = await axios.get('http://192.168.23.131/itop', { timeout: 5000 });
    console.log('✅ HTTP to iTOP at http://192.168.23.131/itop');
    console.log('   - Status: 200 OK');
    console.log('   - Service: iTop CMDB (login page accessible)');
  } catch (e) {
    console.log('❌ HTTP to iTOP failed');
  }

  console.log('\n❌ MySQL Database Connection:');
  console.log('   - Host: 192.168.23.131:3306');
  console.log('   - Status: TCP port 3306 UNREACHABLE');
  console.log('   - Reason: Connection timeout or firewall blocking');
  console.log('   - Impact: Cannot verify data directly in database\n');

  // Test REST API
  console.log('🔌 iTOP REST API STATUS:');
  console.log('─'.repeat(80));
  
  try {
    const apiTest = await axios.post(
      'http://192.168.23.131/itop/services/rest.php',
      'version=1.3&auth_user=admin&auth_pwd=baoviet@123&operation=core/get&class=Server&key=SELECT%20*',
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000,
        validateStatus: () => true
      }
    );
    
    console.log(`Status: HTTP ${apiTest.status}`);
    if (apiTest.status === 404) {
      console.log('⚠️  REST API Endpoint: NOT FOUND (404)');
      console.log('   Path: /itop/services/rest.php');
      console.log('   Issue: The REST API endpoint at /services/rest.php is not accessible');
      console.log('   Possible Causes:');
      console.log('   1. REST API not installed/enabled in iTOP');
      console.log('   2. Wrong URL path for REST API');
      console.log('   3. iTOP configuration issue\n');
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }

  // Analyze test results
  console.log('📊 TEST RESULTS ANALYSIS:');
  console.log('─'.repeat(80));
  console.log('\nPrevious Unit Tests Status: ✅ 12/12 PASSED');
  console.log('\nHowever, upon investigation:');
  console.log('1. ✅ Tests passed because they only verify that responses are arrays');
  console.log('2. ❌ Actual API returns HTTP 404 (endpoint not found)');
  console.log('3. ⚠️  Service handles 404 as empty arrays (not actual data)\n');

  console.log('DATA RETURNED BY TESTS:');
  console.log('─'.repeat(80));
  const testResults = {
    'VirtualMachine': 0,
    'Server': 0,
    'LogicalVolume': 0,
    'ApplicationInstance': 0,
    'CI': 0
  };

  for (const [key, value] of Object.entries(testResults)) {
    console.log(`   ${key}: ${value} records (from failing API endpoint)`);
  }

  console.log('\n❌ ROOT CAUSE: API ENDPOINT MISCONFIGURATION');
  console.log('─'.repeat(80));
  console.log(`
The iTOP REST API endpoint might not be available at:
  → http://192.168.23.131/itop/services/rest.php

Possible Solutions:
1. Check iTOP Installation:
   - Verify REST API is installed and enabled
   - Check if REST API requires additional setup
   - Review iTOP error logs at /itop/log/ or /var/log/

2. Find Correct Endpoint:
   - Access iTOP web interface: http://192.168.23.131/itop
   - Navigate to Administration → System Tools → API
   - Verify REST API endpoint and documentation
   - May be at different path like /env-production/services/rest.php

3. Database Direct Access:
   - Fix MySQL connectivity (currently blocked)
   - Alternative: port forwarding via SSH tunnel
   - SSH to iTOP host and run: mysql -u root -p itopbvh

4. Authentication Method:
   - Verify admin:baoviet@123 credentials work in iTOP UI
   - Test with PersonalToken instead if available
   - Check if REST API requires specific permissions
`);

  console.log('📝 RECOMMENDATIONS:');
  console.log('─'.repeat(80));
  console.log(`
1. IMMEDIATE ACTION NEEDED:
   - Verify REST API is configured in iTOP
   - Check actual endpoint path in iTOP documentation/UI
   - Confirm firewall allows access to selected port

2. TESTING OPTIONS:
   Option A: Update service with correct endpoint
     - Find correct REST API path from iTOP admin panel
     - Update ItopService.ts baseURL if different
     - Rerun tests with valid endpoint

   Option B: Use alternative authentication
     - Try accessing via web interface API if REST not available
     - Use iTOP's internal API/SDK instead
     - Query database directly if REST unavailable

   Option C: Database direct access
     - Enable MySQL port access (currently blocked)
     - Or use SSH tunnel for secure MySQL connection
     - Query objects table directly for verification

3. VALIDATION:
   - Until REST API is working, data retrieval is not functional
   - Tests need actual data to be meaningful
   - Current "passing" tests are false positives (verifying empty arrays)
`);

  console.log('\n✅ STATUS SUMMARY:');
  console.log('─'.repeat(80));
  console.log('HTTP Access to iTOP:        ✅ Working');
  console.log('REST API Endpoint:          ❌ Not Found (404)');
  console.log('MySQL Database Direct:      ❌ Port unreachable');
  console.log('Unit Tests Passing:         ⚠️  False positive (returning empty arrays)');
  console.log('Data Verification Status:   ❌ UNABLE TO COMPLETE - API not accessible\n');

  console.log('═'.repeat(80));
}

generateDiagnosticReport().catch(console.error);
