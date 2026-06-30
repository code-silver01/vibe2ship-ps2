# CivicPulse 🏛️

A hyperlocal AI-agentic civic issue reporting & resolution platform powered by Google Gemini and a Multi-Agent Backend Orchestrator.

## Features

- **Multi-Agent Orchestrator**: 7 specialized AI agents handling intake, deduplication, routing, risk prediction, escalation, and verification.
- **Multimodal Intake**: Report issues via text, photos, or voice (English, Hindi, Kannada).
- **Smart Deduplication**: Vector-based visual + geographic similarity search prevents duplicate tickets.
- **Automated Escalation**: Drafts RTI-style requests when SLAs breach, awaiting 1-tap citizen approval.
- **AI Verification**: Gemini vision compares before/after photos before allowing officials to close tickets.
- **Cryptographic Audit Log**: Every state change is hashed and chained in Firestore for tamper-evident transparency.

---

## 🚀 Setup & Running

This project is built to run effortlessly with or without API keys via a built-in **Mock Mode**.

### Option 1: Docker (Recommended)

1. Make sure Docker is running.
2. Run the following command in the root directory:
   ```bash
   docker-compose up --build
   ```
3. Open `http://localhost:5175` in your browser.

### Option 2: Local Node.js

Requires Node.js v20+.

1. **Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   (Runs on http://localhost:3001)

2. **Start Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   (Runs on http://localhost:5175)

### Configuration (Optional, but recommended)

Copy `.env.example` to `.env` in the root directory. Add the following keys if you want to disable Mock Mode:
- `GEMINI_API_KEY`: Enables real AI orchestration instead of simulated responses.
- `VITE_GOOGLE_MAPS_API_KEY`: Removes the "development purposes only" watermark on the real interactive maps in the Report and Heatmap pages.
- Firebase credentials: Connects to a live database instead of the local in-memory emulator.

If you do not provide these, the app automatically falls back to **Mock Mode**.

---

## 🎬 3-Minute Demo Walkthrough

Follow this script to experience the full AI-agentic lifecycle of a ticket.

### 1. Citizen Reporting (0:00 - 0:45)
1. Open `http://localhost:5175`
2. Click **Login**, select the **Citizen** quick-login button at the bottom.
3. You are redirected to your Dashboard. Click **+ New Report**.
4. In the Report Form:
   - **Step 1**: Click the "Take Photo" and "Record Voice" boxes to attach mock media. Click Next.
   - **Step 2**: Confirm the mock location. Click Next.
   - **Step 3**: Click **Submit Report**.
   
> *Behind the scenes: The `IntakeAgent` analyzes the inputs. The `DeduplicationAgent` creates an embedding and checks for duplicates. The `RoutingAgent` calculates the ward, department, and SLA.*

### 2. AI Trace & Transparency (0:45 - 1:15)
1. You are now on the **Tracker Page** for your new ticket.
2. Click **"View AI Trace Logs"** on the right side.
3. Expand the logs to see exactly *why* the AI routed the ticket the way it did, including confidence scores and reasoning from the Intake, Dedup, and Routing agents. Notice the Hash-chained cryptographic badges on the timeline.

### 3. Official Resolution (1:15 - 2:00)
1. In the top navbar, click **Logout**.
2. Click Login again, this time select the **Official** quick-login button.
3. Navigate to the **Official Hub** (top navbar).
4. You will see the Department Queue. Click on the ticket you just created.
5. Click the green **Mark Resolved (Upload Photo)** button. 

> *Behind the scenes: The `VerificationAgent` uses Gemini Vision to compare the original photo with the new "after" photo. If the repair doesn't match the complaint, the closure is rejected.*

### 4. Public Scorecard & Heatmap (2:00 - 2:30)
1. Click **Scorecard** in the navbar. View how different departments rank based on SLA adherence and resolution rates.
2. Click **Heatmap** (as an official). View the predictive maintenance map, where `RiskPredictionAgent` data combines with infrastructure age to flag zones likely to fail next.

### 5. Community Escalation (2:30 - 3:00)
1. As a Citizen, go to the **Community** page.
2. Here you can vote on nearby issues.
3. If an issue breaches its SLA, the `EscalationAgent` automatically drafts an RTI (Right to Information) request. As a citizen, you'll see a red "Action Required!" badge on your dashboard allowing you to 1-tap approve the escalation.

---

## The 7 Agents Architecture

1. **IntakeAgent**: Extracts issue type, severity, and confidence from multimodal input.
2. **DeduplicationAgent**: Generates embeddings; performs L2 similarity search within a geo-radius.
3. **RoutingAgent**: Maps geo-coordinates to wards; assigns SLAs based on severity.
4. **RiskPredictionAgent**: Batch-scans open tickets; predicts SLA breaches using time-decay functions.
5. **EscalationAgent**: Triggers on breaches; drafts formal legal requests awaiting human approval.
6. **VerificationAgent**: Visual QA comparing before/after state; enforces resolution integrity.
7. **Orchestrator**: The state machine tying them all together; writes the immutable audit log.