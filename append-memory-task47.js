const fs = require('fs');
let mem = fs.readFileSync('MEMORY.md', 'utf8').trim();

const task47 = `
- **Task 47: Predefined Commission Rules, Inline Editing & Referral Expenses in Collections / Invoiced (Live Deployed - 2026-09-29)**:
  1. **Predefined Commission Settings by Booker Type**:
     - Added commissionSettings to models/generalSettingsSchema.js: registeredSelfPercentage (5%), registeredOtherPercentage (8%), guestSelfPercentage (0%), guestOtherPercentage (0%), defaultPercentage (5%).
     - In generalSettingsController.js and generalSettingsRouter.js, added /commission-settings endpoint to view and update commission rules.
     - In referralController.js (bookPatientReferral & createReferral), auto-resolved commission % dynamically based on whether referrer is an existing registered user and whether booking is for self vs another patient.
  2. **ReferralCommissionModal & Commission Settings Tab**:
     - Built [ReferralCommissionModal.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReferralCommissionModal.jsx) and [ReferralCommissionModal.css](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReferralCommissionModal.css) with real-time payout simulator (e.g. ₹500 consult -> ₹25 self / ₹40 other / ₹0 guest).
     - Mounted as inline tab in [ThemeSettings.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ThemeSettings.jsx) and modal trigger in [ReferralsTable.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReferralsTable.jsx).
  3. **Inline Commission % Editing in Referrals Table**:
     - Upgraded [ReferralsTable.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReferralsTable.jsx) and [ReferralsTable.css](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReferralsTable.css) with click-to-edit inline percentage input, auto-save checkmark, and live state update without full page reload.
  4. **Referral Expenses in Collections Breakdown & Total Invoiced**:
     - In reportController.js (getReportSummary) and invoiceController.js (getInvoiceStats), aggregated referral commission amounts into totals.expenses and net collection.
     - In [PieChartCard.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/PieChartCard.jsx), added semantic color mapping (Paid: Emerald #10b981, Due: Coral #ef4444, Expenses: Amber #f59e0b).
     - In [ReportsPage.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReportsPage.jsx) and [ReportsPage.css](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/ReportsPage.css), added Expenses and Net pill indicators to Total Invoiced KPI card and Expenses slice to Collections Breakdown.
     - In [Dashboard.jsx](file:///c:/PROJECTS/BMS-OPD/BMS-opd-fe/src/components/Dashboard.jsx), included Expenses slice in Collections Breakdown donut chart.
  5. **Live VPS Deployment**:
     - Backend pushed (e023e90 to main), pulled to /root/thyrogen-be, PM2 thyrogen-backend restarted.
     - Frontend built via npm run build (0 errors, 64bc43b pushed to Sohel2), deployed to /root/thyrogen-opd-fe, Nginx reloaded.
     - Verified live at https://opd.thyrogendiagnostic.in with HTTP 200 OK.
`;

fs.writeFileSync('MEMORY.md', mem + '\n' + task47.trim() + '\n', 'utf8');
console.log('Appended Task 47. Total lines now:', fs.readFileSync('MEMORY.md', 'utf8').split('\n').length);
