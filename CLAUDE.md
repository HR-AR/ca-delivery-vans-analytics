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

---

## Self-Learning Skill System

### Overview
The system automatically detects repetitive patterns in requests and generates reusable skills. When you explain a workflow multiple times, it becomes a permanent skill that Claude can auto-invoke.

### How It Works
1. **Pattern Detection** - Tracks when similar instructions are given repeatedly
2. **Skill Generation** - Creates `.claude/skills/` entries after 2-3 similar requests
3. **Skill Refinement** - Each use improves the skill with feedback
4. **Auto-Invocation** - Future requests automatically trigger learned skills

### Key Benefits
- **Reduces Repetition**: Explain once, use forever
- **Improves Accuracy**: Skills capture your preferred methodology
- **Enables Automation**: Common workflows become one-command operations
- **Self-Improving**: Skills refine themselves based on usage

### Pattern Detection Triggers
The system tracks:
- **Repetitive Requests**: Same task type appears 2+ times
- **Detailed Instructions**: Step-by-step methodology explanations
- **Explicit Saves**: "Remember this", "Save this workflow", "Create a skill"
- **API/Documentation Lookups**: Repeated requests for current docs

### Auto-Generated Skills Include
- **Analysis Workflows**: Your preferred methodology for evaluating requirements
- **API Documentation**: Auto-search current documentation for mentioned libraries
- **Reporting Templates**: Standardized formats for status updates
- **Validation Routines**: Common checks before commits/deployments

### Integration with Current Workflow
When Claude interacts with you:
1. Detects if request matches a known pattern
2. Auto-invokes the relevant skill (if exists)
3. Tracks new patterns for potential skill creation
4. Notifies when threshold reached for new skill generation

### Example Flow

**First Request:**
```
User: "Analyze the dashboard metrics. Check weekly trends, identify anomalies, validate against CPD."
Claude: [Follows instructions, provides analysis]
Claude (internal): Records pattern
```

**Second Similar Request:**
```
User: "Analyze this week's metrics using the same approach."
Claude: "🎓 I'm tracking this analysis pattern. One more similar request and I'll create a reusable skill."
Claude: [Executes analysis, records pattern]
```

**Third Request:**
```
User: "Analyze the metrics."
Claude: "✅ Using your custom metrics-analysis skill..."
Claude: [Auto-invokes learned skill, no detailed instructions needed]
```

### Skill Storage
- **Location**: `.claude/skills/auto-[intent]-[id]/SKILL.md`
- **Tracking Data**: `.claude/learning/patterns.json`
- **Format**: Standard skill markdown with frontmatter

### Special Skill Types

#### API Documentation Skills
For repeated documentation lookups:
- Auto-enabled web search
- Prioritizes official sources
- Checks version compatibility
- Cites sources with dates

#### Analysis Skills
For repeated analytical tasks:
- Captures your preferred methodology
- Maintains consistent evaluation criteria
- Includes your validation steps

#### Validation Skills
For repeated quality checks:
- Standardizes pre-commit checks
- Ensures consistent test coverage
- Validates against your quality gates

### Maintenance
Skills improve with use. After each invocation:
1. Note what worked well
2. Identify gaps or confusion
3. Edit the skill file directly to refine
4. Changes persist for future uses

### Privacy & Control
- All skills stored locally in your repo
- Full transparency: skills are readable markdown
- Complete control: edit or delete any skill
- No external data sharing
