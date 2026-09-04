# Master Implementation Plan: Razorpay AI Receivables & Cash Flow Platform

This document outlines the phased roadmap for building the autonomous multi-agent accounts receivable and cash flow platform powered by Razorpay.

We are developing this **phase by phase**. For every phase, we define backend functionality, outline required UI components, and align on UI design choices before building.

---

## Roadmap Overview

### Phase 1: Core Foundation & Agents 1 & 2 (Invoice & Risk Engine)
- **Focus**: Backend database setup, Invoice Agent, and Payment Risk Prediction Agent (ML/XGBoost logic).
- **Backend**:
  - FastAPI server setup.
  - SQLite database: Customers, Invoices, Risk Scores, Seed Data.
  - **Invoice Agent (Agent 1)**: Generates invoice number (`INV-2026-XXXX`), items calculation, due date, customer tiering.
  - **Risk Agent (Agent 2)**: Payment delay risk model calculating risk score (0.0 to 1.0), category (Low, Medium, High), and risk factor breakdown.
- **Frontend / UI Focus**:
  - App shell, navigation header, and Phase 1 UI components:
    - Customer selector & Invoice Creator form.
    - Real-time dynamic Risk Prediction gauge/badge showing risk breakdown.
    - Invoices list view with status and risk flags.

---

### Phase 2: Agents 3 & 4 (Smart Reminders & Razorpay Payment Engine)
- **Focus**: Smart reminder engine and Razorpay integration.
- **Backend**:
  - **Smart Reminder Agent (Agent 3)**: Tone adaptation (`Friendly`, `Professional`, `Urgent`, `Escalation`), multi-channel drafts (Email, WhatsApp, SMS preview).
  - **Razorpay Agent (Agent 4)**: Razorpay Payment Links API, UPI deep links, QR code generation, payment verification/simulation endpoint.
- **Frontend / UI Focus**:
  - Smart Reminder preview modal (WhatsApp bubble format, Email layout, SMS preview).
  - Razorpay payment modal with QR code, UPI intent button, and "Simulate Customer Payment" action.

---

### Phase 3: Agents 5 & 6 (Autonomous Collection Cadence & Cash Flow Forecast)
- **Focus**: Automated overdue collection pipeline and cash flow forecasting.
- **Backend**:
  - **Collection Agent (Agent 5)**: Automated cadence engine (Due -3d, Due Date, +3d, +7d, +15d) with AI Smart-Skip logic.
  - **Forecast Agent (Agent 6)**: Cash flow prediction algorithm (Next Week, Next Month, Next Quarter) with risk discounting.
- **Frontend / UI Focus**:
  - Collection Cadence Pipeline (Kanban / stage tracker with smart skip tags).
  - Cash Flow Forecast dashboard cards and trend visualization.

---

### Phase 4: Agent 7 & Orchestrator (Business Intelligence Agent & Orchestrator)
- **Focus**: Natural language analytics and central coordination.
- **Backend**:
  - **BI Agent (Agent 7)**: Query parser and RAG-style intelligence answering questions like *"Why are collections down?"* or *"How much revenue next month?"*.
  - **AI Orchestrator**: Central pipeline orchestrating data flow between all agents.
- **Frontend / UI Focus**:
  - BI Copilot chat interface with instant query chips and structured analytical answers.
  - Central Agent Activity Timeline / Log.

---

### Phase 5: 5-Minute Demo Flow & Final Polish
- **Focus**: Winning hackathon demo flow.
- **Workflow**:
  - 1-click step-by-step interactive demo banner executing the full 8-step story.
  - Final integration testing and documentation.
