const axios = require('axios');

async function findItopEndpoint() {
  const baseUrls = [
    'http://192.168.23.131',
    'http://192.168.23.131/itop',
    'http://192.168.23.131/iTop',
    'http://192.168.23.131:80',
  ];

  const endpoints = [
    '/services/rest.php',
    '/rest/v1.3/core/get',
    '/api/rest.php',
    'services/rest.php',
  ];

  console.log('🔍 Searching for iTOP REST API endpoint...\n');

  for (const baseUrl of baseUrls) {
    for (const endpoint of endpoints) {
      const url = baseUrl + endpoint;
      try {
        console.log(`Testing: ${url}`);
        const response = await axios.head(url, { timeout: 2000 });
        console.log(`  ✅ Found! Status: ${response.status}`);
      } catch (error) {
        if (error.response) {
          console.log(`  ❌ Status ${error.response.status}`);
        } else {
          console.log(`  ⏱ Timeout/Error`);
        }
      }
    }
  }

  // Also check if we can access the main iTOP page
  console.log('\n📄 Checking main iTOP pages:\n');
  
  const pages = [
    'http://192.168.23.131',
    'http://192.168.23.131/',
    'http://192.168.23.131/index.php',
    'http://192.168.23.131/itop',
    'http://192.168.23.131/itop/',
  ];

  for (const page of pages) {
    try {
      const response = await axios.get(page, { 
        timeout: 3000,
        maxRedirects: 3
      });
      console.log(`✅ ${page}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Title/First 200 chars: ${response.data.substring(0, 200)}\n`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${page} - Status: ${error.response.status}\n`);
      } else {
        console.log(`❌ ${page} - ${error.message}\n`);
      }
    }
  }
}

findItopEndpoint();
