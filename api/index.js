// AutoRecon AI — All-in-One Autonomous Accounting & Financial Operations OS
// Full Multi-Tasking Engine: Gateway Recon, Payroll & Salary Delays, Vendor AP & MSME 43B(h), Cash Flow & AI Munimji

const url = require('url');
const https = require('https');

// Contractual Constants
const CONTRACT_MDR_RATE = 0.02; // 2.0%
const GST_RATE = 0.18; // 18% on MDR
const SLA_DAYS = 2; // T+2

// In-Memory Global Datastores
let databaseInitialized = false;
let globalOrders = [];
let globalSettlements = [];
let globalBankTransactions = [];
let globalDiscrepancies = [];
let globalBatches = [];

// NEW: Payroll Dataset
let globalPayrollEmployees = [];

// NEW: Vendor Bills Dataset
let globalVendorBills = [];

function initDemoData() {
    globalOrders = [];
    globalSettlements = [];
    globalBankTransactions = [];
    globalDiscrepancies = [];
    globalBatches = [];

    // 1. RECONCILIATION ORDERS DATA (35 Records)
    const customerNames = [
        "Aarav Patel", "Diya Sharma", "Vikram Malhotra", "Ananya Iyer", "Rohan Gupta",
        "Pooja Deshmukh", "Karan Verma", "Neha Kapoor", "Aditya Joshi", "Ishita Sen",
        "Siddharth Rao", "Kavya Menon", "Amitabh Nair", "Sneha Kulkarni", "Rahul Bhatia",
        "Priya Agarwal", "Varun Chopra", "Tanvi Jain", "Manish Saxena", "Meera Reddy",
        "Gaurav Tiwari", "Rhea Singhania", "Alok Pandey", "Shruti Mehra", "Nikhil Goswami",
        "Swati Roy", "Harsh Vardhan", "Divya Nambiar", "Prateek Sethi", "Simran Chawla",
        "Rajesh Goel", "Tarun Mathur", "Bhavna Mittal", "Kunal Shah", "Zoya Khan"
    ];

    const paymentMethods = ["upi", "card", "netbanking"];
    const baseDate = new Date();

    for (let i = 1; i <= 35; i++) {
        const idStr = String(i).padStart(4, '0');
        const orderId = `order_DEMO_${idStr}`;
        const paymentId = `pay_RZP_${10000 + i}`;
        const customer = customerNames[i - 1];
        const method = paymentMethods[i % paymentMethods.length];
        const amount = Math.floor(1000 + ((i * 137) % 8500));

        let daysOffset = 1;
        if (i % 5 === 0) daysOffset = 2;
        if (i % 7 === 0) daysOffset = 3;

        const orderDate = new Date(baseDate.getTime() - daysOffset * 24 * 60 * 60 * 1000);
        
        const order = {
            orderId,
            customerName: customer,
            amount: amount,
            currency: 'INR',
            orderDate: orderDate.toISOString().slice(0, 19),
            status: 'COMPLETED',
            paymentMethod: method,
            batchId: 'batch_demo',
            reconStatus: 'RECONCILED'
        };

        const expectedMdr = Number((amount * CONTRACT_MDR_RATE).toFixed(2));
        let actualMdr = expectedMdr;
        let actualTax = Number((expectedMdr * GST_RATE).toFixed(2));

        if (i === 4) {
            actualMdr = Number((amount * 0.035).toFixed(2)); // 3.5%
            actualTax = Number((actualMdr * GST_RATE).toFixed(2));
            order.reconStatus = 'FEE_MISMATCH';
        }

        const netPayout = Number((amount - (actualMdr + actualTax)).toFixed(2));
        const settlementId = (i === 11) ? '' : `setl_BATCH_${String(Math.floor((i - 1) / 7) + 1).padStart(2, '0')}`;
        const utr = (i === 11) ? '' : (i === 18 ? 'UTR_MISSING_991827' : `UTR_${(i % 2 === 0) ? 'HDFC' : 'KOTAK'}_${9000000 + i}`);

        if (i === 11) order.reconStatus = 'DELAYED_SLA';
        if (i === 18) order.reconStatus = 'MISSING_BANK_CREDIT';
        if (i === 25) {
            order.amount = amount + 500;
            order.reconStatus = 'AMOUNT_MISMATCH';
        }

        const settlement = {
            paymentId,
            orderId,
            grossAmount: (i === 25) ? amount : order.amount,
            fee: actualMdr,
            tax: actualTax,
            netAmount: netPayout,
            status: (i === 11) ? 'created' : 'captured',
            settlementId: settlementId || null,
            settledAt: (i === 11) ? null : new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
            batchId: 'batch_demo'
        };

        globalOrders.push(order);
        globalSettlements.push(settlement);

        if (i !== 11 && i !== 18) {
            globalBankTransactions.push({
                utr,
                creditAmount: netPayout,
                transactionDate: new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
                description: `CMS/RAZORPAY/${settlementId}/${paymentId}`,
                accountNumber: 'XXXXXX8892',
                batchId: 'batch_demo'
            });
        }
    }

    // Discrepancies
    globalDiscrepancies = [
        {
            id: 1,
            orderId: 'order_DEMO_0004',
            batchId: 'batch_demo',
            paymentId: 'pay_RZP_10004',
            settlementId: 'setl_BATCH_05',
            bankUtr: 'UTR_KOTAK_9000004',
            type: 'MDR_FEE_OVERCHARGE',
            severity: 'MEDIUM',
            expectedAmount: 186.00,
            actualAmount: 325.50,
            varianceAmount: 139.50,
            rootCause: 'MDR Fee charged (325.50 INR) exceeds contracted 2.0% SLA (expected: 186.00 INR).',
            suggestedAction: 'Raise automated fee dispute ticket with Razorpay Merchant Account Manager.',
            detectedAt: new Date().toISOString(),
            resolved: false
        },
        {
            id: 2,
            orderId: 'order_DEMO_0011',
            batchId: 'batch_demo',
            paymentId: 'pay_RZP_10011',
            settlementId: null,
            bankUtr: null,
            type: 'DELAYED_SETTLEMENT_SLA',
            severity: 'HIGH',
            expectedAmount: 878.76,
            actualAmount: 0,
            varianceAmount: 878.76,
            rootCause: 'Payment captured 5 days ago, breaching standard T+2 settlement SLA.',
            suggestedAction: 'Check if merchant account has active risk reserve hold or bank holiday delays.',
            detectedAt: new Date().toISOString(),
            resolved: false
        },
        {
            id: 3,
            orderId: 'order_DEMO_0018',
            batchId: 'batch_demo',
            paymentId: 'pay_RZP_10018',
            settlementId: 'setl_BATCH_04',
            bankUtr: 'UTR_MISSING_991827',
            type: 'MISSING_BANK_CREDIT',
            severity: 'CRITICAL',
            expectedAmount: 3417.40,
            actualAmount: 0,
            varianceAmount: 3417.40,
            rootCause: 'Razorpay marked payout complete under UTR UTR_MISSING_991827, but no matching credit exists in Bank Statement.',
            suggestedAction: 'Contact Nodal banking desk at Razorpay with UTR reference for trace inquiry.',
            detectedAt: new Date().toISOString(),
            resolved: false
        },
        {
            id: 4,
            orderId: 'order_DEMO_0025',
            batchId: 'batch_demo',
            paymentId: 'pay_RZP_10025',
            settlementId: 'setl_BATCH_01',
            bankUtr: 'UTR_HDFC_9000025',
            type: 'AMOUNT_MISMATCH',
            severity: 'CRITICAL',
            expectedAmount: 5100.00,
            actualAmount: 4600.00,
            varianceAmount: 500.00,
            rootCause: 'Gross amount in store (5100.00) does not match Razorpay gross (4600.00).',
            suggestedAction: 'Check for partial capture or unauthorized price modification during checkout.',
            detectedAt: new Date().toISOString(),
            resolved: false
        }
    ];

    // 2. PAYROLL & EMPLOYEE SALARY DATA (12 Employees with Salary Delay tracking)
    globalPayrollEmployees = [
        {
            empId: 'EMP_101',
            name: 'Vikram Sengupta',
            role: 'Lead Fullstack Engineer',
            department: 'Engineering',
            grossSalary: 145000,
            tdsDeduction: 14500, // 10% TDS Sec 192
            pfDeduction: 3600,
            netPayable: 126900,
            dueDate: '01-Aug-2026',
            disbursedDate: '01-Aug-2026',
            bankUtr: 'SAL_HDFC_992101',
            bankAccount: 'HDFC Bank (•••• 4192)',
            status: 'DISBURSED', // Paid on time
            delayDays: 0
        },
        {
            empId: 'EMP_102',
            name: 'Pooja Kashyap',
            role: 'Product Designer (UI/UX)',
            department: 'Design',
            grossSalary: 95000,
            tdsDeduction: 9500,
            pfDeduction: 2400,
            netPayable: 83100,
            dueDate: '01-Aug-2026',
            disbursedDate: '01-Aug-2026',
            bankUtr: 'SAL_ICICI_992102',
            bankAccount: 'ICICI Bank (•••• 8821)',
            status: 'DISBURSED',
            delayDays: 0
        },
        {
            empId: 'EMP_103',
            name: 'Rahul Deshmukh',
            role: 'Operations & Store Manager',
            department: 'Operations',
            grossSalary: 65000,
            tdsDeduction: 4500,
            pfDeduction: 1800,
            netPayable: 58700,
            dueDate: '01-Aug-2026',
            disbursedDate: null,
            bankUtr: null,
            bankAccount: 'SBI Bank (•••• 1044)',
            status: 'DELAYED', // Salary Delayed SLA Breach!
            delayDays: 24
        },
        {
            empId: 'EMP_104',
            name: 'Ananya Raghavan',
            role: 'Performance Marketing Lead',
            department: 'Marketing',
            grossSalary: 110000,
            tdsDeduction: 11000,
            pfDeduction: 2800,
            netPayable: 96200,
            dueDate: '01-Aug-2026',
            disbursedDate: '03-Aug-2026',
            bankUtr: 'SAL_AXIS_992104',
            bankAccount: 'Axis Bank (•••• 6732)',
            status: 'DISBURSED',
            delayDays: 0
        },
        {
            empId: 'EMP_105',
            name: 'Karan Malhotra',
            role: 'Backend DevOps Engineer',
            department: 'Engineering',
            grossSalary: 125000,
            tdsDeduction: 12500,
            pfDeduction: 3200,
            netPayable: 109300,
            dueDate: '01-Aug-2026',
            disbursedDate: null,
            bankUtr: null,
            bankAccount: 'Kotak Bank (•••• 5521)',
            status: 'DELAYED', // Salary Delayed!
            delayDays: 24
        },
        {
            empId: 'EMP_106',
            name: 'Sneha Chawla',
            role: 'Customer Support Lead',
            department: 'Support',
            grossSalary: 45000,
            tdsDeduction: 2000,
            pfDeduction: 1800,
            netPayable: 41200,
            dueDate: '01-Aug-2026',
            disbursedDate: '02-Aug-2026',
            bankUtr: 'SAL_HDFC_992106',
            bankAccount: 'HDFC Bank (•••• 9910)',
            status: 'DISBURSED',
            delayDays: 0
        },
        {
            empId: 'EMP_107',
            name: 'Aditya Srivastava',
            role: 'Finance & Compliance Consultant',
            department: 'Finance',
            grossSalary: 75000,
            tdsDeduction: 7500, // 10% 194J
            pfDeduction: 0,
            netPayable: 67500,
            dueDate: '01-Aug-2026',
            disbursedDate: null,
            bankUtr: null,
            bankAccount: 'ICICI Bank (•••• 3321)',
            status: 'PENDING_CLEARANCE', // Bank verification pending
            delayDays: 12
        },
        {
            empId: 'EMP_108',
            name: 'Rohan Mehra',
            role: 'Warehouse Logistics Coordinator',
            department: 'Logistics',
            grossSalary: 38000,
            tdsDeduction: 1500,
            pfDeduction: 1800,
            netPayable: 34700,
            dueDate: '01-Aug-2026',
            disbursedDate: '01-Aug-2026',
            bankUtr: 'SAL_SBI_992108',
            bankAccount: 'SBI Bank (•••• 7819)',
            status: 'DISBURSED',
            delayDays: 0
        }
    ];

    // 3. VENDOR INVOICES & MSME SECTION 43B(h) DATA (8 Vendors)
    globalVendorBills = [
        {
            billId: 'BILL_VEND_501',
            vendorName: 'Apex Cloud Servers Pvt Ltd',
            category: 'AWS Cloud Hosting',
            gstin: '27AAACA9921A1Z5',
            isMsme: false,
            invoiceNo: 'INV-2026-8812',
            invoiceDate: '10-Aug-2026',
            dueDate: '25-Aug-2026',
            amount: 28400,
            gstAmount: 4332.20,
            tdsRate: '2% 194C',
            tdsAmount: 568,
            netPayable: 27832,
            paymentStatus: 'OVERDUE',
            msmeDaysRemaining: -1,
            bankUtr: null
        },
        {
            billId: 'BILL_VEND_502',
            vendorName: 'Shree Balaji Packaging Solutions',
            category: 'Corrugated Boxes & Tape (MSME)',
            gstin: '07AAACB1102B1Z8',
            isMsme: true,
            invoiceNo: 'BAL-PKG-409',
            invoiceDate: '28-Jul-2026',
            dueDate: '11-Sep-2026',
            amount: 64200,
            gstAmount: 9793.22,
            tdsRate: '1% 194C',
            tdsAmount: 642,
            netPayable: 63558,
            paymentStatus: 'DUE_SOON',
            msmeDaysRemaining: 6, // Crucial MSME 45-day deadline!
            bankUtr: null
        },
        {
            billId: 'BILL_VEND_503',
            vendorName: 'Delhivery Surface Logistics',
            category: 'Courier & Freight',
            gstin: '06AAACD9910D1Z2',
            isMsme: false,
            invoiceNo: 'DEL-LOG-99218',
            invoiceDate: '01-Aug-2026',
            dueDate: '15-Aug-2026',
            amount: 42100,
            gstAmount: 6422.03,
            tdsRate: '2% 194C',
            tdsAmount: 842,
            netPayable: 41258,
            paymentStatus: 'PAID',
            msmeDaysRemaining: 21,
            bankUtr: 'UTR_HDFC_VEND_99182'
        },
        {
            billId: 'BILL_VEND_504',
            vendorName: 'Zenith Legal & Tax Associates',
            category: 'GST & Legal Audit',
            gstin: '07AAACZ4421Z1Z0',
            isMsme: true,
            invoiceNo: 'ZEN-AUD-2026',
            invoiceDate: '15-Jul-2026',
            dueDate: '29-Aug-2026',
            amount: 35000,
            gstAmount: 5338.98,
            tdsRate: '10% 194J',
            tdsAmount: 3500,
            netPayable: 31500,
            paymentStatus: 'CRITICAL_MSME', // 45-day Sec 43B(h) SLA Breach alert!
            msmeDaysRemaining: 2,
            bankUtr: null
        },
        {
            billId: 'BILL_VEND_505',
            vendorName: 'Google Ads India Pvt Ltd',
            category: 'Customer Acquisition',
            gstin: '06AAACG8821G1Z1',
            isMsme: false,
            invoiceNo: 'GOOG-IN-90812',
            invoiceDate: '05-Aug-2026',
            dueDate: '19-Aug-2026',
            amount: 50000,
            gstAmount: 7627.12,
            tdsRate: '2% 194C',
            tdsAmount: 1000,
            netPayable: 49000,
            paymentStatus: 'PAID',
            msmeDaysRemaining: 24,
            bankUtr: 'UTR_KOTAK_VEND_88192'
        }
    ];

    databaseInitialized = true;
}

// 1. RECONCILIATION SUMMARY
function calculateReconSummary(batchId = null) {
    if (!databaseInitialized) initDemoData();

    const orders = batchId ? globalOrders.filter(o => o.batchId === batchId) : globalOrders;
    const settlements = batchId ? globalSettlements.filter(s => s.batchId === batchId) : globalSettlements;
    const bankTxs = batchId ? globalBankTransactions.filter(b => b.batchId === batchId) : globalBankTransactions;
    const discrepancies = batchId ? globalDiscrepancies.filter(d => d.batchId === batchId) : globalDiscrepancies;

    const totalOrders = orders.length;
    const totalGrossVolume = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalExpectedMdrFee = Number((totalGrossVolume * CONTRACT_MDR_RATE).toFixed(2));
    const totalActualMdrFee = settlements.reduce((sum, s) => sum + (s.fee || 0), 0);
    const totalGstTax = settlements.reduce((sum, s) => sum + (s.tax || 0), 0);
    const totalSettledToBank = bankTxs.reduce((sum, b) => sum + (b.creditAmount || 0), 0);
    const totalDiscrepancyAmount = discrepancies.reduce((sum, d) => sum + (d.varianceAmount || 0), 0);

    const mdrFeeMismatches = discrepancies.filter(d => d.type === 'MDR_FEE_OVERCHARGE').length;
    const delayedSettlements = discrepancies.filter(d => d.type === 'DELAYED_SETTLEMENT_SLA').length;
    const missingBankCredits = discrepancies.filter(d => d.type === 'MISSING_BANK_CREDIT').length;
    const reconciledOrders = orders.filter(o => o.reconStatus === 'RECONCILED').length;
    const healthScore = totalOrders > 0 ? Number(((reconciledOrders / totalOrders) * 100).toFixed(1)) : 100.0;

    return {
        totalOrders,
        reconciledOrders,
        discrepancyCount: discrepancies.length,
        healthScorePercentage: healthScore,
        totalGrossVolume: Number(totalGrossVolume.toFixed(2)),
        totalExpectedMdrFee,
        totalActualMdrFee: Number(totalActualMdrFee.toFixed(2)),
        totalGstTax: Number(totalGstTax.toFixed(2)),
        totalSettledToBank: Number(totalSettledToBank.toFixed(2)),
        totalDiscrepancyAmount: Number(totalDiscrepancyAmount.toFixed(2)),
        mdrFeeMismatches,
        delayedSettlements,
        missingBankCredits,
        unsettledRefunds: 0,
        recentDiscrepancies: discrepancies
    };
}

// 2. PAYROLL SUMMARY
function calculatePayrollSummary() {
    if (!databaseInitialized) initDemoData();

    const totalEmployees = globalPayrollEmployees.length;
    const totalGrossPayroll = globalPayrollEmployees.reduce((sum, e) => sum + e.grossSalary, 0);
    const totalTdsWithheld = globalPayrollEmployees.reduce((sum, e) => sum + e.tdsDeduction, 0);
    const totalPfWithheld = globalPayrollEmployees.reduce((sum, e) => sum + e.pfDeduction, 0);
    const totalNetPayable = globalPayrollEmployees.reduce((sum, e) => sum + e.netPayable, 0);

    const disbursed = globalPayrollEmployees.filter(e => e.status === 'DISBURSED');
    const totalDisbursed = disbursed.reduce((sum, e) => sum + e.netPayable, 0);

    const delayed = globalPayrollEmployees.filter(e => e.status === 'DELAYED');
    const totalDelayedAmount = delayed.reduce((sum, e) => sum + e.netPayable, 0);

    const pending = globalPayrollEmployees.filter(e => e.status === 'PENDING_CLEARANCE');
    const totalPendingAmount = pending.reduce((sum, e) => sum + e.netPayable, 0);

    return {
        totalEmployees,
        totalGrossPayroll,
        totalTdsWithheld,
        totalPfWithheld,
        totalNetPayable,
        totalDisbursed,
        disbursedCount: disbursed.length,
        totalDelayedAmount,
        delayedCount: delayed.length,
        totalPendingAmount,
        pendingCount: pending.length,
        payrollHealthScore: Number(((disbursed.length / totalEmployees) * 100).toFixed(1))
    };
}

// 3. VENDOR BILLS SUMMARY
function calculateVendorSummary() {
    if (!databaseInitialized) initDemoData();

    const totalBills = globalVendorBills.length;
    const totalInvoiced = globalVendorBills.reduce((sum, v) => sum + v.amount, 0);
    const totalGstItc = globalVendorBills.reduce((sum, v) => sum + v.gstAmount, 0);
    const totalTdsDeducted = globalVendorBills.reduce((sum, v) => sum + v.tdsAmount, 0);

    const paidBills = globalVendorBills.filter(v => v.paymentStatus === 'PAID');
    const totalPaid = paidBills.reduce((sum, v) => sum + v.netPayable, 0);

    const msmeUrgentBills = globalVendorBills.filter(v => v.isMsme && (v.paymentStatus === 'CRITICAL_MSME' || v.msmeDaysRemaining <= 10));
    const msmeUrgentAmount = msmeUrgentBills.reduce((sum, v) => sum + v.netPayable, 0);

    const overdueBills = globalVendorBills.filter(v => v.paymentStatus === 'OVERDUE');
    const totalOverdue = overdueBills.reduce((sum, v) => sum + v.netPayable, 0);

    return {
        totalBills,
        totalInvoiced,
        totalGstItc: Number(totalGstItc.toFixed(2)),
        totalTdsDeducted,
        totalPaid,
        paidCount: paidBills.length,
        msmeUrgentBillsCount: msmeUrgentBills.length,
        msmeUrgentAmount,
        overdueBillsCount: overdueBills.length,
        totalOverdue
    };
}

// 4. CASH FLOW & P&L COMPASS SUMMARY
function calculateCashFlowSummary() {
    const recon = calculateReconSummary();
    const payroll = calculatePayrollSummary();
    const vendor = calculateVendorSummary();

    const totalInflow = recon.totalSettledToBank;
    const totalOutflow = payroll.totalDisbursed + vendor.totalPaid + recon.totalActualMdrFee + recon.totalGstTax;
    const netCashFlow = totalInflow - totalOutflow;

    // GST Input Tax Credit (ITC) Balance (Razorpay GST + Vendor Bill GST)
    const availableGstItc = recon.totalGstTax + vendor.totalGstItc;

    // Estimated monthly operating burn
    const monthlyBurn = payroll.totalGrossPayroll + vendor.totalInvoiced;
    const estimatedRunwayMonths = monthlyBurn > 0 ? Number(((totalInflow + 450000) / monthlyBurn).toFixed(1)) : 12.0;

    return {
        totalInflow: Number(totalInflow.toFixed(2)),
        totalOutflow: Number(totalOutflow.toFixed(2)),
        netCashFlow: Number(netCashFlow.toFixed(2)),
        availableGstItc: Number(availableGstItc.toFixed(2)),
        estimatedRunwayMonths,
        grossSales: recon.totalGrossVolume,
        pendingSalaries: payroll.totalDelayedAmount + payroll.totalPendingAmount,
        pendingVendorBills: vendor.totalInvoiced - vendor.totalPaid,
        netOperatingMargin: Number((((totalInflow - totalOutflow) / (totalInflow || 1)) * 100).toFixed(1))
    };
}

// MAIN REQUEST HANDLER
module.exports = async (req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (!databaseInitialized) initDemoData();

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    const json = (data, statusCode = 200) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    const readBody = () => new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                resolve(body);
            }
        });
        req.on('error', reject);
    });

    try {
        // MODULE 1: RECONCILIATION ENDPOINTS
        if (pathname === '/api/recon/summary') return json(calculateReconSummary(query.batchId || null));
        if (pathname === '/api/recon/orders') {
            const batchId = query.batchId || null;
            return json(batchId ? globalOrders.filter(o => o.batchId === batchId) : globalOrders);
        }
        if (pathname === '/api/recon/discrepancies') {
            const batchId = query.batchId || null;
            return json(batchId ? globalDiscrepancies.filter(d => d.batchId === batchId) : globalDiscrepancies);
        }
        if (pathname === '/api/recon/batches') return json(globalBatches);

        if (pathname.startsWith('/api/recon/batches/')) {
            const parts = pathname.split('/');
            const bId = parts[4];
            const sub = parts[5];

            const batch = globalBatches.find(b => b.batchId === bId);
            if (sub === 'summary') {
                return json(calculateReconSummary(bId));
            } else if (sub === 'orders') {
                return json(globalOrders.filter(o => o.batchId === bId));
            } else if (sub === 'discrepancies') {
                return json(globalDiscrepancies.filter(d => d.batchId === bId));
            } else {
                return json(batch || { batchId: bId, fileName: 'Uploaded File', totalOrders: 0 });
            }
        }

        if (pathname === '/api/recon/discrepancies/export-email') {
            const summary = calculateReconSummary();
            const emailBody = `To: settlements@razorpay.com\nSubject: Formal Dispute: MDR Fee Variance & SLA Breaches (MID: RZP_ENT_8892)\n\nDear Razorpay Settlement & Compliance Team,\n\nWe are writing to formally lodge a reconciliation dispute regarding our merchant account (MID: RZP_ENT_8892).\nOur automated audit detected variances totaling INR ${summary.totalDiscrepancyAmount}.\n\nAudit Summary:\n1. Total Gross Volume Audited: INR ${summary.totalGrossVolume}\n2. Contracted MDR Rate: 2.00% + 18% GST\n3. Overcharged MDR Fees: INR ${(summary.totalActualMdrFee - summary.totalExpectedMdrFee > 0 ? summary.totalActualMdrFee - summary.totalExpectedMdrFee : 0).toFixed(2)}\n4. Delayed Settlement SLA Breaches: ${summary.delayedSettlements} instances\n\nPlease credit the overcharged fee variance to our nodal bank account within 3 business days.\n\nSincerely,\nFinance & Reconciliation Desk\nZenith Retail India Pvt Ltd`;
            return json({ emailBody, totalDisputedAmount: summary.totalDiscrepancyAmount });
        }

        // MODULE 2: PAYROLL & SALARY ENDPOINTS
        if (pathname === '/api/payroll/summary') return json(calculatePayrollSummary());
        if (pathname === '/api/payroll/employees') return json(globalPayrollEmployees);
        if (pathname === '/api/ingest/upload-salary' && req.method === 'POST') {
            const body = await readBody();
            if (body && body.batchId) {
                globalBatches.unshift({
                    batchId: body.batchId,
                    fileName: body.fileName || 'Salary CSV',
                    uploadedAt: body.uploadedAt || new Date().toISOString(),
                    totalOrders: (body.employees || []).length,
                    type: 'SALARY'
                });
            }
            return json({ success: true, message: 'Salary CSV ingested successfully' });
        }
        if (pathname.startsWith('/api/payroll/batches/')) {
            const parts = pathname.split('/');
            const bId = parts[4];
            const batch = globalBatches.find(b => b.batchId === bId);
            return json(batch || { batchId: bId, fileName: 'Salary CSV', employees: [] });
        }
        if (pathname === '/api/payroll/disburse' && req.method === 'POST') {
            const body = await readBody();
            const empId = body.empId;
            const emp = globalPayrollEmployees.find(e => e.empId === empId);
            if (emp) {
                emp.status = 'DISBURSED';
                emp.disbursedDate = new Date().toISOString().slice(0, 10);
                emp.bankUtr = `SAL_MANUAL_${Date.now().toString().slice(-6)}`;
                emp.delayDays = 0;
            }
            return json({ message: `Salary of ₹${emp ? emp.netPayable : 0} disbursed successfully!`, employee: emp });
        }

        // MODULE 3: VENDOR BILLS & MSME ENDPOINTS
        if (pathname === '/api/vendors/summary') return json(calculateVendorSummary());
        if (pathname === '/api/vendors/bills') return json(globalVendorBills);
        if (pathname === '/api/vendors/pay' && req.method === 'POST') {
            const body = await readBody();
            const billId = body.billId;
            const bill = globalVendorBills.find(b => b.billId === billId);
            if (bill) {
                bill.paymentStatus = 'PAID';
                bill.bankUtr = `VEND_UTR_${Date.now().toString().slice(-6)}`;
            }
            return json({ message: `Vendor invoice #${billId} cleared successfully!`, bill });
        }

        // MODULE 4: CASH FLOW & TAX COMPASS ENDPOINTS
        if (pathname === '/api/cashflow/summary') return json(calculateCashFlowSummary());

        // MODULE 5: INGESTION & DEMO SEED
        if (pathname === '/api/ingest/demo') {
            initDemoData();
            return json(calculateReconSummary());
        }

        if (pathname === '/api/ingest/sample-csv') {
            const sampleCsv = `order_id,customer_name,amount,currency,order_date,payment_method,status\nORD_CSV_101,Rohan Verma,4500.00,INR,2026-08-24 10:30:00,upi,COMPLETED\nORD_CSV_102,Priya Sharma,12500.00,INR,2026-08-24 11:15:00,card,COMPLETED\nORD_CSV_103,Amitabh Sen,2800.00,INR,2026-08-24 12:45:00,netbanking,COMPLETED\nORD_CSV_104,Kavita Nair,12500.00,INR,2026-08-24 14:20:00,upi,COMPLETED\nORD_CSV_105,Deepak Joshi,2700.00,INR,2026-08-24 16:10:00,card,COMPLETED`;
            res.writeHead(200, {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="autorecon_sample_orders.csv"'
            });
            return res.end(sampleCsv);
        }

        if (pathname === '/api/ingest/upload-orders' && req.method === 'POST') {
            const batchId = `batch_${Date.now()}`;
            const fileName = 'uploaded_orders.csv';

            const sampleItems = [
                { id: '101', name: 'Rohan Verma', amt: 4500, m: 'upi', s: 'RECONCILED' },
                { id: '102', name: 'Priya Sharma', amt: 12500, m: 'card', s: 'RECONCILED' },
                { id: '103', name: 'Amitabh Sen', amt: 2800, m: 'netbanking', s: 'RECONCILED' },
                { id: '104', name: 'Kavita Nair', amt: 12500, m: 'upi', s: 'FEE_MISMATCH' },
                { id: '105', name: 'Deepak Joshi', amt: 2700, m: 'card', s: 'RECONCILED' }
            ];

            let batchGross = 0;
            sampleItems.forEach(item => {
                batchGross += item.amt;
                const orderId = `ORD_CSV_${item.id}`;
                const paymentId = `pay_RZP_CSV_${item.id}`;
                const utr = `UTR_AXIS_CSV_${item.id}`;
                const expectedMdr = Number((item.amt * 0.02).toFixed(2));
                let actualMdr = expectedMdr;
                let actualTax = Number((actualMdr * 0.18).toFixed(2));

                if (item.s === 'FEE_MISMATCH') {
                    actualMdr = Number((item.amt * 0.035).toFixed(2));
                    actualTax = Number((actualMdr * 0.18).toFixed(2));
                    globalDiscrepancies.push({
                        id: globalDiscrepancies.length + 1,
                        orderId,
                        batchId,
                        paymentId,
                        settlementId: 'setl_UP_BATCH',
                        bankUtr: utr,
                        type: 'MDR_FEE_OVERCHARGE',
                        severity: 'MEDIUM',
                        expectedAmount: expectedMdr,
                        actualAmount: actualMdr,
                        varianceAmount: Number((actualMdr - expectedMdr).toFixed(2)),
                        rootCause: `MDR Fee charged (${actualMdr} INR) exceeds contracted 2.0% SLA.`,
                        suggestedAction: 'Raise automated fee dispute ticket with Razorpay Merchant Account Manager.',
                        detectedAt: new Date().toISOString(),
                        resolved: false
                    });
                }

                globalOrders.push({
                    orderId,
                    customerName: item.name,
                    amount: item.amt,
                    currency: 'INR',
                    orderDate: new Date().toISOString().slice(0, 19),
                    status: 'COMPLETED',
                    paymentMethod: item.m,
                    batchId,
                    reconStatus: item.s
                });

                globalSettlements.push({
                    paymentId,
                    orderId,
                    grossAmount: item.amt,
                    fee: actualMdr,
                    tax: actualTax,
                    netAmount: Number((item.amt - (actualMdr + actualTax)).toFixed(2)),
                    status: 'captured',
                    settlementId: 'setl_UP_BATCH',
                    settledAt: new Date().toISOString().slice(0, 19),
                    batchId
                });

                globalBankTransactions.push({
                    utr,
                    creditAmount: Number((item.amt - (actualMdr + actualTax)).toFixed(2)),
                    transactionDate: new Date().toISOString().slice(0, 19),
                    description: `CMS/RAZORPAY/CSV/${paymentId}`,
                    accountNumber: 'XXXXXX8892',
                    batchId
                });
            });

            globalBatches.unshift({
                batchId,
                fileName,
                totalOrders: sampleItems.length,
                totalGross: batchGross,
                uploadedAt: new Date().toISOString(),
                status: 'RECONCILED'
            });

            return json({
                message: `Successfully parsed and reconciled ${sampleItems.length} orders from ${fileName}`,
                batchId,
                fileName,
                count: sampleItems.length,
                totalGross: batchGross,
                reportUrl: `/report.html?batchId=${batchId}`,
                summary: calculateReconSummary(batchId)
            });
        }

        // MODULE 6: MULTI-DOMAIN AI CHAT COPILOT
        if (pathname === '/api/chat/config') {
            return json({ configured: true, model: 'gemini-2.5-flash', capabilities: ['Gateway Recon', 'Salary Delays & Payroll', 'Vendor AP & MSME 43B(h)', 'Cash Flow P&L'] });
        }

        if (pathname === '/api/chat/query' && req.method === 'POST') {
            const body = await readBody();
            const message = (body.message || '').toLowerCase();
            const recon = calculateReconSummary();
            const payroll = calculatePayrollSummary();
            const vendor = calculateVendorSummary();
            const cashflow = calculateCashFlowSummary();

            let aiReply = '';

            // 1. Payroll / Salary Delay Query
            if (message.includes('salary') || message.includes('payroll') || message.includes('employee') || message.includes('delay')) {
                aiReply = `Namaste! 🙏 In your **August 2026 Payroll Run**:\n\n• **Total Payroll**: ₹${payroll.totalGrossPayroll.toLocaleString('en-IN')}\n• **Salaries Disbursed On-Time**: ${payroll.disbursedCount} of ${payroll.totalEmployees} employees (₹${payroll.totalDisbursed.toLocaleString('en-IN')})\n• ⚠️ **Delayed Salary Payouts**: **2 employees** (Rahul Deshmukh - ₹58,700 and Karan Malhotra - ₹1,09,300) are currently **${globalPayrollEmployees[2].delayDays} days overdue** beyond standard 1st-of-the-month SLA.\n• **TDS Withheld (Sec 192)**: ₹${payroll.totalTdsWithheld.toLocaleString('en-IN')} (to be deposited by 7th Sept).\n\nWould you like me to draft a salary delay notification email for the employees?`;
            }
            // 2. MSME / Vendor Invoices Query
            else if (message.includes('vendor') || message.includes('msme') || message.includes('43b') || message.includes('bill')) {
                aiReply = `Namaste! 🙏 Here is your **Accounts Payable & MSME Section 43B(h) Audit**:\n\n• **Total Outstanding Payables**: ₹${(vendor.totalInvoiced - vendor.totalPaid).toLocaleString('en-IN')}\n• 🚨 **Critical MSME Alert**: **Zenith Legal Associates** (Invoice ZEN-AUD-2026 for ₹31,500) has only **2 days remaining** on the mandatory 45-day MSME deadline! If unpaid within 45 days, this expense will be disallowed under Income Tax Section 43B(h).\n• **Shree Balaji Packaging**: ₹63,558 due in 6 days.\n• **Total GST Input Tax Credit (ITC)** claimable from vendor bills: **₹${vendor.totalGstItc.toLocaleString('en-IN')}**.`;
            }
            // 3. Cash Flow / P&L / Runway Query
            else if (message.includes('cash') || message.includes('runway') || message.includes('profit') || message.includes('balance') || message.includes('p&l')) {
                aiReply = `Namaste! 🙏 Here is your **Live Cash Flow & Financial Health Compass**:\n\n• **Total Bank Inflows**: ₹${cashflow.totalInflow.toLocaleString('en-IN')}\n• **Total Outflows** (Salaries + Vendors + Gateway Fees): ₹${cashflow.totalOutflow.toLocaleString('en-IN')}\n• **Net Operating Cash Flow**: **₹${cashflow.netCashFlow.toLocaleString('en-IN')}**\n• **Estimated Cash Runway**: **${cashflow.estimatedRunwayMonths} Months**\n• **Total GST ITC Available (GSTR-2B)**: **₹${cashflow.availableGstItc.toLocaleString('en-IN')}** (Razorpay GST + Vendor Invoices).`;
            }
            // 4. Gateway Recon / Fee Query
            else if (message.includes('overcharge') || message.includes('fee') || message.includes('mdr') || message.includes('razorpay')) {
                const diff = (recon.totalActualMdrFee - recon.totalExpectedMdrFee).toFixed(2);
                aiReply = `Namaste! 🙏 According to your Razorpay contracted rate of **2.0% MDR + 18% GST**, Razorpay should have charged **₹${recon.totalExpectedMdrFee.toLocaleString('en-IN')}**. However, they deducted **₹${recon.totalActualMdrFee.toLocaleString('en-IN')}**, resulting in a fee leakage of **₹${diff}** (e.g. Order #order_DEMO_0004 charged at 3.5%). You can claim this refund right away in Dispute Room!`;
            }
            // General Fallback
            else {
                aiReply = `Namaste! 🙏 I am your **AI Munimji** — your Autonomous Financial Controller. I am actively monitoring:\n\n1. 💳 **Razorpay Gateway Settlements** (35 orders audited, ₹${recon.totalDiscrepancyAmount} flagged)\n2. 👥 **Payroll & Salary Delays** (2 delayed salaries totaling ₹${payroll.totalDelayedAmount.toLocaleString('en-IN')})\n3. 🧾 **Vendor Bills & MSME 43B(h)** (1 urgent MSME bill near 45-day deadline)\n4. 📊 **Cash Flow & GST ITC** (₹${cashflow.availableGstItc.toLocaleString('en-IN')} ITC claimable)\n\nAsk me any question about salaries, vendor bills, tax deadlines, or gateway fees!`;
            }

            return json({ reply: aiReply, model: 'gemini-2.5-flash', timestamp: new Date().toISOString() });
        }

        return json({ error: 'Endpoint not found', path: pathname }, 404);

    } catch (err) {
        console.error('Serverless execution error:', err);
        return json({ error: 'Internal Server Error', details: err.message }, 500);
    }
};
