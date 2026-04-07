const mysql = require('mysql2/promise');

async function checkDatabase() {
  const config = {
    host: '192.168.23.131',
    port: 3306,
    user: 'root',
    password: 'Baoviet123!',
    database: 'itopbvh',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  console.log('🔌 Connecting to iTOP Database');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Database: ${config.database}`);
  console.log('');

  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connected successfully!\n');

    // Show tables
    console.log('📊 Database Tables:');
    const [tables] = await connection.query(`
      SELECT TABLE_NAME FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `, [config.database]);
    
    console.log(`Total tables: ${tables.length}\n`);
    tables.forEach((t, idx) => {
      if (idx < 30) console.log(`   ${idx + 1}. ${t.TABLE_NAME}`);
    });
    if (tables.length > 30) console.log(`   ... and ${tables.length - 30} more`);

    // Check for key iTOP tables
    console.log('\n🎯 Key iTOP Tables Content:\n');
    
    const keyTables = [
      { name: 'object', label: 'All Objects' },
      { name: 'functionci', label: 'Functional CIs' },
      { name: 'physicaldevice', label: 'Physical Devices' },
      { name: 'server', label: 'Servers' },
      { name: 'virtualmachine', label: 'Virtual Machines' },
      { name: 'logicalvolume', label: 'Logical Volumes' },
      { name: 'networkinterface', label: 'Network Interfaces' },
    ];

    for (const table of keyTables) {
      try {
        const [countResult] = await connection.query(
          `SELECT COUNT(*) as cnt FROM ${table.name}`
        );
        const count = countResult[0].cnt;
        console.log(`${table.label} (${table.name}): ${count} records`);
        
        // Show columns
        const [columns] = await connection.query(`
          SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = ? AND TABLE_SCHEMA = ?
        `, [table.name, config.database]);
        
        if (columns && columns.length > 0) {
          console.log(`   Columns: ${columns.map(c => c.COLUMN_NAME).slice(0, 5).join(', ')}${columns.length > 5 ? `, (+${columns.length - 5} more)` : ''}`);
        }
        
        // Show sample data if exists
        if (count > 0) {
          const [sample] = await connection.query(
            `SELECT * FROM ${table.name} LIMIT 2`
          );
          
          console.log(`   Sample data:`);
          sample.forEach((row, idx) => {
            // Get first few fields for display
            const fields = Object.entries(row).slice(0, 3);
            const fieldStr = fields.map(([k, v]) => `${k}=${v}`).join(', ');
            console.log(`     Row ${idx + 1}: ${fieldStr}${Object.keys(row).length > 3 ? ', ...' : ''}`);
          });
        }
        console.log('');
      } catch (err) {
        console.log(`${table.label}: Table not found or error\n`);
      }
    }

    // Check object class distribution
    console.log('\n📈 Object Class Distribution:');
    try {
      const [classes] = await connection.query(`
        SELECT class_name, COUNT(*) as count 
        FROM object 
        GROUP BY class_name 
        ORDER BY count DESC 
        LIMIT 20
      `);
      
      classes.forEach(c => {
        console.log(`   ${c.class_name}: ${c.count}`);
      });
    } catch (err) {
      console.log('   Unable to query object classes');
    }

    await connection.end();
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('   Connection lost during query');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Access denied - check credentials');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   Database does not exist');
    }
  }
}

checkDatabase();
