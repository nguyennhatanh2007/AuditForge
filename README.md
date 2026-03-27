# Audit Forge

Audit Forge is a Next.js 15 App Router web application for CMDB synchronization auditing.

## Features in this scaffold

- Dashboard with operational overview
- Discrepancies list with exception-aware filtering
- Exceptions management workspace
- Sync jobs and configurations screens
- API route scaffolding for future backend wiring

## Data flow

- Raw source exports are read from `data/exports/<system>/`
- Each system folder can contain `vm.json`, `host.csv`, `lun.json`, and similar files
- MySQL stores system connections, exceptions, sync history, and generated discrepancy history only
- The sync endpoint compares export files against iTop export data and writes the results to history

## Environment

Copy `.env.example` to `.env.local` and fill MySQL + integration credentials.
