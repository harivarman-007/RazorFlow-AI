# Task Tracker: Razorpay AI Receivables & Cash Flow Platform

Legend:
- `[ ]` Pending
- `[/]` In Progress
- `[x]` Completed

---

## Phase 1: Core Foundation & Agents 1 & 2 (Invoice & Risk Engine)
- [x] Align on UI component requirements for Phase 1 with the user
- [x] Set up project structure (`frontend/`)
- [x] Implement **NotchNavbar** (Monochrome, Black by default)
- [x] Implement **StatsBento** (Monochrome AR metrics with sparkline)
- [x] Implement **Agent 1: Invoice Agent** (Invoice creation, GST calculation, due dates)
- [x] Implement **Agent 2: Risk Prediction Agent** (ML risk model: score 0.0-1.0, category, risk drivers)
- [x] Build Invoices Data Table & Filter bar
- [x] Build Physical Thermal Receipt Dispenser (with sound synthesis & serrated paper)
- [x] Fix Theme Toggle to class-based pure white default and black dark mode

---

## Phase 2: Agents 3 & 4 (Smart Reminders & Razorpay Payment Engine)
- [x] Align on UI component requirements for Phase 2 (Hover-to-Reveal Card)
- [x] Implement **Agent 3: Smart Reminder Agent** (tone adaptation, WhatsApp/Email/SMS drafts, Hover-to-Reveal Card)
- [x] Implement **Agent 4: Razorpay Agent** (Payment link, UPI QR Code, 1-click customer payment simulator)
- [x] Connect Razorpay payment completion to real-time state sync & physical thermal receipt dispensing
- [x] Verify Phase 2 build and functionality (0 errors)

---

## Phase 3: Agents 5 & 6 (Autonomous Collection Cadence & Cash Flow Forecast)
- [ ] Align on UI component requirements for Phase 3
- [ ] Implement **Agent 5: Collection Agent** (Cadence tracking + AI Smart-Skip logic)
- [ ] Implement **Agent 6: Cash Flow Forecast Agent** (Weekly, Monthly, Quarterly projections)
- [ ] Build FastAPI endpoints for Phase 3 (`/api/collections/cadence`, `/api/forecast`)
- [ ] Build Phase 3 Frontend UI components (Cadence Pipeline, Cash Flow Visualizer)
- [ ] Verify Phase 3 functionality

---

## Phase 4: Agent 7 & Orchestrator (BI Agent & Orchestrator)
- [ ] Align on UI component requirements for Phase 4
- [ ] Implement **Agent 7: Business Intelligence Agent** (RAG query engine over AR data)
- [ ] Implement **AI Orchestrator** (Central coordinator & activity log)
- [ ] Build FastAPI endpoints for Phase 4 (`/api/bi/chat`, `/api/orchestrator/logs`)
- [ ] Build Phase 4 Frontend UI components (BI Chat Drawer/Widget, Agent Activity Feed)
- [ ] Verify Phase 4 functionality

---

## Phase 5: 5-Minute Demo Flow & Final Polish
- [ ] Align on UI component requirements for 5-minute demo bar
- [ ] Implement 8-step interactive demo flow controller
- [ ] End-to-end integration and polish
