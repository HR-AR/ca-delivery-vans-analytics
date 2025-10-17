# .claude/ Directory Index

**Self-Learning Skill System for CA Delivery Vans Analytics**

---

## 📚 Documentation Files

### 🚀 [QUICK-START.md](QUICK-START.md) - START HERE
**Size**: 5.4 KB | **Read Time**: 5 minutes

Your first stop. Quick overview of:
- What the skill system does
- How to use it immediately
- Example trigger phrases
- Basic commands

**Best For**: First-time users, quick reference

---

### 💡 [EXAMPLE-USAGE.md](EXAMPLE-USAGE.md) - Real-World Scenarios
**Size**: 10 KB | **Read Time**: 10 minutes

See the system in action:
- Before/after comparisons
- Real conversation examples
- Time savings calculations
- Evolution of skills over time

**Best For**: Understanding practical impact, seeing ROI

---

### 📖 [README.md](README.md) - Complete Reference
**Size**: 8.6 KB | **Read Time**: 15 minutes

Comprehensive documentation:
- How pattern detection works
- Skill file format specification
- Customization guide
- Troubleshooting
- Best practices

**Best For**: Deep understanding, customization, troubleshooting

---

### ✅ [INSTALLATION-COMPLETE.md](INSTALLATION-COMPLETE.md) - Installation Summary
**Size**: 9.2 KB | **Read Time**: 10 minutes

What was installed and why:
- File structure overview
- Expected impact metrics
- Privacy & security details
- Next steps

**Best For**: Verifying installation, understanding scope

---

### 📇 [INDEX.md](INDEX.md) - This File
**Size**: 2 KB | **Read Time**: 2 minutes

Directory navigation guide

---

## 🎯 Skills Directory

### [skills/metrics-analysis/](skills/metrics-analysis/)
**Version**: 1.0.0 | **Created**: Oct 17, 2025

Complete weekly metrics analysis workflow:
- Nash data validation
- CPD calculation (anomaly exclusion)
- Carrier performance (FOX/NTG/FDC)
- Week-over-week trends
- Dashboard validation
- Standard report generation

**Triggers**:
- "Analyze metrics"
- "Check weekly performance"
- "Validate dashboard data"
- "Review this week's numbers"

**Files**:
- [SKILL.md](skills/metrics-analysis/SKILL.md) - Complete workflow (8.7 KB)

---

## 🧠 Learning Directory

### [learning/patterns.json](learning/patterns.json)
**Size**: 1.1 KB | **Format**: JSON

Pattern tracking database:
- Detected repetitive patterns
- Request counts and thresholds
- Auto-generated skills log
- System metadata

**Structure**:
```json
{
  "patterns": [
    {
      "signature": "unique-id",
      "intent": "analysis|api_docs|reporting|...",
      "count": 3,
      "examples": [...],
      "skill_created": true
    }
  ],
  "skills_created": [
    {
      "name": "skill-name",
      "intent": "analysis",
      "created": "2025-10-17T00:00:00"
    }
  ]
}
```

---

## 🔧 Other Files

### [settings.local.json](settings.local.json)
Claude Code local settings (user preferences)

### [agents/](agents/)
Claude Code agent configurations

---

## 📊 Quick Stats

**Total Documentation**: 33.2 KB across 4 guides
**Current Skills**: 1 (metrics-analysis)
**Pattern Tracking**: Active (threshold: 2)
**Installation Date**: October 17, 2025
**System Version**: 1.0.0

---

## 🗺️ Navigation Guide

### I Want To...

**...Get started quickly**
→ Read [QUICK-START.md](QUICK-START.md)

**...See real examples**
→ Read [EXAMPLE-USAGE.md](EXAMPLE-USAGE.md)

**...Understand deeply**
→ Read [README.md](README.md)

**...Verify installation**
→ Read [INSTALLATION-COMPLETE.md](INSTALLATION-COMPLETE.md)

**...Use the metrics skill**
→ Read [skills/metrics-analysis/SKILL.md](skills/metrics-analysis/SKILL.md)

**...Check learning progress**
→ View [learning/patterns.json](learning/patterns.json)

**...Create my own skill**
→ Read [README.md](README.md) → "Creating Skills Manually"

**...Edit existing skill**
→ Edit [skills/metrics-analysis/SKILL.md](skills/metrics-analysis/SKILL.md)

**...Troubleshoot issues**
→ Read [README.md](README.md) → "Troubleshooting"

---

## 🎯 Recommended Reading Order

### First Time Users
1. [QUICK-START.md](QUICK-START.md) - Understand basics (5 min)
2. [EXAMPLE-USAGE.md](EXAMPLE-USAGE.md) - See it in action (10 min)
3. Try it: "Analyze this week's metrics"
4. [README.md](README.md) - Deep dive when needed

### Returning Users
- [skills/metrics-analysis/SKILL.md](skills/metrics-analysis/SKILL.md) - Reference workflow
- [learning/patterns.json](learning/patterns.json) - Check learning progress

### Customizers
1. [README.md](README.md) - Full reference
2. [skills/metrics-analysis/SKILL.md](skills/metrics-analysis/SKILL.md) - Example to follow
3. Create your own in `skills/your-skill-name/SKILL.md`

---

## 🔗 External References

**Project Context**: [../CLAUDE.md](../CLAUDE.md) - Updated with skill system docs
**Implementation Guide**: [../IMPLEMENTATION-READY.md](../IMPLEMENTATION-READY.md)
**Scripts**: [../scripts/analysis/](../scripts/analysis/)

---

## 📦 File Size Summary

```
.claude/
├── README.md                    8.6 KB  📖 Complete reference
├── QUICK-START.md               5.4 KB  🚀 Getting started
├── EXAMPLE-USAGE.md            10.0 KB  💡 Real examples
├── INSTALLATION-COMPLETE.md     9.2 KB  ✅ Install summary
├── INDEX.md                     2.0 KB  📇 This file
│
├── skills/metrics-analysis/
│   └── SKILL.md                 8.7 KB  🎯 Weekly workflow
│
└── learning/
    └── patterns.json            1.1 KB  🧠 Pattern tracking

Total: ~45 KB documentation
```

---

## 🎓 Learning Path

### Week 1: Learn the System
- Read documentation
- Try metrics-analysis skill
- Observe pattern tracking

### Week 2-3: Let It Learn
- Use Claude naturally
- Explain workflows when needed
- Watch skills auto-generate

### Week 4+: Optimize
- Edit skills for your needs
- Create manual skills
- Share with team via Git

---

## 💡 Tips

### For Best Results
1. **Use consistent phrases** - "Analyze metrics" vs. random variations
2. **Explain completely** - Full workflows get better skills
3. **Edit iteratively** - Skills improve with refinements
4. **Share with team** - Commit to Git for team benefits

### Common Patterns
- Analysis tasks → analysis skills
- API lookups → api-docs skills (with web search)
- Reporting → slack-announcement skills
- Validation → data-validation skills

---

## 🔄 Maintenance

### Weekly
- Review `learning/patterns.json` for new patterns
- Check if new skills need creation

### Monthly
- Update existing skills based on learnings
- Clean up unused patterns
- Commit changes to Git

### As Needed
- Edit skills when workflow changes
- Create manual skills for unique cases
- Share best practices with team

---

## 🆘 Need Help?

### Quick Commands
```bash
# View all skills
ls skills/

# Check learning progress
cat learning/patterns.json

# Read a skill
cat skills/metrics-analysis/SKILL.md

# Edit a skill
code skills/metrics-analysis/SKILL.md
```

### Common Issues
- **Skill not triggering**: Check trigger phrases in SKILL.md
- **Pattern not learning**: Verify threshold and intent matching
- **Execution errors**: Test skill steps manually first

### Resources
- Documentation in this directory
- Project context in [../CLAUDE.md](../CLAUDE.md)
- Git history for evolution

---

**Last Updated**: October 17, 2025
**System Version**: 1.0.0
**Status**: ✅ Active and Learning
