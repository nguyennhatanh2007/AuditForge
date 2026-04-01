const axios = require('axios');

const ITOP_URL = 'http://192.168.23.131/itop';
const ITOP_USER = 'admin';
const ITOP_PASSWORD = 'baoviet@123';
const ITOP_TOKEN = 'MUx3RTJrdVo3bnBlT0xpSTZRV2xRYk82eGR6UXBGMWdUZldBZU9qWDZFNkg2ZTVHcHZ2K2w5dEllQXlPcGxUb2J6OFIyYjBjUVJPUTVxeXRlKzBLRGc9PQ==';

async function testItopAPI() {
  try {
    console.log('🔍 Testing iTOP API Data Retrieval:\n');
    
    const classes = ['Server', 'VirtualMachine', 'LogicalVolume', 'ApplicationInstance', 'CI'];
    
    for (const className of classes) {
      console.log(`\n📊 Class: ${className}`);
      console.log('─'.repeat(60));
      
      try {
        const query = `SELECT * FROM ${className}`;
        
        const response = await axios.post(
          `${ITOP_URL}/services/rest.php`,
          new URLSearchParams({
            operation: 'core/get',
            class: className,
            key: 'SELECT *',
            auth_user: ITOP_USER,
            auth_pwd: ITOP_PASSWORD,
            output_fields: '*'
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        const data = response.data;
        console.log(`Status: ${data.code}`);
        
        if (data.objects) {
          const count = Object.keys(data.objects).length;
          console.log(`Records found: ${count}`);
          
          if (count > 0) {
            console.log(`\nFirst 3 records:`);
            Object.entries(data.objects)
              .slice(0, 3)
              .forEach(([id, obj]) => {
                console.log(`  ID: ${id}`);
                console.log(`  Data:`, JSON.stringify(obj.fields, null, 4).substring(0, 300) + '...');
              });
          }
        } else if (data.message) {
          console.log(`Message: ${data.message}`);
        }
        
      } catch (error) {
        console.error(`Error fetching ${className}:`, error.response?.data || error.message);
      }
    }
    
    // Also check the raw API response format
    console.log('\n\n🔬 Checking API Response Structure:');
    console.log('─'.repeat(60));
    
    try {
      const response = await axios.post(
        `${ITOP_URL}/services/rest.php`,
        new URLSearchParams({
          operation: 'core/get',
          class: 'Server',
          key: 'SELECT *',
          auth_user: ITOP_USER,
          auth_pwd: ITOP_PASSWORD,
          output_fields: '*'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('Full Response:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('Error:', error.message);
    }
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

testItopAPI();
