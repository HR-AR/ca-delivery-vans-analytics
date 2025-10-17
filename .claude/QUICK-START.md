# Claude Skills System - Quick Start

## 🚀 What You Just Got

A **Self-Learning Skill System** that captures your repetitive workflows and automates them.

### Current Skills

1. **`metrics-analysis`** - Complete weekly metrics analysis workflow
   - Validates Nash data
   - Calculates CPD with anomaly exclusion
   - Checks carrier performance
   - Generates standard reports

## 💬 How to Use

### Just Ask Naturally

```
You: "Analyze this week's metrics"
Claude: ✅ Using metrics-analysis skill...
        [Runs complete workflow automatically]
```

### Trigger Phrases

Any of these will invoke the `metrics-analysis` skill:
- "Analyze the metrics"
- "Check weekly performance"
- "Validate dashboard data"
- "Review this week's numbers"
- "How are the vans performing?"

## 📚 How It Learns

### The Pattern

1. **First time**: You explain a workflow in detail
2. **Second time**: System notices the pattern
3. **Third time**: Skill auto-generated and ready to use!

### Example

```bash
# Week 1: Full explanation needed
You: "Analyze metrics. Load Nash data, calculate CPD excluding small batches,
     check carriers, validate dashboard."
Claude: [Follows instructions]

# Week 2: System learning
You: "Analyze metrics using the same approach."
Claude: "🎓 Tracking this pattern. One more and I'll create a skill."

# Week 3+: Auto-pilot
You: "Analyze metrics"
Claude: ✅ [Executes full workflow automatically]
```

## 🎯 Try It Now

### Test the Metrics Analysis Skill

```
You: "Analyze this week's metrics"
```

Claude will automatically:
1. ✅ Validate Nash data integrity
2. ✅ Calculate weekly CPD (with anomaly exclusion)
3. ✅ Analyze FOX/NTG/FDC performance
4. ✅ Check week-over-week trends
5. ✅ Validate dashboard alignment
6. ✅ Generate standard report

## 📂 File Locations

```
.claude/
├── README.md                    # Full documentation
├── QUICK-START.md              # This file
├── skills/
│   └── metrics-analysis/
│       └── SKILL.md            # Weekly metrics workflow
└── learning/
    └── patterns.json           # What system is learning
```

## 🔧 Customizing Skills

### View a Skill
```bash
cat .claude/skills/metrics-analysis/SKILL.md
```

### Edit a Skill
```bash
nano .claude/skills/metrics-analysis/SKILL.md
# Or use your preferred editor
```

Changes take effect immediately!

### Check What's Being Learned
```bash
cat .claude/learning/patterns.json
```

## 🌟 Creating Your Own Skills

### Method 1: Let It Learn (Automatic)
Just explain the same workflow 2-3 times and it will auto-generate.

### Method 2: Manual Creation
```bash
# Create skill directory
mkdir -p .claude/skills/my-workflow

# Create skill file
cat > .claude/skills/my-workflow/SKILL.md << 'EOF'
---
name: my-workflow
description: When to use this skill
version: 1.0.0
---

# My Workflow

## When to Use
- Trigger phrase 1
- Trigger phrase 2

## Steps
1. First do this
2. Then do that
3. Finally validate
EOF
```

## 💡 Common Use Cases

### Already Created
- ✅ Weekly metrics analysis

### Easy to Add
- 📊 Data validation workflows
- 🚀 Deployment checklists
- 📝 Report generation
- 🔍 Anomaly investigation
- 📚 API documentation lookup (with web search)

## 🎓 Best Practices

### Clear Trigger Phrases
- ✅ "Analyze weekly CA metrics"
- ❌ "Do stuff"

### Complete Workflows
Include start-to-finish:
- Data validation
- Processing
- Output generation
- Validation gates

### Document Why
```markdown
## Step 3: Exclude Small Batches
# Why: Single orders skew CPD calculations
# How: Filter batches < 10 orders
# Expected: Exclusions should be < 5% of total
```

## 📈 What Happens Next

### As You Work
- System tracks repetitive patterns
- Notifies when threshold reached (2-3 occurrences)
- Auto-generates skills
- Skills improve with use

### You Get
- ⚡ Faster workflows (one command vs. multiple steps)
- 🎯 Consistency (same process every time)
- 📝 Documentation (skills are self-documenting)
- 🔄 Continuous improvement (edit skills as needs change)

## 🆘 Troubleshooting

### Skill Not Triggering?
```bash
# Check it exists
ls .claude/skills/

# Read the description
head -20 .claude/skills/metrics-analysis/SKILL.md

# Try explicit trigger phrase from SKILL.md
```

### Want to See What's Learned?
```bash
cat .claude/learning/patterns.json | grep -A 5 "patterns"
```

### Need to Reset?
```bash
# Remove a skill
rm -rf .claude/skills/unwanted-skill/

# Clear learning history
echo '{"patterns": [], "skills_created": []}' > .claude/learning/patterns.json
```

## 🔐 Privacy

- ✅ Everything stored **locally** in your repo
- ✅ No cloud sync
- ✅ Git-trackable
- ✅ Full control (edit/delete anytime)

## 📖 Next Steps

1. **Try it**: Ask Claude to "Analyze this week's metrics"
2. **Read more**: Check `.claude/README.md` for full docs
3. **Customize**: Edit `.claude/skills/metrics-analysis/SKILL.md`
4. **Create new**: Explain a workflow 2-3 times and watch it learn

## 🎉 Benefits You'll See

- **Week 1**: Explaining every step
- **Week 2**: "Do it like last time"
- **Week 3**: "Analyze metrics" → Done!

---

**Quick Command Reference**:
```bash
# View all skills
ls .claude/skills/

# Read the metrics skill
cat .claude/skills/metrics-analysis/SKILL.md

# Check learning history
cat .claude/learning/patterns.json

# Edit CLAUDE.md (project context)
nano CLAUDE.md
```

**Ready to go!** Just start chatting with Claude normally. The system will learn and adapt automatically.
