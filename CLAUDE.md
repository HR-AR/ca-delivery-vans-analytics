# Project Context

## Core Principles (Effective Context Engineering)
1. **Validation-Driven**: Done = validation passes
2. **Self-Correcting**: On failure, analyze → fix → revalidate
3. **Precedent over Instruction**: Examples define standards
4. **Dynamic Context**: Context auto-updates from codebase

## Tech Stack
- Node.js 20.x
- TypeScript 5.x
- React 18.x (or Express/Next.js)
- PostgreSQL 15 + Prisma
- Jest for testing

## Validation Gates (must ALL pass)
```bash
npm run lint
npm run test
npm run build
```

## Self-Correction Protocol
1. Capture full error output
2. Analyze root cause
3. Apply minimal, standards-aligned fix
4. Re-run validation
5. Repeat until success

## Current Focus
[Update per sprint]
