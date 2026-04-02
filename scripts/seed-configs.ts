import { getDb } from '@/lib/db';
import { encryptSecret } from '@/lib/crypto';

async function seedConfigurations() {
  const db = getDb();
  if (!db) {
    console.error('Database connection failed');
    return;
  }

  try {
    // Check if configurations already exist
    const existing = await db('configurations').count('* as count').first();
    if (existing && existing.count > 0) {
      console.log(`Found ${existing.count} existing configurations. Updating them...`);
    }

    // Clear existing configurations
    await db('configurations').del();

    // Add iTOP (Primary Source)
    const itopPassword = encryptSecret('baoviet@123');
    await db('configurations').insert({
      system_type: 'itop',
      name: 'iTOP CMDB (Production)',
      url: 'http://192.168.23.131/itop',
      username: 'admin',
      encrypted_password: itopPassword,
      port: null,
      api_path: '/webservices/rest.php',
      last_test_status: null,
      last_test_code: null,
      last_test_message: null,
      enabled: true,
      last_checked_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('✅ Added iTOP configuration');

    // Add ESXi (Reference Source)
    const esxiPassword = encryptSecret('baoviet@123');
    await db('configurations').insert({
      system_type: 'vcenter',
      name: 'ESXi Host (Reference)',
      url: 'https://192.168.23.130',
      username: 'root',
      encrypted_password: esxiPassword,
      port: 443,
      api_path: '/api',
      last_test_status: null,
      last_test_code: null,
      last_test_message: null,
      enabled: true,
      last_checked_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    console.log('✅ Added ESXi configuration');

    const configs = await db('configurations').select('*');
    console.log(`\n📊 Total configurations: ${configs.length}`);
    configs.forEach((config: any) => {
      console.log(`  - ${config.system_type.toUpperCase()}: ${config.name}`);
    });

    console.log('\n✅ Database seeding complete!');
  } catch (error) {
    console.error('Error seeding configurations:', error);
  }
}

// Execute
seedConfigurations().then(() => process.exit(0));
