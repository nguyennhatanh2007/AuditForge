╔════════════════════════════════════════════════════════════════════════════════╗
║                    QUICK REFERENCE: DATA FLOW DIAGRAM                           ║
║                           iTOP-Centric Architecture                             ║
║                              April 2, 2026                                      ║
╚════════════════════════════════════════════════════════════════════════════════╝

🎯 SYSTEM HIERARCHY
═════════════════════════════════════════════════════════════════════════════════

                              ┌─────────────────────┐
                              │   AUDITFORGE APP    │
                              └──────────┬──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
              ┌─────▼──────┐    ┌───────▼────────┐    ┌──────▼──────┐
              │   CONFIG    │    │  SYNC ENGINE   │    │    UI/MAPS  │
              │   (Setup)   │    │(Comparison)    │    │  (Display)  │
              └─────┬──────┘    └───────┬────────┘    └──────┬──────┘
                    │                   │                    │
         ┌──────────▼──────────────────▼────────────────────▼──────────┐
         │                                                              │
         │              DATABASE (Central Store)                        │
         │  ┌────────────────────────────────────────────────────┐    │
         │  │ • configurations (system connections)              │    │
         │  │ • sync_jobs (sync history)                         │    │
         │  │ • discrepancies (iTOP vs external)                 │    │
         │  │ • exceptions (known differences)                   │    │
         │  └────────────────────────────────────────────────────┘    │
         │                                                              │
         └──────────┬──────────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
   ┌────▼───┐  ┌───▼────┐  ┌──▼────┐    ┌───▼────┐
   │ iTOP   │  │ ESXi   │  │ Unity │    │ Pure   │
   │ (PRIMARY)│ │ (REF)  │  │ (REF)│    │ (REF) │
   │ CMDB   │  │        │  │      │    │       │
   └────────┘  └────────┘  └───────┘    └───────┘
      SOURCE        VALIDATION SOURCES
     OF TRUTH


📊 DATA FLOW: Sync Operation
═════════════════════════════════════════════════════════════════════════════════

  STEP 1: Collect Data
  ──────────────────────
  
    ┌─ From iTOP
    │  ├─ Servers
    │  ├─ VMs
    │  └─ Storage Objects
    │
    ├─ From ESXi/vCenter
    │  ├─ VMs
    │  ├─ Hosts
    │  └─ Datastores
    │
    ├─ From Unity
    │  ├─ Storage Arrays
    │  └─ LUNs
    │
    ├─ From Pure
    │  ├─ Volumes
    │  └─ Arrays
    │
    └─ From Alletra
       ├─ Volumes
       └─ Arrays


  STEP 2: Compare Against iTOP (Reference)
  ────────────────────────────────────────
  
    For each external system (ESXi, Unity, Pure, Alletra):
    
      For each object in that system:
        
        ┌─ Is it in iTOP?
        │  ├─ NO → Create "missing_in_itop" discrepancy
        │  └─ YES → Compare fields
        │
        ├─ Field values match?
        │  ├─ NO → Create "field_mismatch" discrepancy
        │  └─ YES → OK, no discrepancy
        │
        └─ Discrepancy has severity (low/medium/high)
    
    
    Also check iTOP objects NOT in external systems:
    
      For each object in iTOP:
        
        ┌─ Is it in this external system?
        │  ├─ NO → Create "extra_in_itop" discrepancy
        │  └─ YES → Already checked above
        │
        └─ External system might have removed it


  STEP 3: Store & Display
  ──────────────────────
  
    Discrepancies → Database
    
    ┌───────────────────────────────┬──────────────┬──────────┐
    │ missing_in_itop               │ extra_in_itop│ field_   │
    │                               │              │ mismatch │
    ├───────────────────────────────┼──────────────┼──────────┤
    │ Object in ESXi,               │ Object in    │ Same     │
    │ NOT in iTOP                   │ iTOP, NOT in │ object,  │
    │                               │ ESXi         │ diff     │
    │ Q: Add to iTOP?               │ Q: Remove    │ values   │
    │                               │ from iTOP?   │          │
    └───────────────────────────────┴──────────────┴──────────┘
     
    User can:
    ✓ Review & decide on action
    ✓ Mark as exception (if known difference)
    ✓ Auto-sync (if enabled)


🔄 COMPARISON DETAILS
═════════════════════════════════════════════════════════════════════════════════

WHAT GETS COMPARED:

  Virtual Machines (VMs):
    - name
    - powerState
    - serial number
    - connected host
    - vCPU count
    - RAM
    - Virtual Disk size
    - Datastore
    - Cluster
    - Total size

  Hosts:
    - name
    - serial number
    - CPU
    - RAM
    - Cluster
    - Datastore

  LUNs (Logical Unit Numbers):
    - name
    - serial number
    - Size
    - Datastore
    - Connected host(s)
    - Volume


SEVERITY LEVELS:

  HIGH:
    └─ field_mismatch (values changed, possible out-of-sync)

  MEDIUM:
    ├─ missing_in_itop (external has new object)
    └─ extra_in_itop (iTOP has object external removed)

  LOW:
    └─ Non-critical configuration differences


📁 FILE ORGANIZATION
═════════════════════════════════════════════════════════════════════════════════

Config Management:
  src/app/api/configurations/route.ts
    └─ GET   - List configured systems
    └─ POST  - Add new system
    └─ PUT   - Update system config
    
System Testing:
  src/app/api/configurations/[id]/test/route.ts
    └─ POST  - Test connection to system


Data Retrieval:
  src/app/api/inventory/route.ts
    └─ GET   - Fetch from all/specific systems


Sync & Comparison:
  src/app/api/sync/route.ts
    └─ POST  - Trigger sync job


Discrepancy Management:
  src/app/api/discrepancies/route.ts
    └─ GET   - List discrepancies (with filters)
    └─ POST  - Create discrepancy manually
    
  src/app/api/discrepancies/[id]/route.ts
    └─ GET/PUT/DELETE - Manage individual discrepancy
    
  src/app/api/discrepancies/[id]/exception/route.ts
    └─ POST  - Mark as exception


Exception Management:
  src/app/api/exceptions/route.ts
    └─ GET   - List exceptions
    └─ POST  - Create exception


Logic & Comparison:
  src/lib/discrepancy-engine.ts
    └─ compareExportDatasets() - Core comparison logic (iTOP-centric)
    
  src/lib/export-reader.ts
    └─ Reads data from export files


Services (Data Fetching):
  src/services/itop.service.ts       - iTOP API client
  src/services/vcenter.service.ts    - VMware vCenter API client
  src/services/unity.service.ts      - Dell Unity API client
  src/services/pure.service.ts       - Pure Storage API client
  src/services/alletra.service.ts    - HPE Alletra API client


✅ VERIFICATION CHECKLIST
═════════════════════════════════════════════════════════════════════════════════

Core Architecture:
  ✅ iTOP identified as PRIMARY source (CMDB)
  ✅ Other systems identified as REFERENCE sources
  ✅ Discrepancies defined relative to iTOP
  ✅ Comparison follows iTOP-centric logic
  
Database:
  ✅ source_system field identifies which external system
  ✅ discrepancy_type always "missing_in_itop", "extra_in_itop", or "field_mismatch"
  ✅ Storage supports both iTOP and source values for comparison
  
API:
  ✅ /api/inventory - Retrieves from all systems
  ✅ /api/sync - Compares all systems against iTOP
  ✅ /api/discrepancies - Shows iTOP-relative discrepancies
  ✅ /api/exceptions - Allows marking known differences
  
UI:
  ✅ Shows sourceSystem (which external system has issue)
  ✅ Shows type of discrepancy (relative to iTOP)
  ✅ Shows itopValue and sourceValue for comparison
  ✅ Allows user to review and take action
  
Business Logic:
  ✅ iTOP is the source of truth
  ✅ External systems validate iTOP data
  ✅ Discrepancies are audit findings
  ✅ Users make final decisions on reconciliation


═════════════════════════════════════════════════════════════════════════════════
USAGE EXAMPLE
═════════════════════════════════════════════════════════════════════════════════

SCENARIO: Audit infrastructure for configuration drift

  1. Configure systems in Settings:
     ✓ iTOP @ http://192.168.23.131/itop (admin:password)
     ✓ ESXi @ 192.168.23.130 (root:password)
     ✓ Unity @ 192.168.x.x (admin:password)
     
  2. Click "Sync" button on Dashboard
     ✓ System loads data from all configured systems
     ✓ Compares all external systems AGAINST iTOP
     ✓ Identifies discrepancies
     
  3. View Discrepancies page
     ✓ See all differences between systems
     ✓ Filter by object type (VM, Host, LUN)
     ✓ Filter by discrepancy type (missing_in_itop, extra_in_itop, field_mismatch)
     
  4. Review each discrepancy
     ✓ "prod-db-01 has 32GB in ESXi but 64GB in iTOP"
     ✓ "test-vm-01 exists in ESXi but not in iTOP"
     ✓ "server-42 exists in iTOP but not in ESXi"
     
  5. Take action
     ✓ Update iTOP (if external system is correct)
     ✓ Mark as exception (if difference is expected/documented)
     ✓ Update external system (if iTOP is correct)
     ✓ Investigate further (if unclear)


═════════════════════════════════════════════════════════════════════════════════
STATUS: ✅ APP LOGIC CORRECTLY IMPLEMENTS iTOP-CENTRIC HIERARCHY

No changes needed. The application correctly uses iTOP as the central source of
truth with all other systems serving as reference/validation sources.
═════════════════════════════════════════════════════════════════════════════════
