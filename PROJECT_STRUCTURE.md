# Project Structure

```
auditforge/
├── src/                          # Next.js application source code
│   ├── app/                      # Next.js App Router pages & API routes
│   ├── components/               # React components
│   ├── config/                   # Application configuration
│   ├── db/                       # Database migrations and queries
│   ├── lib/                      # Utility functions and libraries
│   └── services/                 # External system integrations (iTOP, vCenter, etc.)
│
├── docker/                       # Docker & container configuration
│   ├── Dockerfile                # Multi-stage build configuration
│   ├── .dockerignore             # Files excluded from build
│   ├── docker-compose.yml        # Full stack (app + MySQL)
│   ├── docker-compose.app.yml    # Lightweight (app only)
│   ├── docker-compose.dev.yml    # Development environment
│   ├── docker-compose.external-db.yml  # External database setup
│   ├── docker-build.sh           # Linux/macOS build script
│   ├── docker-build.bat          # Windows build script
│   ├── README.md                 # Docker deployment guide
│   └── DOCKER.md                 # Comprehensive Docker documentation
│
├── scripts/                      # Testing & utility scripts
│   ├── check-*.js                # Database validation scripts
│   ├── debug-*.js                # Debugging utilities
│   ├── test-*.js                 # Integration tests
│   ├── setup-db.js               # Database initialization
│   ├── seed-configs.js           # Sample data seeding
│   ├── verify-*.js               # Verification scripts
│   ├── run-migrations.ts         # Migration runner
│   └── README.md                 # Scripts documentation
│
├── docs/                         # Documentation & reports
│   ├── ARCHITECTURE_VERIFICATION.md       # Architecture documentation
│   ├── DATA_FLOW_QUICK_REFERENCE.md       # Data flow patterns
│   ├── LOGIC_VERIFICATION_PROOF.md        # Logic analysis
│   ├── SYNC_MANUAL.md                     # Sync job manual
│   ├── FlashArray API 2.27 Reference/     # API reference
│   ├── *-report.mjs              # Auto-generated reports
│   ├── *-test-results.txt        # Test results
│   ├── README.md                 # Project overview (main docs)
│   ├── FOLDER_GUIDE.md           # This documentation guide
│   └── ...                       # Additional analysis & reports
│
├── data/                         # Data & exports
│   └── exports/                  # System export files (exports from vCenter, pure etc.)
│
├── config/                       # Application configuration files
│   ├── mysql.ts                  # MySQL connection setup
│   └── storage.ts                # Storage API configuration
│
├── node_modules/                 # Dependencies (gitignored)
├── .next/                        # Next.js build output (gitignored)
│
├── .github/                      # GitHub configuration (workflows, etc.)
├── .env.example                  # Environment variables template
├── .env.docker                   # Docker environment template
├── .env.local                    # Local environment (gitignored)
│
├── README.md                     # Main project documentation
├── package.json                  # Node.js dependencies
├── package-lock.json             # Dependency lock file
│
├── tsconfig.json                 # TypeScript configuration
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── postcss.config.mjs            # PostCSS configuration
├── jest.config.js                # Jest testing configuration
├── knexfile.ts                   # Knex.js database configuration
│
└── .gitignore                    # Git ignore rules
```

## Folder Purpose Summary

| Folder | Purpose | Key Files |
|--------|---------|-----------|
| **src/** | Application source code | pages, components, API endpoints |
| **docker/** | Container & deployment config | Dockerfile, docker-compose, build scripts |
| **scripts/** | Development & testing utilities | test scripts, database setup, debug tools |
| **docs/** | Documentation & reports | architecture, API refs, analysis reports |
| **data/** | Application data & exports | export files from connected systems |
| **config/** | Configuration modules | database, storage API configs |

## Quick Navigation

- **To run the app locally**: `npm install && npm run dev`
- **To deploy with Docker**: See `docker/README.md`
- **To run tests**: See `scripts/README.md`
- **For API documentation**: See `docs/FlashArray API 2.27 Reference.html`
- **For deployment guide**: See `docker/DOCKER.md`
- **For project overview**: See `README.md`

## Environment Setup

1. Copy template: `cp .env.example .env.local`
2. Configure database: Edit `.env.local` with MySQL credentials
3. Setup database: `npm run setup` (runs migrations)
4. Start dev server: `npm run dev`

## Build & Deploy

### Development
```bash
npm install
npm run dev              # Port 3000
```

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
See `docker/README.md` for detailed Docker instructions.
