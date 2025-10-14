# CA Delivery Vans Analytics - Deployment Guide

**Date**: 2025-10-13
**Status**: Ready for Render Deployment
**Phase**: Phase 1 Complete

---

## Quick Deployment to Render

### Prerequisites
- GitHub account (to connect repository)
- Render account (free tier available at render.com)
- Git repository pushed to GitHub

---

## Option 1: Auto-Deploy from GitHub (Recommended)

### Step 1: Push to GitHub
```bash
# If you haven't created a GitHub repo yet:
# 1. Go to github.com and create a new repository
# 2. Name it: ca-delivery-vans-analytics
# 3. Do NOT initialize with README (we already have files)

# Add remote and push
git remote add origin https://github.com/YOUR_USERNAME/ca-delivery-vans-analytics.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub account (if not already connected)
4. Select the `ca-delivery-vans-analytics` repository
5. Render will auto-detect settings from `render.yaml`:
   - **Name**: ca-delivery-vans-analytics
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Region**: Oregon
   - **Plan**: Free
6. Click "Create Web Service"

### Step 3: Monitor Deployment
- Render will automatically:
  - Install dependencies (`npm install`)
  - Run TypeScript build (`npm run build`)
  - Start the server (`npm start`)
- Deployment typically takes 3-5 minutes

### Step 4: Verify Deployment
Once deployed, you'll get a URL like: `https://ca-delivery-vans-analytics.onrender.com`

Test the health check:
```bash
curl https://ca-delivery-vans-analytics.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "CA Delivery Vans Analytics",
  "timestamp": "2025-10-13T..."
}
```

---

## Option 2: Manual Configuration (Alternative)

If auto-detection doesn't work, use these settings:

**Settings Page:**
- **Name**: ca-delivery-vans-analytics
- **Region**: Oregon (or your preferred region)
- **Branch**: main
- **Root Directory**: (leave empty)
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
- `NODE_ENV`: production
- `PORT`: 10000 (Render uses this port internally)

**Advanced Settings:**
- **Auto-Deploy**: Yes (deploys on every push to main)
- **Health Check Path**: /health

---

## Post-Deployment Checklist

### 1. Test Health Check
```bash
curl https://YOUR_APP_URL.onrender.com/health
```

### 2. Test File Upload
```bash
# Using curl
curl -X POST https://YOUR_APP_URL.onrender.com/api/upload \
  -F "file=@Data Example/data_table_1 (2).csv"
```

### 3. Test Frontend
Open in browser:
- Upload page: `https://YOUR_APP_URL.onrender.com`
- Dashboard: `https://YOUR_APP_URL.onrender.com/dashboard.html`
- Admin: `https://YOUR_APP_URL.onrender.com/admin.html`

### 4. Verify Logs
In Render dashboard:
- Click on your service
- Go to "Logs" tab
- Should see: `Server is running on port 10000`

---

## Local Testing Before Deployment

### 1. Build and Test Locally
```bash
# Install dependencies
npm install

# Run validation gates
npm run validate

# Build for production
npm run build

# Test production build locally
npm start

# Test health check (in another terminal)
curl http://localhost:3000/health
```

### 2. Expected Output
```
✅ npm run lint    → Pass
✅ npm run test    → 33 tests passing
✅ npm run build   → TypeScript compilation successful
✅ npm start       → Server running on port 3000
```

---

## Troubleshooting

### Issue: Build Fails on Render

**Symptom**: Build fails with "Cannot find module..."

**Solution**:
```bash
# Ensure all dependencies are in package.json
npm install --save-dev typescript ts-node

# Test build locally
npm run build
```

### Issue: Server Won't Start

**Symptom**: "Application failed to start"

**Solution**:
1. Check that `dist/ui-server.js` exists after build
2. Verify `package.json` has correct start command: `"start": "node dist/ui-server.js"`
3. Check logs for error messages

### Issue: Health Check Fails

**Symptom**: Render shows service as "unhealthy"

**Solution**:
1. Verify health endpoint: `curl YOUR_URL/health`
2. Check that server is listening on correct port (process.env.PORT)
3. Review server logs in Render dashboard

### Issue: File Upload Returns 413 (Payload Too Large)

**Solution**: This is expected for files over 50MB (by design)
- Check file size: `ls -lh "Data Example/data_table_1 (2).csv"`
- Our limit: 50MB (configurable in `src/middleware/upload.ts`)

---

## Render Free Tier Limitations

**Free Plan Includes**:
- 512 MB RAM
- Free SSL (automatic HTTPS)
- Automatic deploys from GitHub
- 750 hours/month (spins down after 15 min inactivity)

**Important Notes**:
- Service spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Upgrade to Starter plan ($7/mo) for always-on service

---

## Environment Variables (Optional)

For production, you may want to add:

```bash
# In Render dashboard → Environment
NODE_ENV=production
PORT=10000
MAX_FILE_SIZE_MB=50
LOG_LEVEL=info
```

---

## Continuous Deployment

Once connected to GitHub:
1. Make changes locally
2. Commit and push to `main` branch
3. Render automatically deploys new version
4. Monitor deployment in Render dashboard

Example workflow:
```bash
# Make changes
vim src/ui-server.ts

# Test locally
npm run validate

# Commit and push
git add .
git commit -m "Update: description of changes"
git push origin main

# Render auto-deploys (takes ~3-5 min)
```

---

## Security Checklist (Before Production)

- [ ] Environment variables stored securely (not in code)
- [ ] CORS configured properly (not `*` in production)
- [ ] Rate limiting enabled for file uploads
- [ ] File size limits enforced (50MB)
- [ ] File type validation (CSV only)
- [ ] HTTPS enabled (automatic with Render)
- [ ] Secrets not committed to Git (check .gitignore)

---

## Monitoring and Logs

### View Logs in Real-Time
In Render dashboard:
1. Go to your service
2. Click "Logs" tab
3. View live server logs

### Key Log Messages to Monitor
```
✅ Server is running on port 10000
✅ Health check: /health
✅ Upload endpoint: /api/upload
❌ Error: (any error messages)
```

---

## Next Steps After Deployment

### Phase 2 Development (Days 3-4)
- Store registry persistence
- Rate card CRUD API
- Spark CPD bulk upload
- Admin UI implementation

### Phase 3 Development (Days 5-7)
- Python analytics integration
- Dashboard data endpoints
- Chart data generation

### Phase 4 Development (Days 8-9)
- Dashboard visualization
- Chart.js integration
- User testing

---

## Contact and Support

**Deployment Issues**: Check Render status page (status.render.com)
**GitHub**: Push issues → Check Actions tab
**Local Testing**: Run `npm run validate` before pushing

---

## Success Criteria

✅ **Technical**:
- Health check returns 200 OK
- Upload endpoint accepts CSV files
- Frontend loads without errors
- All static assets served correctly

✅ **Performance**:
- Health check < 200ms
- Upload validation < 2s
- Dashboard load < 3s
- Build time < 5min

✅ **Reliability**:
- Uptime > 99% (Render target)
- Auto-deploy on push
- Health checks passing

---

## Deployment URL (After Deployment)

**Production URL**: `https://ca-delivery-vans-analytics.onrender.com`
**Health Check**: `https://ca-delivery-vans-analytics.onrender.com/health`
**Upload Page**: `https://ca-delivery-vans-analytics.onrender.com/`
**Dashboard**: `https://ca-delivery-vans-analytics.onrender.com/dashboard.html`

---

**Last Updated**: 2025-10-13 (Phase 1 Complete)
