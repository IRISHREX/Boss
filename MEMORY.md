# BMS-OPD System Memory Log

> **Rule**: Maintain <= 300 lines. When adding new entries, prune oldest historical records to keep total lines under 300.

---

## [2026-09-24 ~ 2026-09-25] aiccloud VPS Deployment & Troubleshooting





### Task 9: Doctor Footer Placement & Form Field Tweak
* **Date & Time**: 2026-09-25 10:20 ~ 10:35 IST
* **Summary**: Fixed doctor footer banner rendering in `signImage`. Separated `AddNewDoctor.jsx` inputs into Signature and Footer images. Migrated Dr. Tarikul Alam doc on MongoDB VPS to `footerImage`. Updated `MyDocument.jsx` and `Preview.jsx`.

---

### Task 10: General Settings Branding, Location QR Code & Template Builder Fix
* **Date & Time**: 2026-09-25 11:00 ~ 11:35 IST
* **Summary**: Fixed HTTP 413 on VPS (50M client_max_body_size), resolved TemplateBuilder immutable state error, implemented `/api/v1/settings/general` schema/controller, built `OrganizationSettings.jsx` with Google Location QR generator, and updated receipt/prescription branding hierarchy. Redeployed to VPS.

---

### Task 11: Receipt Serial Numbers, Multi-Step Referral & Report Data Mismatch Fix
* **Date & Time**: 2026-09-25 13:00 ~ 13:30 IST
* **Summary**: Added doctor-wise daily serial numbers to receipts. Fixed patient data mismatch in reports where shared phone numbers displayed same patient name by prioritizing `r.appointmentId?.name`. Implemented missing `/api/v1/user/patients` route. Built 3-step referral wizard. Redeployed and pushed.

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

---

### Task 18: Agent Git Workflow Rules Setup & Full Repository Sync
* **Date & Time**: 2026-09-26 22:45 IST
* **Goal**: Establish mandatory agent workflow rules (always pull before starting, push after task completion, report timestamped push and notify user to pull, optimize pull if last pull is more recent than push) and synchronize both frontend and backend repositories with GitHub.
* **Steps Taken**:
  1. Updated `Boss/AGENTS.md` with explicit Git synchronization and workflow rules.
  2. Created workspace agent rule `.agents/rules/git-workflow.md` for IDE-wide enforcement across turns.
  3. Pulled latest changes in `BMS-opd-be` (`origin/main`, updated `controller/appointmentController.js` at commit `dbe7ae4`).
  4. Pulled, rebased, and pushed `BMS-opd-fe` changes (`origin/Sohel2`, commit `4e9574e`).
  5. Both repositories verified clean and 100% up to date with remote.

---

### Task 19: ThyroGen Diagnostic & Health Care Unit Website - Phase 1 Foundation
* **Date & Time**: 2026-09-27 05:40 IST
* **Goal**: Implement Phase 1 of `https://github.com/IRISHREX/thyrogen.git` strictly adhering to zero-hallucination policy and verified business data.
* **Steps Taken**:
  1. Cloned `thyrogen` repository and installed dependencies cleanly with Vite 8 + TanStack Start.
  2. Implemented `SiteHeader` with brand logo, desktop/mobile navigation, phone call actions (`9134101587`, `8001101641`), secondary CTA "Book Test", primary CTA "Book Appointment".
  3. Implemented `SiteFooter` with Bengali address, verified helpline numbers, service/legal links, and Mehebub Dhuliyan association tag.
  4. Implemented Home page sections: Hero, Services, Popular Tests (empty state pending DB), Health Packages (empty state pending DB), Doctor Chamber ("No doctors have been added yet"), How It Works (4 steps), and Contact.
  5. Implemented zero-hallucination directory & detail routes across Pathology, Radiology, Packages, Doctors, Appointments, Reports, Home Collection, and Contact.
  6. Verified local production build (`npm run build` completed with 0 errors).
  7. Committed (`7b2d814`) and pushed to `main` branch on GitHub.

---

### Task 20: ThyroGen Website - Phase 2 Supabase PostgreSQL Schema, RLS & Data Layer
* **Date & Time**: 2026-09-27 05:58 IST
* **Goal**: Implement Phase 2 database, authentication, and security foundation for ThyroGen.
* **Steps Taken**:
  1. Verified remote sync with `git pull origin main` (already up to date).
  2. Installed `@supabase/supabase-js` without security vulnerabilities.
  3. Created `supabase/migrations/20260927000000_init_thyrogen_schema.sql` and `supabase/schema.sql` with full relational PostgreSQL tables (`profiles`, `doctors`, `doctor_schedules`, `test_categories`, `lab_tests`, `radiology_services`, `packages`, `appointments`, `reports`, `home_collection_bookings`, `site_settings`).
  4. Configured Row Level Security (RLS) policies for patient privacy, public viewing of active tests/doctors, and admin-only management.
  5. Implemented safe Supabase client `src/lib/supabase.ts` with SSR and mock-safe fallback.
  6. Implemented typed data access services `src/lib/services.ts` and Auth context/hook `src/lib/auth-context.tsx`.
  7. Seeded verified diagnostic centre information and standard pathology categories.
  8. Verified production build (`npm run build` completed with 0 errors).
  9. Committed (`599a641`) and pushed to GitHub `origin/main`.

---

### Task 21: ThyroGen Website - Phase 3 Doctor Chamber, Profiles & Appointment Booking
* **Date & Time**: 2026-09-27 06:02 IST
* **Goal**: Implement Phase 3 Doctor Directory, individual doctor profile routing, chamber schedules, and patient appointment booking form with zero-hallucination compliance.
* **Steps Taken**:
  1. Verified remote sync with `git pull origin main` (already up to date).
  2. Created `src/components/doctor-components.tsx`:
     - `DoctorDirectory`: Loads active doctors from Supabase via `fetchDoctors()`. When database is empty, displays strictly required zero-hallucination notice *"No doctors have been added yet."* with quick call CTAs (`9134101587` & `8001101641`).
     - `DoctorDetail`: Dynamic doctor profile route loading doctor by ID and chamber schedules per day of week with direct appointment action.
  3. Created `src/components/appointment-form.tsx`:
     - Responsive patient appointment booking form supporting patient name, 10-digit mobile, age, gender, doctor selection (dynamically populated with query parameter pre-selection), preferred date with min=today, time slot, and clinical symptoms/notes.
     - Confirmation screen displaying booking details and helpline follow-up instructions.
  4. Updated routes:
     - `src/routes/doctors.index.tsx`: Wired to `DoctorDirectory` with complete SEO tags.
     - `src/routes/doctors.$id.tsx`: Wired to `DoctorDetail` with param extraction.
     - `src/routes/appointment.tsx`: Wired to `AppointmentBooking` with Zod search param validation.
  5. Verified local build (`npm run build` completed with 0 errors) and dev server routes (`/doctors` and `/appointment` HTTP 200 OK).
  6. Committed (`ca33f44`) and pushed to GitHub `origin/main`.

---

### Task 22: ThyroGen Website - Phase 4 Live Referral API Bridge & Edge Function
* **Date & Time**: 2026-09-27 06:05 IST
* **Goal**: Bridge patient appointment booking directly with ThyroGen OPD backend (`POST https://thyrogendiagnostic.in/api/v1/referral/book`) via Supabase Edge Function isolation and resilient service fallback.
* **Steps Taken**:
  1. Verified remote sync with `git pull origin main` (already up to date).
  2. Created Supabase Edge Function `supabase/functions/book-referral/index.ts` to bridge inbound web requests to backend referral desk on port 5001.
  3. Updated `src/lib/services.ts` `bookAppointment` to sync with `https://thyrogendiagnostic.in/api/v1/referral/book` with an 8-second timeout, extracting the official OPD referral token (e.g. `REF-XXXXX`).
  4. Updated `src/components/appointment-form.tsx` to prominently present the live token reference on the success confirmation card.
  5. Tested live HTTP referral booking via Node: confirmed `success: true` and generation of tracking token `REF-1790469263572-10` from live backend.
  6. Verified local production build (`npm run build` completed with 0 errors).
  7. Committed (`82b07f5`) and pushed to GitHub `origin/main`.

---

### Task 23: ThyroGen Website - Phase 5 Pathology, Radiology & Health Packages Catalogues
* **Date & Time**: 2026-09-27 06:10 IST
* **Goal**: Implement complete interactive catalogues and dynamic detail pages for Pathology Tests, Radiology & Imaging Services, and Preventive Health Packages with zero-hallucination compliance.
* **Steps Taken**:
  1. Verified remote sync with `git pull origin main` (already up to date).
  2. Extended `src/lib/services.ts` with single-item lookups (`fetchLabTestById`, `fetchRadiologyServiceById`, `fetchPackageById`).
  3. Created `src/components/catalogue-components.tsx`:
     - `TestsCatalogue`: Live search bar, category pill filters (Hematology, Biochemistry, Endocrinology, Immunology, Clinical Pathology, Microbiology), test cards with specimen, fasting requirement, and turnaround time. Zero-hallucination fallback notice when unconfigured.
     - `TestDetail`: Full test breakdown with specimen requirements, fasting guidelines, and direct booking actions.
     - `RadiologyCatalogue` & `RadiologyDetail`: Imaging modalities with patient preparation instructions and fee breakdown.
     - `PackagesCatalogue` & `PackageDetail`: Comprehensive wellness checkup profiles with parameter count, test list, and discount calculations.
  4. Updated routes:
     - `src/routes/tests.index.tsx` & `src/routes/tests.$id.tsx`
     - `src/routes/radiology.index.tsx` & `src/routes/radiology.$id.tsx`
     - `src/routes/packages.index.tsx` & `src/routes/packages.$id.tsx`
  5. Tested dev server routes (`/tests`, `/radiology`, `/packages` all returning HTTP 200 OK) and verified production bundle with `npm run build` (0 errors).
  6. Committed (`9706c7b`) and pushed to GitHub `origin/main`.

---

### Task 24: ThyroGen Website - Phase 6 Reports & Doorstep Phlebotomy, UI/UX Enhancements & Phase 7 Admin Portal
* **Date & Time**: 2026-09-27 06:40 IST
* **Goal**: Implement Phase 6 (online reports portal & doorstep home collection), enhance UI/UX across all catalogues and appointment forms, and deliver Phase 7 comprehensive staff/admin management console.
* **Steps Taken**:
  1. Built `src/components/report-components.tsx`:
     - `ReportsPortal`: Secure lookup by registered phone & bill number/receipt code via `lookupReport` RPC, downloadable report metadata, physical collection guidelines.
     - `HomeCollectionPortal`: Patient demographics, address, pincode (default `742202`), date/time window, fasting indicator, quick-add test chips (CBC, Thyroid, Lipid, Glucose, HbA1c, LFT, KFT), and direct WhatsApp booking.
  2. Implemented `MobileQuickBar` in `src/components/site-shell.tsx` and wired into `src/routes/__root.tsx`.
  3. UI/UX Enhancements & Cross-linking:
     - Clear `(X)` buttons in search bars across Pathology, Radiology, Packages, and Doctors.
     - Separated zero-hallucination database empty state from zero-match search query state with reset buttons.
     - Added specialty filters and search bar to `DoctorDirectory`.
     - Direct pre-filling: test detail links to `/home-collection?test=...`, radiology detail links to `/appointment?service=...`, package cards link to `/home-collection?test=...`.
     - WhatsApp direct booking cards with pre-filled inquiries across appointment and home collection forms.
  4. Built Phase 7 Staff & Admin Portal:
     - `src/components/admin-components.tsx` & `src/routes/admin.tsx`.
     - Includes KPI metrics, Appointments desk (status updates: confirmed, completed, cancelled), Home Collections desk, Doctor chamber manager, Pathology test & pricing manager, and Patient Report publisher.
  5. Verified all 11 routes (`/`, `/about`, `/contact`, `/doctors`, `/tests`, `/radiology`, `/packages`, `/appointment`, `/reports`, `/home-collection`, `/admin`) return HTTP 200 OK.
  6. Verified production build (`npm run build` completed cleanly in 1.97s).
  7. Committed (`760d8d9`) and pushed to `thyrogen` GitHub `origin/main`.

---

### Task 25: Live ThyroGen Doctor API & Referral Appointment Integration
* **Date & Time**: 2026-09-27 06:48 IST
* **Goal**: Switch Doctor Directory, Doctor Details, and Appointment Booking to live ThyroGen APIs (`/api/v1/user/doctors`, `/api/v1/user/doctor/:id`, and `/api/v1/referral/book`).
* **Steps Taken**:
  1. Tested and verified live public endpoints at `https://thyrogendiagnostic.in/api/v1`:
     - `GET /user/doctors`: returns active specialist doctors (Dr. Tarikul Alam, Dr. Romy Saikh) with qualifications, fees, and avatars.
     - `GET /user/doctor/:id`: returns individual doctor profiles.
     - `POST /referral/book`: registers referral appointment with target doctor and returns tracking token (`REF-XXXXX`).
  2. Updated `src/lib/services.ts`:
     - `fetchDoctors()` maps backend schema (`firstName`, `lastName`, `docAvatar`, `visitingFee`, `doctorDepartment`) to `Doctor` interface.
     - `fetchDoctorById(id)` queries live endpoint with fallback.
     - `bookAppointment()` forwards patient demographics, doctor ID/name, department, and symptoms to `/referral/book`.
  3. Updated TanStack Router routes (`src/routes/doctors.index.tsx`, `src/routes/doctors.$id.tsx`) with SSR route loaders.
  4. Updated `src/components/appointment-form.tsx` to pass doctor department.
  5. Verified SSR on `/doctors`: confirmed Dr. Tarikul Alam and Dr. Romy Saikh render dynamically.
  6. Verified production build (`npm run build` passed with 0 errors).
  7. Committed (`eeebbac`) and pushed `thyrogen` to `origin/main`.







