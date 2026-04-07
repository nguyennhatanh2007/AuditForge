const mysql = require('mysql2/promise');

const config = {
  host: '192.168.23.131',
  port: 3306,
  user: 'root',
  password: 'Baoviet123!',
  database: 'itopbvh'
};

async function checkDatabase() {
  let connection;
  try {
    console.log('🔌 Connecting to iTOP Database...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log('');

    connection = await mysql.createConnection(config);
    console.log('✅ Connected successfully!\n');

    // List all tables
    console.log('📊 Available Tables:');
    const [tables] = await connection.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?", [config.database]);
    console.log(`   Total tables: ${tables.length}\n`);
    tables.forEach(t => console.log(`   - ${t.TABLE_NAME}`));
    console.log('');

    // Check key tables
    const checkTables = [
      'view_Server',
      'view_VirtualMachine', 
      'view_LogicalVolume',
      'view_ApplicationInstance',
      'view_NetworkInterface',
      'object',
      'functionalci',
      'physicaldevice'
    ];

    for (const tableName of checkTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = rows[0].count;
        console.log(`📈 ${tableName}: ${count} records`);
        
        if (count > 0) {
          const [sample] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
          console.log(`   Sample: ${JSON.stringify(sample[0], null, 2).substring(0, 200)}...\n`);
        }
      } catch (e) {
        // Table doesn't exist
      }
    }

    // Check object table structure
    console.log('\n🔍 Checking object table for different classes:');
    try {
      const [objects] = await connection.execute(`
        SELECT DISTINCT class_name, COUNT(*) as count 
        FROM object 
        GROUP BY class_name 
        ORDER BY count DESC 
        LIMIT 20
      `);
      
      console.log('   Class Distribution:');
      objects.forEach(obj => {
        console.log(`   - ${obj.class_name}: ${obj.count}`);
      });
    } catch (e) {
      console.error('   Error reading object table:', e.message);
    }

    // Check for specific classes
    console.log('\n🎯 Searching for specific classes:');
    const classes = ['Server', 'VirtualMachine', 'LogicalVolume', 'ApplicationInstance', 'CI'];
    for (const className of classes) {
      try {
        const [result] = await connection.execute(`
          SELECT COUNT(*) as count FROM object WHERE class_name = ?
        `, [className]);
        console.log(`   ${className}: ${result[0].count} objects`);
      } catch (e) {
        console.log(`   ${className}: Error - ${e.message}`);
      }
    }

    await connection.end();
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
