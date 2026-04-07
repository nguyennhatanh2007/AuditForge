const axios = require('axios');
const https = require('https');

async function checkItopInstallation() {
  const ITOP_BASE = 'http://192.168.23.131/itop';
  
  console.log('🔍 Checking iTOP Installation Details\n');
  
  // Check if iTOP login page is accessible
  try {
    console.log('1️⃣ Accessing iTOP Login Page');
    const response = await axios.get(ITOP_BASE, { timeout: 5000 });
    console.log('   ✅ iTOP login page accessible');
    
    // Extract title to verify version
    const titleMatch = response.data.match(/<title>([^<]+)<\/title>/);
    if (titleMatch) {
      console.log(`   Title: ${titleMatch[1]}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Try to access REST endpoint with different methods
  console.log('\n2️⃣ Attempting REST API with different payload formats');

  try {
    console.log('   Trying: POST /services/rest.php with URLEncoded data');
    const response = await axios.post(
      `${ITOP_BASE}/services/rest.php`,
      'version=1.3&auth_user=admin&auth_pwd=baoviet@123&operation=core/get&class=Server&key=SELECT%20*&output_fields=*',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 5000,
        validateStatus: () => true  // Accept any status
      }
    );
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response Type: ${typeof response.data}`);
    
    if (typeof response.data === 'string') {
      console.log(`   Response Preview: ${response.data.substring(0, 200)}`);
    } else {
      console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Check if REST API is available under different paths
  console.log('\n3️⃣ Checking alternative REST API paths');
  
  const paths = [
    '/web/services/rest.php',
    '/services/rest.php',
    '/env-production/services/rest.php',
    '/pages/api.php'
  ];

  for (const path of paths) {
    try {
      const response = await axios.post(
        `${ITOP_BASE}${path}`,
        'version=1.3&auth_user=admin&auth_pwd=baoviet@123&operation=core/get&class=Server&key=SELECT%20*',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 3000,
          validateStatus: () => true
        }
      );
      
      if (response.status !== 404) {
        console.log(`   ✅ Found at ${path} - Status: ${response.status}`);
        if (response.data) {
          console.log(`      Response: ${JSON.stringify(response.data).substring(0, 150)}...`);
        }
      }
    } catch (error) {
      // Ignore individual errors, we're just checking
    }
  }

  // Get the actual file structure via HTTP if possible
  console.log('\n4️⃣ Checking web root directory');
  
  try {
    console.log('   Accessing: http://192.168.23.131/');
    const response = await axios.get('http://192.168.23.131/', { 
      timeout: 3000,
      maxRedirects: 2
    });
    
    // Check for directory listing or index
    if (response.data.includes('Index of') || response.data.includes('Directory')) {
      console.log('   📁 Directory listing available');
    }
    
    // Look for links to itop or other services
    const links = response.data.match(/href="([^"]+)"/g) || [];
    if (links.length > 0) {
      console.log('   Found links:');
      links.slice(0, 5).forEach(link => console.log(`     - ${link}`));
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

checkItopInstallation();
