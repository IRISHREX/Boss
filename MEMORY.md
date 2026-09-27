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
* **Summary**: Fixed misleading prescription-save error by resolving message-validation failures with missing `firstName`. Updated `Prescription.jsx` to resolve doctor recipient, separate save errors from UI warnings, and handle status notifications.

---

### Task 13: aiccloud VPS Redeployment & Git Synchronization
* **Date & Time**: 2026-09-25 18:30 ~ 18:50 IST
* **Summary**: Rebuilt frontend and backend, deployed to aiccloud VPS (`https://biomechasoft.in`), verified PM2/Nginx status, and pushed commits to `BMS-opd-be`, `BMS-opd-fe`, and `BMS-OPD`.

---

### Task 14: Dynamic Deployment CLI (`aiccloud-deployment`) Creation & Verification
* **Date & Time**: 2026-09-25 18:55 ~ 19:15 IST
* **Summary**: Created dynamic deployment CLI in `aiccloud-deployment` supporting `setup`, `add be/fe`, `push be/fe`, and `report be/fe` with automated SSH, error handling, PM2/Nginx restarts, and 3-line log reporting. Verified all CLI commands.

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
  1. Created `supabase/migrations/20260927000000_init_thyrogen_schema.sql` and `supabase/schema.sql` with relational PostgreSQL tables (`profiles`, `doctors`, `doctor_schedules`, `test_categories`, `lab_tests`, `radiology_services`, `packages`, `appointments`, `reports`, `home_collection_bookings`, `site_settings`).
  2. Configured RLS policies for patient privacy, public viewing of active items, and admin management.
  3. Implemented safe Supabase client `src/lib/supabase.ts`, typed services `src/lib/services.ts`, and Auth context `src/lib/auth-context.tsx`.
  4. Verified production build (`npm run build` passed) and committed (`599a641`) to `origin/main`.

---

### Task 21: ThyroGen Website - Phase 3 Doctor Chamber, Profiles & Appointment Booking
* **Date & Time**: 2026-09-27 06:02 IST
* **Goal**: Implement Doctor Directory, doctor profile routing, chamber schedules, and appointment booking form.
* **Steps Taken**:
  1. Created `src/components/doctor-components.tsx` (`DoctorDirectory` & `DoctorDetail`) with zero-hallucination notices and helpline CTAs (`9134101587` & `8001101641`).
  2. Created `src/components/appointment-form.tsx`: responsive form with patient demographics, doctor selector, date/time pickers, symptoms, and confirmation screen.
  3. Updated TanStack Router routes (`doctors.index.tsx`, `doctors.$id.tsx`, `appointment.tsx`).
  4. Verified local build (`npm run build` passed) and committed (`ca33f44`) to `origin/main`.

---

### Task 22: ThyroGen Website - Phase 4 Live Referral API Bridge & Edge Function
* **Date & Time**: 2026-09-27 06:05 IST
* **Goal**: Bridge patient appointment booking directly with ThyroGen OPD backend (`POST https://thyrogendiagnostic.in/api/v1/referral/book`).
* **Steps Taken**:
  1. Created Supabase Edge Function `supabase/functions/book-referral/index.ts` to bridge requests to backend referral desk on port 5001.
  2. Updated `src/lib/services.ts` `bookAppointment` to sync with `/referral/book` (8s timeout), extracting official OPD referral tokens (`REF-XXXXX`).
  3. Updated `src/components/appointment-form.tsx` to display live tracking token on booking confirmation.
  4. Verified build (`npm run build` passed) and committed (`82b07f5`) to `origin/main`.

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

---

### Task 26: Live ThyroGen Test Directory Integration (917 Diagnostic & Radiology Tests)
* **Date & Time**: 2026-09-27 06:56 IST
* **Goal**: Connect Pathology Lab Tests and Radiology Services catalogues directly to live public ThyroGen API (`https://thyrogendiagnostic.in/api/v1/test`) returning 917 real tests, prices, and sample precautions.
* **Steps Taken**:
  1. Discovered and verified live public endpoint `GET /api/v1/test`: returns 917 active diagnostic tests (689 Pathology tests, 228 Radiology tests) with exact prices, sample types, precautions, and clinical departments.
  2. Updated `src/lib/services.ts`:
     - Added `getLiveTests()` with 60-second in-memory cache and 8-second timeout.
     - Implemented `mapRawToLabTest()` and `mapRawToRadiology()` for zero-hallucination compliance.
     - Updated `fetchTestCategories()` to dynamically extract active departments (Hematology, Biochemistry, Microbiology, Serology, Endocrinology, Histopathology, etc.).
     - Updated `fetchLabTests()`, `fetchPopularLabTests()`, `fetchLabTestById()`, `fetchRadiologyServices()`, and `fetchRadiologyServiceById()` with live API data and fallback.
  3. Verified production build (`npm run build`) passed with 0 errors.
  4. Verified local routes `/tests` and `/radiology` returning HTTP 200 OK with live data.
  5. Committed (`61dcc3c`) and pushed `thyrogen` to `origin/main`.

---

### Task 27: Admin Branding & Hero Management, Test Additions & Three.js 3D Visuals
* **Date & Time**: 2026-09-27 07:08 IST
* **Goal**: Implement live editable branding (Name, Logo, Phone, Address), Hero section content (headline, badge, subtext, CTAs, banner image), custom test additions in Admin Dashboard, and Three.js 3D live movable background, interactive diagnostic core, and wave ribbon.
* **Steps Taken**:
  1. Installed `three` and `@types/three`.
  2. Built `src/lib/site-settings.ts`: reactive settings store with `localStorage` persistence, custom event synchronization, and `useSiteSettings` hook.
  3. Created Three.js 3D components:
     - `src/components/three/three-background.tsx`: full-screen responsive 3D particle constellation and bio-lattice with smooth lerped mouse parallax.
     - `src/components/three/three-hero-orb.tsx`: interactive 3D holographic diagnostic core with rotating icosahedron nucleus, dual orbital gimbal rings, and orbiting nodes.
     - `src/components/three/three-wave-divider.tsx`: 3D undulating medical telemetry wave grid responding to cursor velocity.
  4. Updated layout and homepage:
     - `src/routes/__root.tsx`: wired `ThreeMovableBackground` into root shell.
     - `src/components/site-shell.tsx`: wired dynamic brand name, logo image, phone, address, and announcement banner.
     - `src/components/site-pages.tsx`: integrated dynamic hero headline, badge, subtitle, CTAs, `ThreeHeroOrb`, and `ThreeWaveDivider`.
  5. Enhanced `src/components/admin-components.tsx`:
     - Added "Branding & Hero (Live)" management tab with full controls, file uploaders, 3D visual toggles, and instant live preview.
     - Updated test & doctor creation to persist in local custom storage and merge seamlessly with live catalogues.
  6. Verified production build (`npm run build` passed with 0 errors) and tested routes `/` and `/admin` (HTTP 200).
  7. Committed (`aedc144`) and pushed `thyrogen` to `origin/main`.

---

### Task 28: Lazy Loading & Multi-Mode Pagination in Tests & Admin Desk
* **Date & Time**: 2026-09-27 07:18 IST
* **Goal**: Implement high-performance pagination and continuous lazy loading across 917 active diagnostic tests (Pathology & Radiology) and Admin Desk.
* **Steps Taken**:
  1. Built `CataloguePagination` in `src/components/catalogue-components.tsx` with dual modes: "Pages" (paged view) and "Lazy Scroll" (continuous stream).
  2. Paged mode: range indicators, page size selector (12, 18, 24, 48), first/prev/next/last, page pills with ellipsis, and smooth scroll-to-top.
  3. Lazy Scroll mode: progressive count, animated progress bar, "Load More" button, and `IntersectionObserver` sentinel for auto-load on scroll.
  4. Added test counts to category pills (`All Categories (689)`, `Biochemistry (142)`, etc.) and multi-criteria sorting.
  5. Implemented search filter and 18-items/page pagination for Pathology Test Management in `src/components/admin-components.tsx`.
  6. Verified production build (`npm run build` passed with 0 errors) and pushed `thyrogen` (`f3219ec`) to `origin/main`.
