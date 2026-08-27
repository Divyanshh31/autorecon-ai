# AutoRecon AI — Autonomous Multi-Tasking Accounting & Financial Operations OS

> **Live Deployment:** [https://razorpay-autorecon.vercel.app](https://razorpay-autorecon.vercel.app)  
> **GitHub Repository:** [https://github.com/Divyanshh31/autorecon-ai](https://github.com/Divyanshh31/autorecon-ai)  
> **Tech Stack:** Java 21 LTS, Spring Boot 3.3, Node.js Serverless, Spring AI / Gemini 2.5, H2 In-Memory DB, Tailwind CSS, Chart.js, Glassmorphic iOS 18 Design.

---

## Executive Summary

Every modern merchant and growing enterprise in India faces massive operational bottlenecks in financial back-office operations:
1. **Gateway Fee Leakage**: Hidden MDR variations, 18% GST calculation errors, delayed settlements past SLA (T+2), and uncredited bank UTRs.
2. **Employee Salary Delay & Compliance**: Complex TDS (Sec 192) and EPF withholdings, disbursement delays, and lack of automated employee delay communication.
3. **MSME Section 43B(h) Penalties**: Strict statutory 45-day payment deadlines for MSME vendor invoices, risking loss of tax deductions.
4. **Scattered Cash Visibility**: Disconnected gateway inflows, payroll burns, and claimable GST Input Tax Credit (ITC).

**AutoRecon AI** is an all-in-one, multi-tasking autonomous accounting and financial operations operating system. It unifies gateway reconciliation, payroll delay audits, vendor MSME compliance, and cash flow intelligence under a single **AI Munimji Copilot** with **multi-tenant user authentication and private file storage**.

---

## Key Features & Multi-Tasking Hub

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      AutoRecon AI — Multi-Tasking Architecture                         │
 └────────────────────────────────────────────────────────────────────────────────────────┘
                                             │
      ┌───────────────────────┬──────────────┴──────────────┬───────────────────────┐
      ▼                       ▼                             ▼                       ▼
┌──────────────────┐ ┌──────────────────┐       ┌──────────────────┐ ┌──────────────────┐
│ 1. Gateway Recon │ │ 2. Salary Desk   │       │ 3. Vendor MSME   │ │ 4. Cash Flow &   │
│  (Razorpay 3-Way)│ │  (Payroll & SLA) │       │  (Sec 43B-h AP)  │ │   Tax Compass    │
└─────────┬────────┘ └────────┬─────────┘       └────────┬─────────┘ └────────┬─────────┘
          │                   │                          │                    │
          └───────────────────┼──────────────────────────┴────────────────────┘
                              ▼
           ┌─────────────────────────────────────┐
           │   Multi-Tenant User Storage Engine  │
           │  • Sign-Up & Auth Portal (/auth.html│
           │  • Private Workspaces per User ID   │
           │  • Universal Smart CSV File Parser  │
           └──────────────────┬──────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│     Multi-Tab Audit Desks       │     │    AI Munimji Copilot Agent     │
│  • Gateway Recon & Dispute Room │ <==>│  • Gemini 2.5 Multi-Domain Chat │
│  • Sapphire Salary Audit Desk   │     │  • 1-Click Razorpay Dispute Doc │
│  • Vendor MSME 45-Day Aging     │     │  • Automated Delay Notice Copy  │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

---

### 1. Payment Gateway 3-Way Reconciliation
- **Automated 3-Way Matching**: Audits Store Orders <-> Razorpay Settlements <-> Bank Statement Credits.
- **Contractual MDR Audit**: Enforces contracted 2.00% MDR rate + 18% GST, instantly flagging fee overcharges (e.g. 3.5% fee leaks).
- **Settlement SLA Monitor**: Detects captured payments held beyond standard T+2 settlement turnaround.
- **1-Click Dispute Room**: Generates formal, audit-ready Razorpay dispute notices with pre-filled UTR numbers and variance calculations.

### 2. Employee Payroll & Salary Delay Audit Desk (`/salary-report.html`)
- **Universal Salary CSV Detector**: Detects employee rosters with columns (`salary`, `first_name`, `last_name`, `email`, `city`, `joined`).
- **Statutory Computation**: Automatically calculates Gross CTC, Section 192 TDS (10%), EPF deductions, and Net Bank Pay.
- **SLA Delay Tracking**: Identifies overdue payouts with SLA breach timers.
- **Dedicated Cosmic Sapphire Live Desk**: Interactive visual dashboard with **Disburse via Instant IMPS** and **AI Salary Delay Notice Generator**.

### 3. Vendor Accounts Payable & MSME Section 43B(h) Engine
- **45-Day MSME Payment Countdown**: Categorizes vendor bills and warns against Section 43B(h) non-compliance (2-day urgent alerts).
- **TDS & GST ITC Matching**: Computes TDS (Sec 194C/194J) and claimable GSTR-2B Input Tax Credit.
- **1-Click Settlement**: Simulates direct vendor clearing with generated bank UTRs.

### 4. Cash Flow & Tax Compass
- **Real-Time Net Liquidity**: Real-time balance between gateway collections, payroll disbursements, and vendor payments.
- **Runway & Burn Estimator**: Calculates operational burn rate and remaining cash runway in months.
- **GST ITC Pool**: Aggregates claimable Input Tax Credit across gateway processing fees and vendor invoices.

### 5. Multi-Tenant User Authentication & Isolated Storage
- **Apple iOS Glassmorphism Auth Portal (`/auth.html`)**: Register with Name, Business Name, Work Email, GSTIN, and Password.
- **Private Data Partitioning**: Every user has an isolated workspace. Newly registered users see clean dashboards ready for their own uploaded files.
- **Universal Multi-Tab File Library**: Upload custom CSVs and open dedicated audit tabs per file.

### 6. AI Munimji Financial Copilot (Powered by Gemini 2.5)
- Context-aware financial AI assistant that understands Gateway variances, pending salaries, MSME tax alarms, and cash runway.

---

## Quick Demo Credentials

You can test the platform instantly:

| Property | Value |
| :--- | :--- |
| **Live App URL** | [https://razorpay-autorecon.vercel.app](https://razorpay-autorecon.vercel.app) |
| **Auth Portal** | [https://razorpay-autorecon.vercel.app/auth.html](https://razorpay-autorecon.vercel.app/auth.html) |
| **Demo Email** | `demo@zenith.in` |
| **Demo Password** | `zenith123` |
| **Or Choose** | Click **"Create Account"** for your own private workspace or **"Continue as Guest"** |

---

## Local Installation & Running Guide

### Option 1: Java 21 & Spring Boot 3.3 (IntelliJ IDEA / CLI)

#### Prerequisites:
- **Java 21 LTS**
- **Maven 3.9+**

```bash
# Clone the repository
git clone https://github.com/Divyanshh31/autorecon-ai.git
cd autorecon-ai

# Build and run with Maven
mvn spring-boot:run
```
Open **`http://localhost:8080`** in your browser.

---

### Option 2: Node.js / Vercel Serverless

```bash
# Install dependencies
npm install

# Run locally with Vercel CLI
npx vercel dev
```
Open **`http://localhost:3000`** in your browser.

---

## REST API Reference

### Authentication (`/api/auth/*`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Register new user & initialize private workspace |
| `/api/auth/login` | `POST` | Authenticate credentials & return session token |
| `/api/auth/me` | `GET` | Retrieve profile of authenticated user |
| `/api/auth/logout` | `POST` | Invalidate active user session |

### Gateway Reconciliation (`/api/recon/*`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/recon/summary` | `GET` | Retrieve KPI metrics, health score & volume totals |
| `/api/recon/orders` | `GET` | List orders with optional batch filter |
| `/api/recon/discrepancies` | `GET` | List all unresolved financial anomalies |
| `/api/recon/discrepancies/export-email` | `GET` | Generate pre-filled Razorpay Dispute Letter |
| `/api/recon/batches` | `GET` | List all uploaded CSV batch sessions |

### Payroll & Salaries (`/api/payroll/*`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/payroll/summary` | `GET` | Gross payroll, TDS, PF, and delayed salary totals |
| `/api/payroll/employees` | `GET` | Employee register with SLA delay calculations |
| `/api/payroll/disburse` | `POST` | 1-click IMPS salary payout simulation |

### Vendor AP & MSME (`/api/vendors/*`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/vendors/summary` | `GET` | Invoiced total, GST ITC, and MSME 45-day critical alarms |
| `/api/vendors/bills` | `GET` | Vendor invoice register with Section 43B(h) countdown |
| `/api/vendors/pay` | `POST` | Clear vendor invoice with bank UTR match |

### Cash Flow & AI Chat (`/api/cashflow/*` & `/api/chat/*`)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/cashflow/summary` | `GET` | Net operating cash flow, burn rate & runway months |
| `/api/chat/query` | `POST` | Query AI Munimji across all accounting modules |
| `/api/ingest/upload-orders` | `POST` | Upload and reconcile sales orders CSV |
| `/api/ingest/upload-salary` | `POST` | Ingest and audit employee payroll CSV |

---

## Submission Differentiators

1. **True Multi-Tasking Operations**: Extends beyond single-purpose gateway reconciliation to handle **Payroll Delays, MSME Section 43B(h) AP, and Cash Flow Compass**.
2. **Multi-Tenant User Isolation**: Real user sign-up with SHA-256 security and isolated private data stores per business.
3. **Smart Auto-Detecting CSV Engine**: Automatically routes uploaded files to either the **Payment Recon Engine** or the **Cosmic Salary Audit Desk**.
4. **Action-Oriented AI**: Generates copy-ready Razorpay dispute letters and employee delay notices with exact calculations.
5. **Modern iOS 18 Glassmorphism**: Interactive particle canvases, responsive charts, and non-blocking toast notifications.

---

## License
Distributed under the **MIT License**. Created for **Razorpay Buildathon 2026**.
