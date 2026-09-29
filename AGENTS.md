# BMS-OPD Deployment & Infrastructure Guide

## System Memory Maintenance Rule
* **Memory Log File**: `MEMORY.md` located in the root repository.
* **Format**: Document all executed tasks with **Date**, **Time**, **Task Goal**,**User's Name** and **Step-by-Step Actions**.
* **Strict Limit**: Maintain `MEMORY.md` under **500 lines**. Whenever new tasks cause the file to exceed 500 lines, delete the oldest historical records to keep the file <= 500 lines.

---

## aiccloud VPS Deployment & Infrastructure
Whenever working with the aiccloud production VPS:

### 1. Target Infrastructure
* **App 1 (ThyroGen Diagnostic Website - SSR & Dynamic Portals)**:
  * **Domain**: `https://thyrogendiagnostic.in` and `https://www.thyrogendiagnostic.in`
  * **SSR Node Path**: `/root/thyrogen-website` (managed via PM2 as `thyrogen-website` on port `3002`)
  * **Static Assets**: `/root/thyrogen-website/public/assets`
* **App 2 (ThyroGen OPD Web Application)**:
  * **Domain**: `https://opd.thyrogendiagnostic.in`
  * **Frontend Path**: `/root/thyrogen-opd-fe` (served via Nginx)
  * **Backend Path**: `/root/thyrogen-be` (managed via PM2 as `thyrogen-backend` on port `5001`)
  * **Database**: Local MongoDB 8.0 on VPS `mongodb://127.0.0.1:27017/throgendb`
* **Decommissioned**:
  * BioMechaSoft (`biomechasoft.in`, `opd.biomechasoft.in`, `/root/BMS-opd-fe`, `/root/BMS-opd-be`, PM2 `bms-backend` on port 5000, and DB `MERN_STACK_HOSPITAL_MANAGEMENT`) completely decommissioned and removed.
* **VPS Details**:
  * **VPS IP**: `148.113.6.25`
  * **SSH Port**: `20172`
  * **SSH User**: `root`
  * **Password**: `8jMA1A_-TsMKEOKd`
* **Failover Database**: MongoDB Atlas `mongodb+srv://Irishrex:Samima2006@irishrex.p1e0kow.mongodb.net/`
* **S3 Object Storage**:
  * **Endpoint**: `https://s3.aiccloud.online`
  * **Bucket**: `aic-585105c0`
  * **Region**: `us-east-1`
  * **Access Key**: `4987216CA9E680068A03`
  * **Secret Key**: `iFoDGF0LaDaGqkg7FoJB7z4sUf8`
* **Automated Daily Backup**: Runs via cron at `02:00 AM UTC` (`/root/backup-to-s3.sh`) dumping compressed MongoDB archive of `throgendb` directly into the S3 bucket.

### 2. How to Deploy to aiccloud VPS
#### Dynamic Deployment CLI (Recommended):
From `c:\PROJECTS\BMS-OPD\aiccloud-deployment`:
```bash
npm run setup       # Configure local paths (LOCAL_PROJECT_ROOT, LOCAL_BACKEND_PATH, LOCAL_FRONTEND_PATH)
npm run add be      # Stage changed backend files and display in terminal
npm run add fe      # Stage changed frontend files and display in terminal
npm run push be     # Push backend to Git + upload to VPS + restart PM2
npm run push fe     # Push frontend to Git + local build + upload to VPS + restart Nginx
npm run report be   # Last backend deploy time and last 3 PM2 stdout/error logs
npm run report fe   # Last frontend deploy time and last 3 Nginx access/error logs
npm run report      # Full status report for both Frontend and Backend
```

#### Legacy Direct Scripts:
```bash
# In BMS-opd-fe directory:
npm run build

# In project root c:\PROJECTS\BMS-OPD:
node deploy-frontend-now.js
node deploy-backend-now.js
```

---

## Hostinger Deployment Memory
Whenever the user asks to **"deploy to hostinger"**:

### 1. Target Infrastructure
* **Frontend Target URL**: `https://novel.mkinfotrack.com`
* **Hostinger Server IP**: `147.93.17.56`
* **SSH Port**: `65002`
* **SSH User**: `u832627210`
* **Remote Path**: `/home/u832627210/domains/mkinfotrack.com/public_html/novel`
* **Backend API**: `https://bms-opd-be.onrender.com` (hosted on Render)

### 2. How to Deploy Frontend to Hostinger
Run the automated deployment script located in project root:
```bash
# In BMS-opd-fe directory:
npm run build

# In project root c:\PROJECTS\BMS-OPD:
node deploy-hostinger.js
```

## Git Branches & Synchronization Rules
* **Git Branches**:
  * Backend (`BMS-opd-be`): `origin/main`
  * Frontend (`BMS-opd-fe`): `origin/Sohel2`

### Mandatory Git Workflow Rules:
1. **Always Pull Before Starting Work**:
   * Before starting any new task, inspect and pull latest changes from remote:
     * `cd BMS-opd-be && git pull origin main`
     * `cd BMS-opd-fe && git pull origin Sohel2`
   * **Smart Skip Condition**: If the last local pull is more recent than the last push (or if a pull was already verified in the current active session without subsequent remote activity), assume pull is taken and proceed.
2. **Always Push After Completing Task**:
   * Once a task is completed, verified, or deployed:
     * Stage all modified files and commit with a clear, descriptive message.
     * Push immediately to the respective remote branch (`BMS-opd-be` -> `origin/main`, `BMS-opd-fe` -> `origin/Sohel2`, `BOSS` -> `origin/main`, `thyrogen` -> `origin/main`).
3. **Timestamped Push Notification**:
   * Whenever changes are pushed, document and announce them with exact **Date & Time (IST)**, commit hash, and summary of changes.
   * Explicitly remind the user to take a pull on any other local clones or environments.
   * Record every push and deployment in `MEMORY.md` within the task log.
   * Read `MEMORY.md` after taking pull and  before starting any new task.

