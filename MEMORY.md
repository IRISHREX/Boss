# BMS-OPD System Memory Log

> **Rule**: Maintain <= 300 lines. When adding new entries, prune oldest historical records to keep total lines under 300.

---

## [2026-09-24 ~ 2026-09-25] aiccloud VPS Deployment & Troubleshooting



### Task 3: Remote Repository Sync (Frontend & Backend Pull)
* **Date & Time**: 2026-09-25 00:55 ~ 01:05 IST
* **Goal**: Pull latest commits from GitHub repositories and redeploy.
* **Steps Taken**:
  1. `BMS-opd-be`: Pulled `origin/main` (received updates to `controller/reportController.js`).
  2. `BMS-opd-fe`: Switched to tracking branch `origin/Sohel2`, pulled 6 new commits (ID modifications, prescription/invoice fixes, chart layouts).
  3. Resolved missing dependency: installed `react-countup` in `BMS-opd-fe`.
  4. Ensured `.env.production` remained `VITE_BASE_URL=https://biomechasoft.in`.
  5. Built production bundle (`npm run build`) and redeployed both BE and FE to VPS.

---

### Task 4: Local VPS MongoDB 8.0 Installation & Database Migration
* **Date & Time**: 2026-09-25 01:07 ~ 01:25 IST
* **Goal**: Migrate from MongoDB Atlas to local VPS MongoDB for sub-millisecond query speed, while preserving Atlas as automatic failover.
* **Steps Taken**:
  1. Installed MongoDB 8.0 Community Edition (`mongodb-org`, `mongodb-org-tools`) on Ubuntu 24.04 noble.
  2. Optimized memory footprint in `/etc/mongod.conf`:
     - Configured `wiredTiger.engineConfig.cacheSizeGB: 0.25` (256 MB) to prevent out-of-memory on 1GB RAM VPS.
     - Bound to `127.0.0.1:27017`.
  3. Migrated entire database from Atlas using `mongodump` & `mongorestore`:
     - Restored **5,399 total documents** into `MERN_STACK_HOSPITAL_MANAGEMENT` with 0 failures.
     - Preserved: 4,115 medicines, 917 diagnostic tests, 236 logs, 44 messages, 15 users, all appointments & prescriptions.
  4. Updated `BMS-opd-be/database/dbConnection.js`:
     - Primary: Connects to local `mongodb://127.0.0.1:27017/MERN_STACK_HOSPITAL_MANAGEMENT` (<1ms latency).
     - Failover: Automatically falls back to MongoDB Atlas cluster if local service is unavailable.
  5. Restarted PM2: verified `bms-backend` online and connected to local MongoDB.

---

### Task 5: aiccloud S3 Object Storage Integration & Automated Daily Backup
* **Date & Time**: 2026-09-25 01:25 ~ 01:40 IST
* **Goal**: Connect user's aiccloud S3 bucket for file storage and automated database/CSV backups.
* **Credentials Configured**:
  - Endpoint: `https://s3.aiccloud.online`
  - Bucket: `aic-585105c0`
  - Region: `us-east-1`
  - Access Key: `4987216CA9E680068A03`
* **Steps Taken**:
  1. Installed `@aws-sdk/client-s3` in `BMS-opd-be`.
  2. Created `BMS-opd-be/utils/s3Storage.js` supporting direct uploads, CSV exports, and object listing.
  3. Added S3 backup controller routes:
     - `POST /api/v1/backup/s3/trigger`
     - `GET /api/v1/backup/s3/list`
  4. Created CLI automation script `BMS-opd-be/scripts/runS3Backup.js`.
  5. Created `/root/backup-to-s3.sh` and scheduled cron job at `02:00 AM UTC` daily:
     - Dumps compressed MongoDB `.gz` archive.
     - Generates and uploads human-readable Appointments CSV, Patients CSV, and Medicines Master CSV to S3.
     - Prunes local backups older than 7 days.
  6. Verified initial run: confirmed `.gz` archive and CSV files uploaded to `aic-585105c0` bucket.

---

### Task 6: GitHub Version Control Push
* **Date & Time**: 2026-09-25 06:44 IST
* **Goal**: Commit and push all work to GitHub.
* **Steps Taken**:
  1. `BMS-opd-be` (`origin/main`): Committed `f56557f` ("feat: add local mongodb failover, aiccloud s3 backup integration").
  2. `BMS-opd-fe` (`origin/Sohel2`): Committed `6ca9d6d` ("chore: point production API to biomechasoft.in and add react-countup").
  3. Root repo `BMS-OPD` (`origin/main`): Committed `ce08926` updating submodule pointers. All pushed cleanly.

---

### Task 7: S3 Doctor Assets Storage & Image Serving Resolution
* **Date & Time**: 2026-09-25 07:05 ~ 07:25 IST
* **Goal**: Fix doctor stamp, avatar (DP), header, and footer images failing to load in frontend and PDF previews.
* **Root Causes Identified**:
  1. **Nginx Missing Route**: Nginx on VPS lacked a `location /uploads` directive. Requests for `/uploads/doctors/...` were caught by `location /` and returned `index.html` (text/html) instead of image bytes.
  2. **Private S3 Bucket**: The aiccloud S3 bucket is private; direct browser requests to `https://s3.aiccloud.online/aic-585105c0/...` return `403 Forbidden AccessDenied`.
  3. **No S3 Sync for Uploads**: Multer was saving uploaded images strictly to local disk `/uploads/doctors/` without uploading to S3.
  4. **Missing footerImage Field**: `footerImage` was absent from `userSchema.js`, `upload.js`, and `userController.js`.
* **Steps Taken**:
  1. Updated `BMS-opd-be/models/userSchema.js` and `middlewares/upload.js` to add `footerImage`.
  2. Updated `userController.js` (`addNewDoctor`, `updateUserById`, `updateDoctorProfile`) to asynchronously upload doctor images (`docAvatar`, `stampImage`, `signImage`, `headerImage`, `footerImage`) directly to S3 bucket `aic-585105c0` under `doctors/`.
  3. Implemented smart S3 fallback endpoint in `app.js` (`GET /uploads/doctors/:filename`): serves from local disk cache, and if missing, streams from S3 bucket and caches locally.
  4. Updated Nginx config on VPS to proxy `/uploads` to backend (`127.0.0.1:5000`) and restarted Nginx.
  5. Synced all 20 existing doctor uploads from VPS disk to S3 bucket `aic-585105c0/doctors/`.
  6. Verified over HTTPS: `https://biomechasoft.in/uploads/doctors/...` now returns `HTTP 200 OK` with `Content-Type: image/jpeg`.
  7. Committed & pushed backend changes (`e829598`) and root submodule pointer (`d4e4f78`).

---

### Task 8: Prescription PDF Storage (S3, 3-Version Rolling Retention) & Multi-View Downloads
* **Date & Time**: 2026-09-25 09:30 ~ 10:15 IST
* **Goal**: Enable direct PDF generation and saving to S3 disk storage, retaining up to 3 prescriptions per patient (same-day overwrites, >3 oldest purged). Add date-selection download modal across Dashboard, Reports, and Messages.
* **Steps Taken**:
  1. Updated `prescriptionSchema.js` with `pdfFiles` array (`date`, `s3Key`, `s3Url`, `savedAt`).
  2. Implemented S3 helpers in `s3Storage.js` (`uploadPrescriptionPdfToS3`, `deleteS3Object`, `getPresignedDownloadUrl`). Installed `@aws-sdk/s3-request-presigner`.
  3. Added backend routes in `prescriptionRouter.js` and controller functions in `prescriptionController.js` (`savePrescriptionPdf`, `listPrescriptionPdfs`).
  4. Added `handleSavePdf` and "💾 Save PDF" button in `Preview.jsx`.
  5. Created `DownloadPrescriptionModal.jsx` and `DownloadPrescriptionModal.css` for date-selection downloads via presigned URLs.
  6. Added PDF download triggers in `Dashboard.jsx`, `ReportsPage.jsx`, and `Messages.jsx` (via `MessageCard.jsx` / `MessageList.jsx`).

---

### Task 9: Doctor Footer Placement & Form Field Tweak
* **Date & Time**: 2026-09-25 10:20 ~ 10:35 IST
* **Goal**: Fix doctor's footer image rendering in place of signature/stamp while default blue footer was still appearing at bottom.
* **Root Cause**: `AddNewDoctor.jsx` mislabeled the `signImage` input as "Footer Image (optional)" and lacked a `footerImage` input, storing the footer banner in `signImage`.
* **Steps Taken**:
  1. Updated `AddNewDoctor.jsx`: separated inputs into "Signature Image (optional)" and "Footer Image (optional)" with full preview and submit support.
  2. Migrated Dr. Tarikul Alam's document in MongoDB on VPS: moved the ThyroGen banner from `signImage` to `footerImage` and set `signImage: null`.
  3. Updated `MyDocument.jsx` and `Preview.jsx`: ensured custom doctor footer replaces `/Footer.png` at the bottom and does not appear in credentials section.

---

### Task 10: General Settings Branding, Location QR Code, Receipt/Prescription Hierarchy & Template Builder Fix
* **Date & Time**: 2026-09-25 11:00 ~ 11:35 IST
* **Goal**: Fix HTTP 413 error and TemplateBuilder state mutation error, implement Organization Settings with Location QR code, uploadable Default Header & Footer, and apply branding hierarchy across Prescriptions and Receipts.
* **Steps Taken**:
  1. **Fixed HTTP 413 on VPS**: Added `client_max_body_size 50M;` to Nginx config and reloaded. Updated prescription saving flow to store structured JSON data in MongoDB with rolling 3-version retention, generating PDFs client-side on demand for fast, lightweight storage.
  2. **Fixed TemplateBuilder Error**: Resolved `TypeError: Cannot assign to read only property 'prescriptionTemplate'` by updating React context state immutably (`setAdmin(prev => ({ ...prev, prescriptionTemplate: tmpl.name }))`).
  3. **Backend General Settings API**: Created `generalSettingsSchema.js`, `generalSettingsController.js`, and `generalSettingsRouter.js` mounted at `/api/v1/settings/general` with multer upload middleware (`uploadClinicImagesDisk`) and S3 background sync.
  4. **Frontend Organization & Branding UI**: Added `OrganizationSettings.jsx` inside `ThemeSettings.jsx` providing editable clinic details (Org Name, Reg No, Address, Owner, Platform Fee, Google Location URL), live Location QR code generator (`qrcode`), and image uploaders for Default Header & Footer.
  5. **Prescription Branding Hierarchy**: Updated `Preview.jsx` and PDF templates to use `doctor.headerImage || generalSettings.defaultHeaderImage` and `doctor.footerImage || generalSettings.defaultFooterImage`.
  6. **Receipt / Invoice Branding**: Updated OPD receipts in `Appointment.jsx` and `ReportsPage.jsx` using `generalSettingsUtil.js` to render the Default Header, Organization details, Platform Fee, Google Location QR code, and Default Footer.
  7. **Redeployment & Git Push**: Built frontend, deployed backend and frontend to aiccloud VPS (`https://biomechasoft.in`), verified live API response, and pushed all commits to GitHub.

---

### Task 11: Receipt Serial Numbers, Multi-Step Referral, Prescription Details & Report Data Mismatch Fix
* **Date & Time**: 2026-09-25 13:00 ~ 13:30 IST
* **Goal**:
  1. Add Doctor-wise Day-wise serial numbers (`#01`, `#02` and `REC-YYYYMMDD-DOC-XX`) to OPD receipts with Header, Footer, and Location QR code.
  2. Transform Create Referral into a 3-step wizard with step indicators and validation.
  3. Ensure downloadable prescription uses selected default template and renders all clinical/demographic details.
  4. Resolve data mismatch between Dashboard Appointments and Reports table (MINA KHATUN appearing for multiple patients).
* **Root Causes & Solutions**:
  1. **Data Mismatch in Reports**: When multiple family members booked appointments using the same phone (`9749626905`), they shared MINA KHATUN's User `patientId`. In `ReportsPage.jsx`, patient name checked `r.patientId` first, rendering "MINA KHATUN" for AZAHARUDDIN and ABDUL ALIM. Fixed by prioritizing `r.appointmentId?.name`.
  2. **Payment Status Discrepancy**: ABDUL ALIM was marked "Completed" in appointments, which auto-synced the report status to "Paid". Because ABDUL ALIM was mistakenly displaying as "MINA KHATUN", it looked like Mina Khatun was "Paid" in Reports while "Pending" on Dashboard. Correcting the name completely aligned both views.
  3. **Total Patients: 0**: `ReportsPage.jsx` called `/api/v1/user/patients` which was missing on backend. Implemented `getAllPatients` and route `/user/patients` in `userController.js` and `userRouter.js`.
  4. **Multi-Step Referral**: Created `CreateReferralTab.css` and updated `CreateReferralTab.jsx` with a responsive 3-step wizard.
  5. **Receipt Serial**: Updated `invoiceController.js` and `generalSettingsUtil.js` to compute daily doctor serials and embed QR code.
  6. **Prescription Download**: Updated `prescriptionSchema.js`, `prescriptionController.js`, and `DownloadPrescriptionModal.jsx` to persist and load template and all clinical fields.
* **Redeployment**:
  - Rebuilt frontend with `npm run build`.
  - Deployed BE and FE to aiccloud VPS (`https://biomechasoft.in`).
  - Committed & pushed `BMS-opd-be` (`origin/main`) and `BMS-opd-fe` (`origin/Sohel2`).

---

### Task 12: Prescription Save and Recipient Notification Reliability
* **Date & Time**: 2026-09-25 18:16 IST
* **Goal**: Fix the misleading prescription-save error and ensure prescription notifications are delivered to the assigned doctor.
* **Steps Taken**:
  1. Inspected the live backend logs and identified message-validation failures caused by notifications using missing appointment `firstName` values.
  2. Updated `Prescription.jsx` to use the saved prescription's resolved doctor as the message `recipient`, with valid system sender details and the current site URL in the preview link.
  3. Separated a failed save from an after-save UI issue, preserving the server's error message instead of reporting a false combined save/notification failure.
  4. Updated appointment status notifications to use a valid system sender and the appointment patient as recipient.

---

### Task 13: aiccloud VPS Redeployment & Git Synchronization
* **Date & Time**: 2026-09-25 18:30 ~ 18:50 IST
* **Goal**: Rebuild and redeploy frontend and backend to aiccloud VPS (`https://biomechasoft.in`), fix directory upload filter in backend deployment, commit and push changes across all repositories.
* **Steps Taken**:
  1. Rebuilt frontend bundle (`npm run build`) in `BMS-opd-fe` with `VITE_BASE_URL=https://biomechasoft.in`.
  2. Deployed frontend dist to VPS (`/root/BMS-opd-fe`) via `deploy-frontend-now.js` and restarted Nginx. Verified `HTTP 200 OK`.
  3. Optimized backend deployment filter in `deploy-backend-now.js` (normalized paths to skip `node_modules` and `.git` subtrees).
  4. Deployed backend to `/root/BMS-opd-be` on VPS, uploaded `.env`, ran `npm install --production`, and restarted PM2 (`bms-backend`). Verified local MongoDB connection and online status.
  5. Committed & pushed backend `controller/appointmentController.js` to `BMS-opd-be` (`origin/main`).
  6. Committed & pushed frontend `src/components/Prescription.jsx` to `BMS-opd-fe` (`origin/Sohel2`).
  7. Committed & pushed root repo submodule pointers and deployment scripts to `BMS-OPD` (`origin/main`).

---

### Task 14: Dynamic Deployment CLI (`aiccloud-deployment`) Creation & Verification
* **Date & Time**: 2026-09-25 18:55 ~ 19:15 IST
* **Goal**: Build dynamic deployment package in `aiccloud-deployment` supporting interactive local path configuration, file staging display (`npm run add be/fe`), automated build/git push/deployment (`npm run push be/fe`), and deployment status & 3-line log reporting (`npm run report be/fe`).
* **Steps Taken**:
  1. Created `aiccloud-deployment/package.json` with scripts (`setup`, `add`, `add:be`, `add:fe`, `push`, `push:be`, `push:fe`, `report`, `report:be`, `report:fe`).
  2. Implemented `config.js` with interactive prompt fallback for `LOCAL_PROJECT_ROOT`, `LOCAL_BACKEND_PATH`, and `LOCAL_FRONTEND_PATH`.
  3. Implemented `sshClient.js` with automated retry, authentication, and node-ssh fallback resolution.
  4. Implemented `history.js` with JSON-backed deployment auditing (`deployment-state.json`).
  5. Implemented `cli.js` supporting:
     - `add be` / `add fe`: stages files and clearly displays file status in terminal with git summary.
     - `push be`: commits/pushes to `origin/main`, uploads to VPS excluding `node_modules` and `.git`, installs dependencies, restarts PM2, and tails startup logs.
     - `push fe`: commits/pushes to `origin/Sohel2`, runs `npm run build`, uploads `dist/` to VPS, and restarts Nginx.
     - `report be` / `report fe` / `report`: connects to VPS and outputs last deployment timestamp along with the last 3 stdout and stderr/access log lines.
  6. Verified CLI commands (`npm run report:be`, `npm run report:fe`, `add be`, `add fe`). All succeeded with clean outputs.
  7. Updated `AGENTS.md` to document the dynamic deployment workflow.

---

### Task 15: Fix Prescription Save "admin is not defined" ReferenceError & Redeploy
* **Date & Time**: 2026-09-25 19:20 ~ 19:55 IST
* **Goal**: Fix `ReferenceError: admin is not defined` thrown in frontend console when saving a prescription, and ensure full deployment to VPS.
* **Root Cause**: `Prescription.jsx` line 1304 referenced `admin?.prescriptionTemplate`, but `admin` was never declared or selected from context/Redux in `Prescription.jsx`, causing `handleSave` to throw a client-side `ReferenceError` before sending the request.
* **Steps Taken**:
  1. Updated `Prescription.jsx`: imported `admin` from Redux auth slice (`const admin = useSelector((state) => state.auth?.admin);`).
  2. Rebuilt production bundle (`npm run build`).
  3. Re-uploaded frontend dist to `/root/BMS-opd-fe` on aiccloud VPS and restarted Nginx.
  4. Verified live frontend (`HTTP 200 OK`) and live backend API (`POST / GET` responding).
  5. Committed & pushed frontend changes (`e25f6fb`) to `BMS-opd-fe` (`origin/Sohel2`).

---

### Task 16: Subdomain Migration (`opd.biomechasoft.in`), SSL Configuration & Frontend Deployment
* **Date & Time**: 2026-09-25 23:20 ~ 2026-09-26 00:50 IST
* **Goal**: Move BMS-OPD application to subdomain `https://opd.biomechasoft.in/`, free root domain `https://biomechasoft.in/` (temporary 301 redirect until landing page is ready), ensure SSL/HTTPS active, resolve VPS high load / OOM deadlock, and deploy frontend.
* **Steps Taken**:
  1. **DNS & Routing**:
     - Added `opd` A-record pointing to VPS `148.113.6.25`.
     - Configured Nginx at `/etc/nginx/sites-available/default`:
       - `server_name opd.biomechasoft.in`: serves `/root/BMS-opd-fe` and proxies `/api` & `/uploads` to `127.0.0.1:5000`.
       - `server_name biomechasoft.in`: 301 redirects to `https://opd.biomechasoft.in$request_uri`.
     - SSL/HTTPS: Automatically terminated by edge Caddy router.
  2. **Frontend Environment**: Updated `BMS-opd-fe/.env.production` to `VITE_BASE_URL=https://opd.biomechasoft.in`. Built production bundle locally.
  3. **VPS Memory Optimization & Recovery**:
     - Identified previous remote `vite build` process in uninterruptible disk sleep consuming 640MB RAM (load average spiked to 150+).
     - Terminated stuck process (`kill -9 9156 9140 9167`) and removed `/root/build-fe`.
     - Restored server stability: load average dropped to 3.7 with 729MB available RAM.
  4. **Frontend Transfer**:
     - Packaged local production `dist` into `.tar.gz`.
     - Transferred directly to VPS `/root/BMS-opd-fe` via authenticated OpenSSH `scp` in <15s and unpacked.
     - Set permissions (`chmod -R 755 /root/BMS-opd-fe`) and reloaded Nginx.
  5. **Verification**:
     - `https://opd.biomechasoft.in/`: HTTP 200 OK (React app live with full JS bundle).
     - `https://opd.biomechasoft.in/api/`: Express backend proxy responding with CORS headers.
     - `https://biomechasoft.in/`: HTTP 301 redirecting to `https://opd.biomechasoft.in/`.
     - PM2: `bms-backend` online (pid 7364, 0% CPU, 96.9MB RAM).

---

### Task 17: Multi-Domain Deployment (`thyrogendiagnostic.in`), Dedicated Backend (Port 5001) & Isolated Database (`throgendb`)
* **Date & Time**: 2026-09-26 19:15 ~ 20:30 IST
* **Goal**: Deploy BMS-OPD application to new custom domain `https://thyrogendiagnostic.in` (and `www.thyrogendiagnostic.in`), backed by a separate backend instance on port `5001` and an isolated database `throgendb`, while preserving `https://opd.biomechasoft.in` (port `5000`, `MERN_STACK_HOSPITAL_MANAGEMENT`).
* **Steps Taken**:
  1. **Database Migration & Isolation**:
     - Dumped all collections (medicines, diagnostic tests, users, templates, settings) and restored into new database `throgendb` on local MongoDB 8.0 (`mongorestore --nsFrom="MERN_STACK_HOSPITAL_MANAGEMENT.*" --nsTo="throgendb.*"`).
     - Verified `throgendb` has 5,597 documents restored and is completely isolated from `MERN_STACK_HOSPITAL_MANAGEMENT`.
  2. **Dedicated Backend Setup (`thyrogen-backend`)**:
     - Created `/root/thyrogen-be` on VPS with `.env` pointing to `PORT=5001` and `MONGO_URI=mongodb://127.0.0.1:27017/throgendb`.
     - Registered and started PM2 process `thyrogen-backend` listening on port `5001`. Verified local connection.
  3. **Universal Same-Origin Frontend Routing**:
     - Updated `BMS-opd-fe/src/utils/api.js` to dynamically fall back to same-origin relative paths (`""`) in production when `VITE_BASE_URL` is empty.
     - Built production bundle locally and transferred `dist.tar.gz` to VPS via SFTP stream.
     - Deployed frontend to both `/root/BMS-opd-fe` and dedicated `/root/thyrogen-fe`.
  4. **Nginx Multi-Site Configuration**:
     - Configured `/etc/nginx/sites-available/default`:
       - `server_name opd.biomechasoft.in`: serves `/root/BMS-opd-fe`, proxies `/api` and `/uploads` to port `5000`.
       - `server_name thyrogendiagnostic.in www.thyrogendiagnostic.in`: serves `/root/thyrogen-fe`, proxies `/api` and `/uploads` to port `5001`.
       - `server_name biomechasoft.in www.biomechasoft.in`: 301 redirects to `https://opd.biomechasoft.in$request_uri`.
     - Validated syntax (`nginx -t`) and reloaded Nginx.
  5. **Automated Backup Enhancement**:
     - Updated `/root/backup-to-s3.sh` to dump and upload archives for both `MERN_STACK_HOSPITAL_MANAGEMENT` and `throgendb` to the S3 bucket daily.
  6. **Verification Over HTTPS**:
     - `https://thyrogendiagnostic.in`: HTTP 200 OK (React frontend).
     - `https://thyrogendiagnostic.in/api/v1/user/doctors`: HTTP 200 OK (Express on port 5001 + throgendb).
     - `https://opd.biomechasoft.in`: HTTP 200 OK (React frontend).
     - `https://opd.biomechasoft.in/api/v1/user/doctors`: HTTP 200 OK (Express on port 5000 + MERN_STACK_HOSPITAL_MANAGEMENT).

