# 🛡️ AutoRecon AI — AI Financial Controller & 3-Way Settlement Copilot for Razorpay

> **Razorpay Buildathon — Track 04: AI Finance Controller**  
> *Built with Java 21, Spring Boot 3.3, Spring AI / LLM Reasoning, H2 In-Memory DB, and Tailwind/Chart.js Dashboard.*

---

## 📌 Executive Summary

Every merchant processing payments via Razorpay faces a critical operational bottleneck: **Financial Settlement Reconciliation**.

Matching internal ERP/Store sales orders against Razorpay batch settlement payouts and incoming bank statement credits is traditionally done through error-prone manual Excel spreadsheets. Hidden fees, unexpected MDR deviations, GST rounding errors, delayed payouts past SLA (T+2), and un-reconciled refunds drain cash flow and waste accounting hours.

**AutoRecon AI** is an autonomous financial controller and settlement copilot that:
1. **Automates 3-Way Reconciliation**: Matches Store Orders ⟷ Razorpay Settlements ⟷ Bank Statement Credits in real time.
2. **Audits Contractual MDR Fees & Taxes**: Enforces contracted MDR rate (e.g. 2.00% + 18% GST) and detects overcharges.
3. **Flags Settlement SLA Delays**: Monitors payout latency and alerts when settlements exceed T+2 banking turnaround.
4. **Conversational AI CFO Copilot**: Empowers finance teams to query balances, explain variances, and analyze gateway expenses using natural language.
5. **1-Click Dispute & Audit Resolution**: Generates formal, audit-ready dispute letters directly addressed to Razorpay Merchant Support.

---

## 🏗️ Architecture & 3-Way Matching Flow

```
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         AutoRecon AI Architecture                           │
 └─────────────────────────────────────────────────────────────────────────────┘
                                        │
      ┌─────────────────────────────────┼─────────────────────────────────┐
      ▼                                 ▼                                 ▼
┌──────────────┐               ┌──────────────────┐              ┌─────────────────┐
│ Store Orders │               │ Razorpay Gateway │              │ Bank Statements │
│ (ERP / Sales)│               │  (Settlements)   │              │   (UTR Ledger)  │
└──────┬───────┘               └────────┬─────────┘              └────────┬────────┘
       │                                │                                 │
       └───────────────────────┬────────┴─────────────────────────────────┘
                               ▼
            ┌─────────────────────────────────────────┐
            │   3-Way Reconciliation & Audit Engine   │
            │  • Order ID & Gross Amount Match        │
            │  • MDR Fee Verification (2% + 18% GST)  │
            │  • Bank UTR Credit Confirmation         │
            │  • T+2 Settlement SLA Timeline Check    │
            └────────────────────┬────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│   Interactive Controller UI     │             │       AI CFO Copilot Agent      │
│  • Health Score KPI Cards       │             │  • Natural Language Q&A         │
│  • Visual Charts (Donut/Bar)    │ <=========> │  • Root-Cause Financial Insight │
│  • Anomaly Ledger with Filters  │             │  • 1-Click Dispute Generator    │
└─────────────────────────────────┘             └─────────────────────────────────┘
```

---

## ⚡ Quick Start & Running in JetBrains IntelliJ IDEA

### Prerequisites
- **Java 21 LTS**
- **Maven 3.9+** (or use Maven within IntelliJ)
- **JetBrains IntelliJ IDEA** (Community or Ultimate)

### 1. Open in IntelliJ IDEA
1. Launch **IntelliJ IDEA**.
2. Click **Open** (or `File -> Open`).
3. Select the folder: `C:\Users\divya\.gemini\antigravity\scratch\autorecon-ai`.
4. IntelliJ will automatically detect Maven and index all dependencies.

### 2. Run the Application
- Open `src/main/java/com/razorpay/autorecon/AutoReconApplication.java`.
- Click the green **Run ▶** button next to `main()`.
- *Or run in terminal:*
  ```bash
  mvn spring-boot:run
  ```

### 3. Open the Live Dashboard
Navigate in your browser to:
👉 **`http://localhost:8080`**

---

## 🎬 3-Minute Demo Video Walkthrough Script (For Submission)

| Time | Action on Screen | Voiceover / Pitch |
| :--- | :--- | :--- |
| **0:00 - 0:30** | Open Dashboard at `http://localhost:8080`. | *"Hi judges! Today we present AutoRecon AI for Track 04: AI Finance Controller. Every Razorpay merchant struggles with 3-way reconciliation between their sales catalog, Razorpay settlement batches, and bank credit statements."* |
| **0:30 - 1:00** | Click **"Load Demo Dataset"**. Watch KPI cards, donut chart, and ledger populate. | *"With 1 click, our 3-way reconciliation engine matches store orders with Razorpay payments and bank UTRs. We instantly see our 91.4% Recon Health Score, ₹82,400 in processed volume, and ₹2,140 in flagged anomalies."* |
| **1:00 - 1:45** | Filter ledger by **"MDR Overcharge"** and click **"Audit AI"**. | *"Notice order DEMO_0004: Razorpay charged a 3.5% fee instead of our contracted 2.0% MDR SLA. AutoRecon AI automatically caught this variance and calculated the exact excess deduction."* |
| **1:45 - 2:30** | Interact with **AI CFO Copilot** drawer (Click *'Health Score'*, *'Fee Audit'*, *'Draft Dispute'*). | *"Our AI CFO Copilot provides instant financial reasoning. We can ask natural language questions about fees, tax deductions, or delayed bank credits."* |
| **2:30 - 3:00** | Click **"View & Export Dispute Draft"** modal and show formal email to Razorpay Support. | *"With one click, AutoRecon AI generates a formal audit dispute notice with attached UTRs and order IDs ready to send to Razorpay Merchant Support. Thank you!"* |

---

## 📡 REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/recon/summary` | `GET` | Retrieve dashboard KPI metrics, health score, and totals |
| `/api/recon/run` | `POST` | Trigger fresh 3-way reconciliation run |
| `/api/recon/orders` | `GET` | List orders with optional `status` query filter |
| `/api/recon/discrepancies` | `GET` | List all unresolved financial anomalies |
| `/api/chat` | `POST` | Chat with AI CFO Copilot (`{"message": "..."}`) |
| `/api/chat/dispute-draft` | `GET` | Fetch generated formal Razorpay Merchant Dispute Letter |
| `/api/ingest/demo` | `POST` | Seed 35 realistic merchant orders with edge cases |
| `/api/ingest/upload-orders`| `POST` | Upload custom CSV of store sales orders |

---

## 🏆 Key Submission Differentiators

1. **Zero-Config Resilience**: Works 100% out of the box with embedded H2 database and dual AI mode (local financial reasoning engine + Gemini Cloud LLM).
2. **True 3-Way Matching**: Audits the entire lifecycle: Store Order ⟷ Razorpay Settlement ⟷ Bank UTR Credit.
3. **Actionable Financial Output**: Does not stop at reporting anomalies; generates copy-ready formal dispute notices with exact calculations.
4. **Enterprise-Grade Java Architecture**: Clean layered Spring Boot architecture (Model-Repository-Service-Controller).
