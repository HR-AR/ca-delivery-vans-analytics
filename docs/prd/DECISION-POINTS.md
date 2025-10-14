# Critical Decision Points - Need Your Input

**Date**: 2025-10-13
**Status**: 🔴 Awaiting User Decisions Before Implementation

---

## ✅ What I've Designed (Based on Your Requirements)

1. **✅ Spark CPD Bulk Upload via CSV** - Template download, merge with existing stores
2. **✅ CA Store Filtering** - Only CA stores in dashboard, non-CA excluded automatically
3. **✅ Store State Lookup** - Google-based auto-detection of store locations
4. **✅ Store Persistence** - CA stores kept even if missing from future uploads
5. **✅ Modular Architecture** - Built to support NWA/TX/other state modules later

**Full Details**: See [FINAL-REQUIREMENTS-UPDATE.md](FINAL-REQUIREMENTS-UPDATE.md)

---

## 🔴 4 QUESTIONS - NEED YOUR ANSWERS TO PROCEED

### Question 1: Google Store Lookup Method
**Context**: Need to determine which state each store is in (CA vs NWA vs TX)

**Options**:
- **A) Google Search Scraping** (Free, may hit rate limits after 100+ lookups)
  - Pro: Automatic, no manual work
  - Con: May be unreliable, could break if Google changes HTML

- **B) Manual CSV Upload** (You provide store-state mapping)
  - Pro: 100% accurate, no rate limits
  - Con: Initial manual work to create the mapping
  - Format: `store_id,state,city` (e.g., `2082,CA,Los Angeles`)

- **C) Walmart Store Locator API** (If you have internal API access)
  - Pro: Official data, reliable
  - Con: Need API credentials

**My Recommendation**: **Option B** (Manual CSV) for MVP, because:
- Only ~20-30 stores initially (CA + future NWA)
- One-time setup, then automated thereafter
- Guaranteed accuracy

**Your Choice**: A, B, or C?

---

### Question 2: Unknown Store Handling
**Context**: What happens if CSV upload contains store not in our state mapping?

**Scenario**: User uploads CSV with Store 9999, we don't know if it's CA or not

**Options**:
- **A) Exclude until verified** (Safer)
  - Show warning: "Store 9999 excluded - unknown state. Please verify in admin."
  - Admin adds to CA registry manually
  - Then appears in dashboard

- **B) Include with warning** (Faster)
  - Show store in dashboard with "⚠️ Unknown State" label
  - Flag for admin review
  - Risk: Non-CA store might slip through

**My Recommendation**: **Option A** (Exclude until verified) because:
- Requirement says "strictly a CA module view"
- Better to miss a store than include non-CA data
- Admin can quickly add via Spark CPD bulk upload CSV

**Your Choice**: A or B?

---

### Question 3: Module Selector UI
**Context**: You want architecture that supports NWA/TX modules later

**Options**:
- **A) Skip module selector in MVP** (Faster, simpler)
  - Hardcode to CA only
  - Module selector added later when NWA launches
  - Landing page goes directly to CA dashboard

- **B) Build module selector now** (Future-proof)
  - Landing page shows "CA (Active)" + "NWA (Coming Soon)"
  - User clicks "CA" → goes to dashboard
  - Architecture ready for NWA Day 1

**My Recommendation**: **Option B** (Build module selector now) because:
- You said "launches next week" (NWA expansion imminent)
- Only adds 1 extra page to build
- Cleaner user experience when NWA launches

**Your Choice**: A or B?

---

### Question 4: Spark CPD CSV Template Fields
**Context**: What should the bulk upload CSV include?

**Minimum Required**:
```csv
Store Id,Spark YTD CPD
2082,5.60
2242,5.84
```

**Extended Version**:
```csv
Store Id,Spark YTD CPD,Target Batch Size,State,Notes
2082,5.60,92,CA,High-volume store
2242,5.84,81,CA,Medium-volume store
```

**Options**:
- **A) Minimum only** (Store ID + Spark CPD)
  - Simpler to fill out
  - Target batch + notes entered separately in admin UI

- **B) Extended** (Includes batch size, state, notes)
  - One-stop upload
  - All store config in one CSV
  - More columns to fill out

**My Recommendation**: **Option B** (Extended) because:
- Bulk editing in Excel is easier than clicking through admin UI for 20 stores
- State field helps with verification
- Notes field helps document launch dates, issues, etc.

**Your Choice**: A or B?

---

## 📋 Quick Answer Format (Copy & Reply)

```
Q1 (Store Lookup): B - Manual CSV upload
Q2 (Unknown Stores): A - Exclude until verified
Q3 (Module Selector): B - Build now for NWA
Q4 (CSV Template): B - Extended with batch/state/notes
```

---

## 🚀 What Happens After You Answer

Once you reply:
1. **I'll finalize the architecture** based on your answers
2. **Update the implementation plan** with exact tasks
3. **Launch all 4 agents in parallel** to start building
4. **Day 1**: You'll see deployed skeleton on Render with:
   - Module selector (if you chose Option B for Q3)
   - Admin UI for store state management
   - CSV bulk upload for Spark CPD

---

## ⏱️ Timeline Impact

- **If you choose "Faster" options (A's)**: MVP in 10 days
- **If you choose "Future-proof" options (B's)**: MVP in 12 days (original timeline)
- **My recommendation**: Choose B's for Q1-Q4 = 12 days, but built correctly for scale

---

**Ready?** Just reply with your 4 answers and I'll kick off immediately! 🚀
