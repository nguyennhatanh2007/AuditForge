require('dotenv').config();

console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);

const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    console.log('✓ Connected to MySQL');
    
    // Check if database exists
    const [databases] = await connection.execute("SHOW DATABASES LIKE 'auditforge'");
    console.log('Database exists:', databases.length > 0);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection();
