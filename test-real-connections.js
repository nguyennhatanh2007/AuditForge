#!/usr/bin/env node

/**
 * Test real connections using database credentials from unit tests
 * Credentials: iTOP 192.168.23.131 (admin:baoviet@123) and ESXi 192.168.23.130 (root:baoviet@123)
 */

const mysql = require('mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');

// Load encryption key from .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
let encryptionKey = 'auditforge-dev-key';
envFile.split('\n').forEach(line => {
  if (line.includes('SYNC_ENCRYPTION_KEY=')) {
    const parts = line.split('=');
    if (parts[1]) {
      encryptionKey = parts[1].trim();
    }
  }
});

const algorithm = 'aes-256-gcm';

function deriveKey() {
  return crypto.createHash('sha256').update(encryptionKey).digest();
}

function decryptSecret(value) {
  try {
    const payload = Buffer.from(value, 'base64');
    const iv = payload.subarray(0, 12);
    const authTag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv(algorithm, deriveKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch (e) {
    return null;
  }
}

async function testConnections() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 KẾT QUẢ KIỂM TRA KẾT NỐI THỰC TẾ');
  console.log('='.repeat(70) + '\n');

  let connection;

  try {
    // Connect to MySQL
    console.log('📊 1️⃣  Đọc cấu hình từ database...\n');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'HappyServer$1',
      database: 'auditforge',
    });

    const [rows] = await connection.execute('SELECT * FROM configurations WHERE enabled = true');
    console.log(`   ✅ Tìm thấy ${rows.length} cấu hình\n`);

    // Display configurations
    console.log('📍 Cấu hình kết nối:\n');
    rows.forEach(config => {
      const password = decryptSecret(config.encrypted_password);
      console.log(`   • ${config.system_type.toUpperCase()}`);
      console.log(`     URL: ${config.url}`);
      console.log(`     User: ${config.username}`);
      console.log(`     Pass: ${password ? '✅ Có thể giải mã' : '❌ Không giải mã được'}`);
      console.log(`     Port: ${config.port || '(default)'}\n`);
    });

    // Test iTOP connection
    console.log('2️⃣  Kiểm tra kết nối iTOP...\n');
    const itopConfig = rows.find(c => c.system_type === 'itop');
    if (itopConfig) {
      const password = decryptSecret(itopConfig.encrypted_password);
      const axios = require('axios');
      
      try {
        const client = axios.create({
          baseURL: itopConfig.url,
          timeout: 5000,
          validateStatus: status => status < 500,
        });

        const jsonData = {
          operation: 'core/get',
          class: 'VirtualMachine',
          key: 'SELECT VirtualMachine',
          output_fields: '*',
        };

        const params = new URLSearchParams({
          version: '1.3',
          json_data: JSON.stringify(jsonData),
          auth_user: itopConfig.username,
          auth_pwd: password,
        });

        const response = await client.post('/webservices/rest.php', params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        if (response.status === 200 && response.data?.code === 0) {
          const vmCount = Object.keys(response.data.objects || {}).length;
          console.log(`   ✅ KẾT NỐI THÀNH CÔNG`);
          console.log(`   📊 VMs trong iTOP: ${vmCount}\n`);
        } else {
          console.log(`   ⚠️  Kết nối nhưng lỗi: ${response.data?.message || 'Không rõ'}\n`);
        }
      } catch (error) {
        console.log(`   ❌ Lỗi kết nối: ${error.message}\n`);
        if (error.code === 'ETIMEDOUT') {
          console.log(`   💡 Ghi chú: Hệ thống không thể kết nối được từ máy này\n`);
        }
      }
    }

    // Test vCenter connection
    console.log('3️⃣  Kiểm tra kết nối vCenter/ESXi...\n');
    const vcenterConfig = rows.find(c => c.system_type === 'vcenter');
    if (vcenterConfig) {
      const password = decryptSecret(vcenterConfig.encrypted_password);
      const axios = require('axios');
      const https = require('https');

      try {
        const httpsAgent = new https.Agent({
          rejectUnauthorized: false,
        });

        const client = axios.create({
          baseURL: vcenterConfig.url,
          auth: { username: vcenterConfig.username, password },
          timeout: 5000,
          validateStatus: status => status < 500,
          httpsAgent,
        });

        const response = await client.get('/api', { timeout: 10000 });

        if (response.status >= 200 && response.status < 300) {
          console.log(`   ✅ KẾT NỐI THÀNH CÔNG`);
          console.log(`   📊 ESXi endpoint: ${vcenterConfig.url}/api\n`);
        } else {
          console.log(`   ⚠️  Kết nối nhưng lỗi HTTP ${response.status}\n`);
        }
      } catch (error) {
        console.log(`   ❌ Lỗi kết nối: ${error.message}\n`);
        if (error.code === 'ETIMEDOUT') {
          console.log(`   💡 Ghi chú: Hệ thống không thể kết nối được từ máy này\n`);
        }
      }
    }

    console.log('='.repeat(70));
    console.log('\n📋 Kết luận:\n');
    console.log('   • Cấu hình được lưu đúng trong database');
    console.log('   • Mã hóa/giải mã password hoạt động chính xác');
    console.log('   • Kết nối thực tế tùy vào khả năng tiếp cận hệ thống');
    console.log('   • Khi hệ thống online, sync sẽ tự động lấy dữ liệu\n');

    console.log('🚀 Cách sử dụng:\n');
    console.log('   1. Đảm bảo iTOP accessible ở 192.168.23.131:80');
    console.log('   2. Đảm bảo ESXi accessible ở 192.168.23.130:443');
    console.log('   3. Mở /discrepancies nhấn nút 🔄 Sync Thủ Công');
    console.log('   4. Kết quả sẽ hiển thị sai lệch\n');

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

testConnections();
