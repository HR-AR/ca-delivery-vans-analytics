# Slack Team Announcement

## Simple Version (Copy & Paste)

```
Hey team! 👋

I've built a new CA Delivery Vans Analytics Dashboard to help us track and analyze our delivery performance.

🔗 Dashboard: https://[your-app-name].onrender.com

**What it does:**
• Upload Nash CSV data from https://portal.usenash.com/analytics
• View real-time dashboards with CPD, orders, trips, and store performance
• Week-over-week metrics with CSV export for reporting
• Compare Van CPD vs Spark CPD to identify cost savings

**Quick Start:**
1. Go to Nash portal → Export CSV
2. Upload to dashboard
3. View your analytics

**Optional:** Add Spark CPD data in Admin for Van vs Spark comparison

Check out the Quick Start Guide on the homepage for step-by-step instructions!

Let me know if you have questions. 🚀
```

---

## Detailed Version (For Ops/Management)

```
Team - New CA Delivery Analytics Dashboard Launch 📊

I'm excited to share our new California Delivery Vans Analytics Dashboard!

🔗 **Access Here:** https://[your-app-name].onrender.com

**Why we built this:**
We needed better visibility into our CA delivery operations - costs, performance, and trends. This dashboard gives us real-time insights to make data-driven decisions.

**Key Features:**

📈 **Dashboard View**
   • Total orders, trips, and active stores at a glance
   • Cost Per Delivery (CPD) tracking with anomaly detection
   • Top performing stores and carriers
   • Batch size analysis

📅 **Weekly Metrics**
   • Week-over-week performance trends
   • Store-level and carrier-level breakdowns
   • Export to CSV for your own reports/presentations

⚙️ **Admin Controls**
   • Bulk upload Spark CPD for cost comparisons
   • Manage rate cards (FOX, NTG, FDC)
   • Individual store configuration

**How to Use:**

**Step 1:** Get your data
   → Go to https://portal.usenash.com/analytics
   → Log in and export your delivery data as CSV
   → Select your desired date range (week, month, etc.)

**Step 2:** Upload to dashboard
   → Click "Upload" on the homepage
   → Drag and drop your Nash CSV file
   → Wait for validation (~5-10 seconds)

**Step 3:** View analytics
   → Dashboard: Interactive charts and KPIs
   → Weekly Metrics: Detailed tables with CSV export
   → Admin: Configure store settings and comparison data

**Optional Enhancements:**
If you want Van vs Spark CPD comparisons, upload Spark data in the Admin page. The dashboard will automatically show cost deltas and opportunities.

**Need Help?**
• Full Quick Start Guide available on the homepage
• Questions? Ping me or check the guide first
• Nash CSV issues? Contact your Nash account manager

This replaces manual Excel tracking and gives us automated, accurate reporting. Excited to hear your feedback!

🚀 Let's put this to use!
```

---

## Executive Summary Version (For Leadership)

```
[Leadership] CA Delivery Analytics Dashboard - Now Live 📊

I've deployed a new analytics platform for our California delivery operations.

🔗 **Dashboard:** https://[your-app-name].onrender.com

**Business Impact:**
• Real-time visibility into CA delivery costs and performance
• Automated CPD (Cost Per Delivery) tracking with anomaly detection
• Van vs Spark cost comparison to identify savings opportunities
• Weekly trending for ops reviews and reporting

**Key Metrics Tracked:**
• Total Orders & Trips
• Average CPD (excludes anomalies like 2-order batches)
• Store Performance (orders, trips, CPD per store)
• Carrier Performance (FOX, NTG, FDC comparison)
• On-Time Delivery % (when configured)

**Data Source:**
Integrates with Nash portal (https://portal.usenash.com/analytics). Team uploads CSV exports, dashboard auto-processes and displays analytics.

**Cost Tracking:**
Current dashboard shows weighted average CPD with anomaly exclusion (small batches excluded to prevent skewed metrics). Van vs Spark comparison available when Spark CPD data is uploaded.

**Reporting:**
Weekly metrics page includes CSV export for board reports, QBRs, and internal ops reviews.

**Self-Service:**
Ops team can upload data and run reports without dev support. Admin page allows bulk configuration.

The platform is live and ready for use. Ops team has been provided Quick Start Guide.

Questions? Happy to provide a demo or walkthrough.
```

---

## Technical Notes (For Your Reference)

**Deployment Info:**
- Platform: Render.com
- Tech Stack: Node.js + TypeScript backend, Python analytics, React-free vanilla JS frontend
- Auto-deploy: Pushes to main branch trigger Render builds
- Data: California stores only (auto-filters out non-CA)

**Features Shipped:**
✅ Nash CSV upload with validation
✅ Dashboard with 5 charts (orders, CPD, store performance, vendor, batch density)
✅ Week-over-week metrics with CSV export
✅ Spark CPD bulk upload for comparisons
✅ Anomaly detection (excludes batches < 10 orders)
✅ Weighted average CPD calculation

**Planned (Not Yet Built):**
⏳ Van OTD bulk upload (Phase 4.14 documented, ~5 hours to implement)

**How to Update Render URL:**
Replace `[your-app-name]` with your actual Render app name in all versions above.
Example: `https://ca-delivery-analytics.onrender.com`
