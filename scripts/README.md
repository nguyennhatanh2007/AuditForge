# Scripts Directory

Test, debug, and utility scripts for AuditForge development and troubleshooting.

## Contents

- `check-*.js` - Database and configuration validation scripts
- `debug-*.js` - Debugging utilities for services and API
- `test-*.js` - Integration and unit test runners
- `setup-db.js` - Database initialization script
- `seed-configs.js` - Seed sample configuration data
- `verify-*.js` - Verification and integrity check scripts
- `run-migrations.ts` - Database migration runner

## Usage

All scripts require Node.js environment and dependencies installed.

```bash
# Run a specific script
node scripts/check-passwords.js
node scripts/setup-db.js
node scripts/verify-sync-integration.js

# Run tests
npm run test
npm test
```

## Script Categories

### Setup & Initialization
- `setup-db.js` - Initialize MySQL database tables
- `seed-configs.js` - Load sample system configurations
- `run-migrations.ts` - Run database migrations

### Debugging
- `debug-services.js` - Debug service communication
- `debug-vcenter-api.mjs` - Test vCenter API connectivity
- `diagnostic-report.js` - Generate system diagnostic report

### Testing & Validation
- `check-field-length.js` - Validate database field sizes
- `check-itop-*.js` - Test iTOP CMDB integration
- `check-passwords.js` - Verify encrypted password handling
- `test-db-connection.js` - Test MySQL connectivity
- `test-sync-*.js` - Test sync job execution and API
- `verify-sync-integration.js` - Verify end-to-end sync workflow

### API Integration
- `find-itop-endpoint.js` - Discover iTOP API endpoints
- `test-real-connections.js` - Test real system connections
- `test-real-systems.mjs` - Test real storage system APIs

## Important Notes

- Some scripts may modify database state
- Test scripts should be run in development environment first
- Always backup database before running setup scripts
- Refer to individual script headers for usage instructions
