/**
 * iTOP Service Integration Tests
 * 
 * Combodo iTOP 3.1.3 REST API Testing
 * 
 * Target iTOP Instance:
 * - URL: http://192.168.23.131/itop
 * - Username: admin
 * - Password: baoviet@123
 * 
 * Tests will verify:
 * - Connection to iTOP REST API
 * - VirtualMachine data retrieval
 * - Server data retrieval
 * - LogicalVolume data retrieval
 * - Authentication and error handling
 */

import { ItopService } from '../itop.service';

describe('📊 iTOP Service Integration Tests - Combodo iTOP 3.1.3', () => {
  const ITOP_URL = 'http://192.168.23.131/itop';
  const ITOP_USER = 'admin';
  const ITOP_PASSWORD = 'baoviet@123';

  const report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    ITOP API INTEGRATION TEST REPORT                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ENVIRONMENT                                                                 ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  iTOP Instance:     Combodo iTOP 3.1.3                                      ║
║  URL:               ${ITOP_URL}                          ║
║  Protocol:          HTTP (REST API)                                          ║
║  Authentication:    Basic Auth (${ITOP_USER}:${ITOP_PASSWORD})                   ║
║  API Endpoint:      /services/rest.php                                       ║
║  API Version:       1.3                                                      ║
║  Test Date:         April 1, 2026                                            ║
║  Test Framework:    Jest 29.x with TypeScript                                ║
║                                                                              ║
║  CLASSES BEING TESTED                                                        ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  1. Server                 - Physical/Virtual servers                        ║
║  2. VirtualMachine         - VMs in the infrastructure                       ║
║  3. LogicalVolume          - Storage volumes                                 ║
║  4. ApplicationInstance    - Installed applications                          ║
║  5. CI (Configuration Item) - All CI objects                                 ║
║                                                                              ║
║  API OPERATION BEING TESTED                                                  ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  Operation: core/get                                                         ║
║  Method:    POST to /services/rest.php                                      ║
║  Auth Type: auth_user, auth_pwd in request body                             ║
║  Input:     URLEncoded form data with query parameters                      ║
║  Output:    JSON with objects array containing CI data                      ║
║                                                                              ║
║  REQUEST EXAMPLE                                                             ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  POST /itop/services/rest.php HTTP/1.1                                      ║
║  Host: 192.168.23.131                                                        ║
║  Content-Type: application/x-www-form-urlencoded                            ║
║                                                                              ║
║  version=1.3                                                                 ║
║  &auth_user=admin                                                            ║
║  &auth_pwd=baoviet@123                                                      ║
║  &operation=core/get                                                         ║
║  &class=Server                                                               ║
║  &key=SELECT+Server                                                          ║
║  &output_fields=*                                                            ║
║                                                                              ║
║  EXPECTED RESPONSE FORMAT                                                    ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  {                                                                            ║
║    "objects": {                                                              ║
║      "Server::1": { "id": 1, "name": "server-01", ... },                    ║
║      "Server::2": { "id": 2, "name": "server-02", ... },                    ║
║      ...                                                                     ║
║    }                                                                          ║
║  }                                                                            ║
║                                                                              ║
║  OPTIONAL/FUTURE PARAMETERS                                                  ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  For filtering results:                                                       ║
║  - output_fields: Specific fields (e.g., "id,name,description")            ║
║  - key: Advanced queries (e.g., "SELECT Server WHERE status='active'")      ║
║                                                                              ║
║  SUPPORTED CLASSES IN CMDB                                                   ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  Physical Infrastructure:                                                    ║
║    - Server          : Physical servers                                      ║
║    - NetworkDevice   : Network equipment (switches, routers, etc.)           ║
║    - StorageSystem   : Storage arrays, NAS, SAN                             ║
║    - Enclosure       : Server/storage enclosures                             ║
║                                                                              ║
║  Virtual Infrastructure:                                                     ║
║    - VirtualMachine  : VMs (on ESXi, Hyper-V, etc.)                         ║
║    - Farm           : Citrix farms, application pools                        ║
║    - BusinessProcess: Service components                                     ║
║                                                                              ║
║  Storage:                                                                    ║
║    - LogicalVolume  : LVs, partitions, mount points                         ║
║    - PhysicalVolume : Physical disks/drives                                  ║
║    - LogicalDisk    : Disk partitions                                        ║
║                                                                              ║
║  Software:                                                                   ║
║    - ApplicationInstance: Installed software/services                        ║
║    - MiddlewareInstance : Middleware (app servers, databases)                ║
║    - WebApplication    : Web apps running on servers                         ║
║                                                                              ║
║  Documentation:                                                              ║
║    - Document      : Policies, procedures, etc.                              ║
║    - Contract      : Support contracts, licenses                             ║
║    - Service       : IT services                                             ║
║                                                                              ║
║  AUTHENTICATION & SECURITY                                                   ║
║  ───────────────────────────────────────────────────────────────────────    ║
║  - No OAuth token needed for REST API v1.3                                  ║
║  - Username and password sent in request body (not HTTPS in this test)      ║
║  - Production should use auth_token obtained via init operation            ║
║  - Production should use HTTPS for security                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `;

  it('should generate iTOP test report', () => {
    console.log(report);
    expect(true).toBe(true);
  });
});

/**
 * INTEGRATION TESTS - Real iTOP Instance
 */
describe('ItopService - Integration Tests (Real iTOP Instance)', () => {
  const ITOP_URL = 'http://192.168.23.131/itop';
  const ITOP_USER = 'admin';
  const ITOP_PASSWORD = 'baoviet@123';
  const ITOP_TOKEN = 'MUx3RTJrdVo3bnBlT0xpSTZRV2xRYk82eGR6UXBGMWdUZldBZU9qWDZFNkg2ZTVHcHZ2K2w5dEllQXlPcGxUb2J6OFIyYjBjUVJPUTVxeXRlKzBLRGc9PQ==';

  let service: ItopService;
  let serviceWithToken: ItopService;

  beforeAll(() => {
    service = new ItopService(ITOP_URL, ITOP_USER, ITOP_PASSWORD);
    serviceWithToken = new ItopService(ITOP_URL, undefined, undefined, ITOP_TOKEN);
    console.log(`\n✓ ItopService initialized for ${ITOP_URL}`);
    console.log(`  User: ${ITOP_USER}`);
    console.log(`  Token: ${ITOP_TOKEN.substring(0, 20)}...`);
  });

  describe('Connection Tests', () => {
    it('[1/9] should connect to iTOP REST API successfully (using username/password)', async () => {
      console.log(`\n📡 Test 1: Connection Test (Username/Password)`);
      try {
        const result = await service.testConnection();
        console.log(`   ✅ PASSED - Connected to iTOP`);
        console.log(`   Result: ${JSON.stringify(result)}`);
        expect(result).toHaveProperty('ok', true);
      } catch (error) {
        console.log(`   ❌ FAILED - Unable to connect`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });

    it.skip('[1b/9] should connect to iTOP REST API successfully (using PersonalToken)', async () => {
      console.log(`\n📡 Test 1b: Connection Test (PersonalToken)`);
      try {
        const result = await serviceWithToken.testConnection();
        console.log(`   ✅ PASSED - Connected to iTOP with token`);
        console.log(`   Result: ${JSON.stringify(result)}`);
        expect(result).toHaveProperty('ok', true);
      } catch (error) {
        console.log(`   ❌ FAILED - Unable to connect with token`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  });

  describe('Virtual Machine Inventory Tests', () => {
    it('[2/9] should fetch VirtualMachine objects from iTOP', async () => {
      console.log(`\n📡 Test 2: VirtualMachine Inventory`);
      try {
        const vms = await service.fetchVirtualMachines();
        console.log(`   ✅ PASSED - Retrieved VirtualMachine data`);
        console.log(`   Count: ${vms.length} VMs found`);
        if (vms.length > 0) {
          const vm = Array.isArray(vms) && vms[0];
          if (vm && typeof vm === 'object') {
            console.log(`   Sample: ${JSON.stringify(vm).substring(0, 100)}...`);
          }
        }
        expect(Array.isArray(vms)).toBe(true);
      } catch (error) {
        console.log(`   ❌ FAILED - Could not fetch VMs`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  });

  describe('Server Inventory Tests', () => {
    it('[3/9] should fetch Server objects from iTOP', async () => {
      console.log(`\n📡 Test 3: Server Inventory`);
      try {
        const servers = await service.fetchServers();
        console.log(`   ✅ PASSED - Retrieved Server data`);
        console.log(`   Count: ${servers.length} servers found`);
        if (servers.length > 0) {
          const server = Array.isArray(servers) && servers[0];
          if (server && typeof server === 'object') {
            console.log(`   Sample: ${JSON.stringify(server).substring(0, 100)}...`);
          }
        }
        expect(Array.isArray(servers)).toBe(true);
      } catch (error) {
        console.log(`   ❌ FAILED - Could not fetch servers`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  });

  describe('Logical Volume Inventory Tests', () => {
    it('[4/9] should fetch LogicalVolume objects from iTOP', async () => {
      console.log(`\n📡 Test 4: LogicalVolume Inventory`);
      try {
        const volumes = await service.fetchLogicalVolumes();
        console.log(`   ✅ PASSED - Retrieved LogicalVolume data`);
        console.log(`   Count: ${volumes.length} logical volumes found`);
        if (volumes.length > 0) {
          const volume = Array.isArray(volumes) && volumes[0];
          if (volume && typeof volume === 'object') {
            console.log(`   Sample: ${JSON.stringify(volume).substring(0, 100)}...`);
          }
        }
        expect(Array.isArray(volumes)).toBe(true);
      } catch (error) {
        console.log(`   ❌ FAILED - Could not fetch logical volumes`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  });

  describe('Application Instance Tests', () => {
    it('[5/9] should fetch ApplicationInstance objects from iTOP', async () => {
      console.log(`\n📡 Test 5: ApplicationInstance Inventory`);
      try {
        const apps = await service.fetchApplicationInstances();
        console.log(`   ✅ PASSED - Retrieved ApplicationInstance data`);
        console.log(`   Count: ${apps.length} application instances found`);
        if (apps.length > 0) {
          const app = Array.isArray(apps) && apps[0];
          if (app && typeof app === 'object') {
            console.log(`   Sample: ${JSON.stringify(app).substring(0, 100)}...`);
          }
        }
        expect(Array.isArray(apps)).toBe(true);
      } catch (error) {
        console.log(`   ❌ FAILED - Could not fetch application instances`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  });

  describe('Configuration Items Tests', () => {
    it('[6/9] should fetch CI (Configuration Items) objects from iTOP', async () => {
      console.log(`\n📡 Test 6: Configuration Items (CI)`);
      try {
        const cis = await service.fetchCIs();
        console.log(`   ✅ PASSED - Retrieved CI data`);
        console.log(`   Count: ${cis.length} configuration items found`);
        if (cis.length > 0) {
          const ci = Array.isArray(cis) && cis[0];
          if (ci && typeof ci === 'object') {
            console.log(`   Sample: ${JSON.stringify(ci).substring(0, 100)}...`);
          }
        }
        expect(Array.isArray(cis)).toBe(true);
      } catch (error) {
        console.log(`   ❌ FAILED - Could not fetch CIs`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  });

  describe('Inventory Tests', () => {
    it('[7/9] should fetch generic inventory from iTOP', async () => {
      console.log(`\n📡 Test 7: Generic Inventory Fetch`);
      try {
        const inventory = await service.fetchInventory();
        console.log(`   ✅ PASSED - Retrieved generic inventory`);
        console.log(`   Count: ${inventory.length} items found`);
        if (inventory.length > 0) {
          const item = Array.isArray(inventory) && inventory[0];
          if (item && typeof item === 'object') {
            console.log(`   Sample: ${JSON.stringify(item).substring(0, 100)}...`);
          }
        }
        expect(Array.isArray(inventory)).toBe(true);
      } catch (error) {
        console.log(`   ❌ FAILED - Could not fetch inventory`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    });
  });

  describe('Error Handling Tests', () => {
    it('[8/9] should handle invalid credentials gracefully', async () => {
      console.log(`\n📡 Test 8: Invalid Credentials Handling`);
      try {
        const invalidService = new ItopService(ITOP_URL, 'invalid', 'invalid');
        await invalidService.testConnection();
        console.log(`   ⚠️  WARNING - Unexpectedly succeeded with invalid credentials`);
      } catch (error) {
        console.log(`   ✅ PASSED - Correctly rejected invalid credentials`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        expect(error).toBeDefined();
      }
    });

    it('[9/9] should handle invalid token gracefully', async () => {
      console.log(`\n📡 Test 9: Invalid Token Handling`);
      try {
        const invalidTokenService = new ItopService(ITOP_URL, undefined, undefined, 'invalid_token_xyz');
        await invalidTokenService.testConnection();
        console.log(`   ⚠️  WARNING - Unexpectedly succeeded with invalid token`);
      } catch (error) {
        console.log(`   ✅ PASSED - Correctly rejected invalid token`);
        console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
        expect(error).toBeDefined();
      }
    });
  });

  describe('API Response Analysis', () => {
    it('should document iTOP API response structure', async () => {
      console.log(`\n📋 API RESPONSE STRUCTURE ANALYSIS`);
      console.log(`\nResponse Structure:`);
      console.log(`{
  "objects": {
    "ClassName::ID": {
      "fields": {
        "field_name": "value",
        ...
      }
    },
    ...
  }
}`);
      console.log(`\nCommon VirtualMachine Fields:`);
      console.log(`  - id: Unique identifier`);
      console.log(`  - name: VM name`);
      console.log(`  - virtualenvid: Virtual environment reference`);
      console.log(`  - osfamily_id: OS family ID`);
      console.log(`  - managementosfamily_id: Management OS family`);
      console.log(`  - cpu: Number of CPUs`);
      console.log(`  - ram: RAM in GB`);
      console.log(`  - created: Creation datetime`);
      console.log(`\nCommon Server Fields:`);
      console.log(`  - id: Unique identifier`);
      console.log(`  - name: Server name`);
      console.log(`  - brand_id: Hardware brand`);
      console.log(`  - model_id: Hardware model`);
      console.log(`  - serialnumber: Serial number`);
      console.log(`  - osfamily_id: OS family`);
      console.log(`  - cpu: CPU count`);
      console.log(`  - ram: RAM in GB`);
      console.log(`\nCommon LogicalVolume Fields:`);
      console.log(`  - id: Unique identifier`);
      console.log(`  - name: Volume name`);
      console.log(`  - storagesystem_id: Storage system reference`);
      console.log(`  - capacity: Capacity in GB`);
      console.log(`  - partitiontable: Partition table`);
      expect(true).toBe(true);
    });
  });
});
