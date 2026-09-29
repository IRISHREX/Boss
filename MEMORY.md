# BMS-OPD System Memory Log

> **Rule**: Maintain <= 300 lines. When adding new entries, prune oldest historical records to keep total lines under 300.

---

## [2026-09-24 ~ 2026-09-27] Archive (Tasks 9-30)
* **Infrastructure & Features**: Doctor footer, QR, referrals, aiccloud CLI, prescription fixes, opd routing, Supabase layer, live 917 tests integration, Three.js 3D background & orb, editable branding & hero management, lazy loading pagination, admin health packages & visitor GPS analytics, header cleanup & report lookup scoping fix.

---

### Task 31: Multi-Domain Live Deployment (`thyrogendiagnostic.in` & `opd.thyrogendiagnostic.in`)
* **Date & Time**: 2026-09-27 12:12 IST
* **Goal**: Deploy ThyroGen website to root domain `https://thyrogendiagnostic.in/`, migrate BMS OPD application strictly to `https://opd.thyrogendiagnostic.in/`, and preserve `https://opd.biomechasoft.in/`.
* **Steps Taken**:
  1. Built Nitro SSR and BMS OPD frontend. Started PM2 `thyrogen-website` on port 3002.
  2. Reconfigured Nginx: `thyrogendiagnostic.in` (SSR 3002 + static assets), `opd.thyrogendiagnostic.in` (port 5001 + `/root/thyrogen-opd-fe`), `opd.biomechasoft.in` (port 5000).
  3. Verified HTTP 200 OK on all live endpoints. Pushed commits to `thyrogen` and `Boss`.

---

### Task 32: Complete BioMechaSoft Decommissioning & VPS Infrastructure Cleanup
* **Date & Time**: 2026-09-27 17:20 IST
* **Goal**: Decommission `MERN_STACK_HOSPITAL_MANAGEMENT` DB, remove `bms-backend` PM2 process, delete legacy files, and tighten Nginx default server block.
* **Steps Taken**:
  1. Dropped legacy MongoDB database `MERN_STACK_HOSPITAL_MANAGEMENT` cleanly.
  2. Deleted PM2 process `bms-backend`. Only `thyrogen-backend` (5001) and `thyrogen-website` (3002) remain active.
  3. Removed legacy folders from VPS filesystem. Configured Nginx catch-all 404 block for decommissioned domains.
  4. Updated `/root/backup-to-s3.sh` to target `throgendb` exclusively.

---

### Task 33: Dedicated Supabase Database Migration (`yxjfkzdaxlmwleantasf`) & Admin Seeding
* **Date & Time**: 2026-09-27 17:42 IST
* **Goal**: Migrate to dedicated Supabase project, verify PostgreSQL schema, and register admin account (`Admin@Thyrogen.com`).
* **Steps Taken**:
  1. Installed `@supabase/supabase-js` and `@supabase/ssr`. Built client/server helpers.
  2. Verified live schema: `site_settings`, `test_categories`, `profiles`, and relational tables.
  3. Registered `Admin@Thyrogen.com` with auto-insert profile RLS policy. Pushed `thyrogen` (`11f9699`).

---

### Task 34: Hero Video Showcase with 3D Core Fallback, SaaS Admin Redesign & RBAC Matrix
* **Date & Time**: 2026-09-27 19:15 IST
* **Goal**: Multi-reel hero video showcase with 3D orb fallback; SaaS Admin sidebar layout with 5-role RBAC matrix and multilingual localization.
* **Steps Taken**:
  1. Extended `SiteSettings` with hero videos array, audio un-mute toggle, and fallback to `ThreeHeroOrb`.
  2. Created `src/lib/rbac.ts` with 5 user roles and complete 5x10 permission toggle matrix in Admin portal.
  3. Built `src/lib/i18n.tsx` supporting English, Bengali (`বাংলা`), and Hindi (`हिंदी`). Deployed to VPS.

---

### Task 35: Admin 2FA OTP Route Fix, OPD Backend throgendb Connection & S3 Reels
* **Date & Time**: 2026-09-27 19:40 IST
* **Goal**: Fix 404 error on `/api/admin-auth/send-otp`, connect OPD backend to `throgendb`, and host diagnostic lab reels on S3.
* **Steps Taken**:
  1. Added dedicated Nginx route `location /api/admin-auth` proxying to port 3002.
  2. Updated `dbConnection.js` to target `throgendb` (5,597+ documents restored).
  3. Hosted 3 clinical diagnostic lab reels on S3 bucket. Deployed to VPS and verified.

---

### Task 36: Hero Section Upload Fix, Missing Icon Crash & Reports 404 Resolution
* **Date & Time**: 2026-09-27 20:50 IST
* **Goal**: Fix hero visual upload, eliminate missing `Play` icon crash, fix `reports` table query, and persist settings server-side.
* **Steps Taken**:
  1. Imported missing icons in `admin-components.tsx`. Corrected table name from `patient_reports` to `reports`.
  2. Added `heroVisualMode` selector in Admin Branding tab with live thumbnail preview and active mode toggling.
  3. Implemented `/site-api/upload` (S3 proxy) and `/site-api/site-settings` (file persistence). Deployed live.

---

### Task 37: Brand Aesthetic Transformation - Maroon, Grassy Green & Sky Blue Glow
* **Date & Time**: 2026-09-27 20:56 IST
* **Goal**: Refine entire website color palette to clinical Maroon primary, fresh Grassy Green secondary, and Sky Blue glowing accents.
* **Steps Taken**:
  1. Updated `styles.css` with OKLCH tokens: `--primary` Maroon (`#801429`), `--secondary` Grass Green (`#22c55e`), `--ring` Sky Blue (`#38bdf8`).
  2. Harmonized Three.js 3D background particles, hero orb wireframe rings, and wave divider.
  3. Styled primary/secondary CTAs, badges, and announcement banner with radiant glows. Pushed `thyrogen` (`44cca0e`).

---

### Task 38: Context-Aware WhatsApp Booking with Mandatory Validation
* **Date & Time**: 2026-09-27 21:12 IST
* **Goal**: Interactive patient context modal for WhatsApp bookings with mandatory Name/Age validation and dual helpline dispatch (`9134101587` and `8001101641`).
* **Steps Taken**:
  1. Built `WhatsAppBookingModal` validating Name ($\ge 2$ chars) and Age (1-125 yrs).
  2. Connected across test detail cards, home collection portal, and doctor directory cards. Deployed to VPS (`0dda58f`).

---

### Task 39: Doctor WhatsApp Booking with Prescription Upload & Condition Recommendations
* **Date & Time**: 2026-09-27 22:57 IST
* **Goal**: Rich clinical context for WhatsApp bookings: prescription photo/PDF upload to S3 and 9 condition-based test recommendation profiles.
* **Steps Taken**:
  1. Upgraded `WhatsAppBookingModal`: optional S3 prescription upload with public link, 9 condition profiles (Diabetes, Thyroid, Fever, Cardiac, etc.).
  2. Connected across doctor directory cards, doctor profiles, and appointment booking form. Deployed to VPS (`890fac1`).

---

### Task 40: 5-Reel Hero Video Showcase with Live Progress Bars, Captions & Admin Reordering
* **Date & Time**: 2026-09-27 23:10 IST
* **Goal**: Expand Hero Video Showcase to 5 short video reels with linear progress countdown, editable captions, admin reordering, and S3 direct upload.
* **Steps Taken**:
  1. Configured 5 S3 MP4 video reels (Pathology, Radiology, Phlebotomy, OPD Chamber, Emergency Triage).
  2. Built top video switcher tabs (`Reel 1` to `Reel 5`) with live linear progress fill animation and hover pause.
  3. Added caption editor, move up/down reordering, and direct upload in Admin panel. Deployed to VPS (`8fc7935`).

---

### Task 41: Treatment Protocol Save Catalog In-Place Drawer & Medical Advice Persistence Fix
* **Date & Time**: 2026-09-28 16:30 IST
* **Goal**: Fix protocol medicine and test data persistence bug when saving protocols, and integrate in-place slide drawer in prescription view.
* **Steps Taken**:
  1. **Backend Fix**: Updated `createMedicalAdvice` in `controller/medicalAdviceController.js` to pass `...req.body` ensuring `medicines` and `testAdvice` arrays persist completely into MongoDB.
  2. **Frontend In-Place Drawer**: Integrated `MedicineDrawer` directly into `Prescription.jsx` so doctors can prefill prescription data into treatment protocols without page disruption.
  3. Committed and pushed `BMS_OPD_BE` (`031107a` to `origin/main`) and `BMS_OPD` (`79d2dbd` to `origin/Sohel2`).

---

### Task 42: General Settings Redesign, Interactive Theme Cards & Dynamic Theme Synchronization
* **Date & Time**: 2026-09-28 17:30 IST
* **Goal**: Comprehensive UI/UX redesign of General Settings (`/settings/theme`), interactive visual theme cards with live UI mockups, and dynamic theme adaptation across all sub-panels.
* **Steps Taken**:
  1. **Header & Navigation**: Rebuilt header with glassmorphic Back pill button, dynamic Active Theme Badge (`🌿 Clinical Teal`, `🔷 Medical Blue`, `🌙 Dark Mode`, `🎨 Custom Studio`), and segmented pill tab bar.
  2. **Interactive Theme Cards**: Built 4 visual theme cards in `ThemeSettings.jsx` with color swatches, mini UI mockup previews, and live Custom Theme Studio with sliders and color pickers.
  3. **Theme-Adaptive Styling**: Bound `OrganizationSettings.css` hero banner, inputs, QR container, and action buttons to semantic tokens (`var(--btn-gradient)`, `var(--bg-card)`, `var(--accent)`, `var(--border-color)`). Added dark mode overrides for Header/Footer designer.
  4. **Audio Feedback Console**: Designed audio mixer workstation with volume slider, Mute/Unmute state chip, and 4 audition test tiles.
  5. Verified production build (`npm run build` completed with 0 errors). Committed and pushed `BMS_OPD` (`12deaa8` to `origin/Sohel2`).

---

### Task 43: Dashboard UI/UX Redesign, Table Banner Padding, Dark Radial Action Menu & VPS Deployment
* **Date & Time**: 2026-09-28 21:50 IST
* **Goal**: Modernize OPD Dashboard analytics with interactive charts, refine appointments table top banner spacing, fix dark mode circular action button background, and deploy live to VPS.
* **Steps Taken**:
  1. **Appointments Header Spacing**: Added `padding: 1.5rem 1.75rem` (`24px 28px`) to `.table-banner` and `.heading-box` in `Dashboard.css`, providing generous breathing room for the "Appointments" heading and action buttons.
  2. **Action Button Hierarchy**: Added distinct styling for `Book Appointment` (primary gradient), `View Slots` (outlined pill), and `Delete` (soft danger badge).
  4. **Analytics Charts**: Replaced static placeholders with interactive Donut chart (`PieChartCard.jsx`), glowing spline trend (`LineChartCard.jsx`), and dual-gradient bars (`SimpleBarChart.jsx`).
  5. **Live VPS Deployment**: Built production bundle (0 errors), packaged tarball via `Boss/deploy-opd-vps.js`, updated backend PM2 process (`thyrogen-backend`), deployed frontend to `/root/thyrogen-opd-fe`, reloaded Nginx, and verified live HTTP 200 OK at `https://opd.thyrogendiagnostic.in`.
  6. Pushed `BMS_OPD` (`4497190` to `origin/Sohel2`).

---

### Task 44: 502 Bad Gateway Diagnosis, PM2 Resurrect & Auto-Startup Configuration
* **Date & Time**: 2026-09-28 22:10 IST
* **Goal**: Diagnose 502 Bad Gateway errors on `https://thyrogendiagnostic.in` and `https://opd.thyrogendiagnostic.in/api/v1`, restore upstream Node processes on ports 3002 & 5001, and configure systemd auto-restart.
* **Steps Taken**:
  1. **Root Cause Analysis**: Connected to VPS via SSH (`148.113.6.25:20172`) and inspected PM2 status. The PM2 process table was completely empty due to a daemon reboot at 16:16 UTC, leaving Nginx upstreams (ports 3002 and 5001) unreachable.
  2. **Process Resurrect**: Executed `pm2 resurrect`, successfully restoring `thyrogen-backend` (`/root/thyrogen-be/server.js` on port 5001) and `thyrogen-website` (`/root/thyrogen-website/server/index.mjs` on port 3002).
  3. **Auto-Boot Configuration**: Configured systemd service via `pm2 startup` (`systemctl enable pm2-root`) and froze process state to disk with `pm2 save` to guarantee automatic recovery across VPS reboots.
  4. **Live Verification**: Verified all endpoints over HTTPS:
     - `https://thyrogendiagnostic.in/` (HTTP 200 OK - 62KB SSR)
     - `https://thyrogendiagnostic.in/doctors` (HTTP 200 OK)
     - `https://thyrogendiagnostic.in/tests` (HTTP 200 OK)
     - `https://thyrogendiagnostic.in/api/v1/user/doctors` (HTTP 200 OK)
     - `https://opd.thyrogendiagnostic.in/` (HTTP 200 OK)
     - `https://opd.thyrogendiagnostic.in/api/v1/user/doctors` (HTTP 200 OK)

---

### Task 45: Referral Appointment Patient ID Auto-Link, Prescription Self-Healing & Live VPS Deployment
* **Date & Time**: 2026-09-29 00:23 IST
* **Goal**: Fix undefined patient ID when accepting/converting inbound referrals, ensure seamless prescription generation, retrofit existing orphaned appointments on VPS MongoDB, and deploy live to production.
* **Steps Taken**:
  1. **Backend Referral Conversion & Healing (`BMS-opd-be`)**:
     - Updated `convertToAppointment` in `controller/referralController.js` to automatically resolve or create a Patient user record (`role: "Patient"`), link `patientId: patient._id` to the appointment and invoice, and self-heal previously converted appointments.
     - Implemented `ensureAppointmentPatient` in `controller/appointmentController.js` (`POST /api/v1/appointment/ensure-patient/:id`) with phone/email sanitization and valid schema enums.
     - Added `getAppointmentById` (`GET /api/v1/appointment/:id`) and protected `getAppointmentsByPatientId` from CastError crashes on undefined/invalid IDs.
     - Added ObjectId validation to `getPatientById` in `controller/userController.js`.
  2. **Frontend Prescription Resilience (`BMS-opd-fe`)**:
     - Hardened `handlePrescriptionClick` in `src/components/Dashboard.jsx` with an automatic self-healing fallback to `/api/v1/appointment/ensure-patient/:id` whenever `appointment.patientId` is missing, null, or the string `"undefined"`. Refreshes appointments and smoothly opens the prescription modal.
     - Added fallback in `src/components/Prescription.jsx` to load appointment directly via `propAppointmentId` if `patientId` is unlinked.
  3. **Live Database Retrofit (`throgendb`)**:
     - Ran `retrofit-appointments.js` against VPS MongoDB `throgendb` (`148.113.6.25:20172`). Identified and repaired 4 legacy appointments missing `patientId`, created/matched Patient records, and synchronized associated referral documents (0 remaining).
  4. **Build, Commit & Live Deployment**:
     - Built frontend production bundle (`vite build` completed in 1m 48s with 0 errors).
     - Pushed `BMS_OPD_BE` (`274e86b` to `origin/main`).
     - Pushed `BMS_OPD` (`40341ef` to `origin/Sohel2`).
     - Deployed via `Boss/deploy-opd-vps.js`: pulled latest backend on VPS, restarted PM2 `thyrogen-backend`, deployed frontend bundle to `/root/thyrogen-opd-fe`, reloaded Nginx, and verified live HTTP 200 OK at `https://opd.thyrogendiagnostic.in`.



---

### Task 46: Capacity Calendar, Platform Fee Fix, Address Storage, Referral Table & 430+ Thyroid Catalog
* **Date & Time**: 2026-09-29 07:25 IST
* **Goal**: Deliver 6 requested features: interactive Doctor Capacity Calendar & modal, eliminate hardcoded 100 platform fee to database value (20), clinic address storage with similarity auto-promotion & patient booking datalist, comprehensive 430+ medical catalog with thyroid emphasis, full Referral & Commission management table with auto-pay/bulk actions, and notification audio chime (notification.mp3) with volume/mute state saved in DB.
* **Steps Taken**:
  1. **Doctor Capacity Calendar & Modal**:
     - Built interactive monthly calendar in [DoctorCapacitySettings.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/DoctorCapacitySettings.jsx) with date tiles, color-coded booking thresholds (green <50%, yellow 50-75%, red >75%, gray off-day), multi-date selection toggle, and modal dialog to configure capacity, working days, and clinical timings across multiple dates simultaneously.
     - Styled in [DoctorCapacitySettings.css](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/DoctorCapacitySettings.css). Updated backend capacityController.js to support explicit dates array and mounted at /api/v1/capacity.
  2. **Platform Fee Fixed to General Settings (Rs 20)**:
     - Replaced Math.round((d.consultationFee || 100) * 0.2) in [Appointment.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/Appointment.jsx) which forced fee to 100 with dynamic lookup of generalSettings.platformFee (20 for Thyrogen in throgendb).
     - Added backend fallback in appointmentController.js to query GeneralSettings.platformFee.
  3. **Address Storage & Similarity Auto-Promotion**:
     - Added savedAddresses array to models/generalSettingsSchema.js.
     - Implemented similarity detection (areAddressesSimilar with normalized token overlap) in generalSettingsController.js so when addresses are modified, similar entries are updated in-place and promoted to most recent.
     - Added saved address chip selection and delete actions in [OrganizationSettings.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/OrganizationSettings.jsx) and <datalist> auto-suggest in [Appointment.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/Appointment.jsx).
  4. **Referral Management & Commission Payouts**:
     - Built dedicated [ReferralsTable.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReferralsTable.jsx) with search, status filters, signed-in partner vs guest badges, commission % editor, single Pay, and bulk Auto-Pay / Delete.
     - Added backend endpoints in referralController.js: updateReferralCommission, payReferralCommission, bulkPayReferralCommissions, and bulkDeleteReferrals.
     - Added /referrals route in App.jsx and menu entry in Sidebar.jsx.
  5. **Notification Audio & Sound Settings in DB**:
     - Added notification.mp3 in BMS-opd-fe/public/ and playNotificationSound() in soundUtils.js.
     - Added soundSettings: { volume, isMuted } to generalSettingsSchema.js and userSchema.js.
     - Updated ThemeSettings.jsx to load and persist volume/mute settings to DB and added an audition tile for notification.mp3.
     - Added live notification polling in TopHeader.jsx with unread count bubble badge and audio chime on arrival.
     - Added system Message generation in referralController.js on referral bookings so doctor/admin notifications fire immediately.
  6. **Thyroid-Focused Medical Catalog Expansion (430+ Records)**:
     - Generated 415 comprehensive clinical treatment protocols mapping real diagnostictests (917 existing) and medicines (4,115 existing) in throgendb.
     - Upserted into medicaladvices collection, expanding total records from 15 to 430.
  7. **Build & Live VPS Deployment & Backend Hotfix**:
      - Fixed missing express import in generalSettingsRouter.js (commit 49438f3).
     - Built frontend bundle via npm run build (0 errors).
     - Pushed BMS_OPD_BE (9918d0b to origin/main) and BMS_OPD (778157a to origin/Sohel2).
     - Executed deploy-opd-vps.js: restarted thyrogen-backend PM2 process, deployed frontend to /root/thyrogen-opd-fe, reloaded Nginx, and verified live HTTP 200 OK at https://opd.thyrogendiagnostic.in.
