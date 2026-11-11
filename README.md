# Hall Pass Demo (`demo`)

Phase 1 **SQLite Demo** repository workspace for the **Digital Hall Pass System (`Hall_Pass_Project`)**.

> **Status:** Git repository initialized inside `demo/` with `.gitignore` ready. Demo UI views (`kiosk.html`, `dashboard.html`, `admin.html`, `hall-check.html`) and local SQLite fixtures are ready to be built here next without modifying the root pre-plan architecture docs in [`../docs/`](../docs/).

## Planned Demo Scope
- **Database:** Local **SQLite** (`WAL` mode) with anonymized campus/floor/One-to-One test fixtures.
- **Role Views:**
  - Student View (`kiosk.html`) — clean login, NFC/barcode/manual ID lookup, Check Out or Queue for Restroom.
  - Teacher View (`dashboard.html`) — current class absent students, elapsed time gone, queue & room pause controls.
  - Administrator View (`admin.html`) — mobile-friendly email domain import (`Google Workspace for Education` / `Microsoft Entra ID`), room & floor/gender bathroom limits, and Emergency Lockdown toggle.
