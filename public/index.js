// AutoRecon AI — All-in-One Autonomous Accounting & Financial Operations OS
// Multi-Tenant User Engine: Sign-Up, Authentication, Isolated Storage & Multi-Tasking Controllers

const url = require('url');
const https = require('https');
const crypto = require('crypto');

// Contractual Constants
const CONTRACT_MDR_RATE = 0.02; // 2.0%
const GST_RATE = 0.18; // 18% on MDR
const SLA_DAYS = 2; // T+2

// Multi-Tenant Datastores
const usersDatabase = {}; // { [email]: userObj }
const sessionsStore = {}; // { [token]: userId }
const userWorkspaces = {}; // { [userId]: { orders, settlements, bankTxs, discrepancies, batches, payroll, vendorBills } }

let databaseInitialized = false;

// Helper: Password hashing
function hashPassword(pwd) {
    return crypto.createHash('sha256').update(pwd || '').digest('hex');
}

// Helper: Get or create workspace for specific user
function getWorkspace(userId) {
    if (!userWorkspaces[userId]) {
        userWorkspaces[userId] = {
            orders: [],
            settlements: [],
            bankTxs: [],
            discrepancies: [],
            batches: [],
            payroll: [],
            vendorBills: []
        };
    }
    return userWorkspaces[userId];
}

// Seed Demo User Workspace
function initDemoData(userId = 'demo_user') {
    const ws = getWorkspace(userId);
    ws.orders = [];
    ws.settlements = [];
    ws.bankTxs = [];
    ws.discrepancies = [];
    ws.batches = [];

    // Preloaded Demo User in Auth DB
    const demoEmail = 'demo@zenith.in';
    if (!usersDatabase[demoEmail]) {
        usersDatabase[demoEmail] = {
            id: 'demo_user',
            name: 'Zenith Retail Demo',
            companyName: 'Zenith Retail India Pvt Ltd',
            email: demoEmail,
            gstin: '27AAACZ8892Z1Z4',
            passwordHash: hashPassword('zenith123'),
            createdAt: new Date().toISOString()
        };
    }

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
            actualMdr = Number((amount * 0.035).toFixed(2));
            actualTax = Number((actualMdr * GST_RATE).toFixed(2));
            order.reconStatus = 'FEE_MISMATCH';
            ws.discrepancies.push({
                id: ws.discrepancies.length + 1,
                orderId,
                batchId: 'batch_demo',
                paymentId,
                settlementId: 'setl_BATCH_05',
                bankUtr: `UTR_KOTAK_${9000000 + i}`,
                type: 'MDR_FEE_OVERCHARGE',
                severity: 'MEDIUM',
                expectedAmount: expectedMdr,
                actualAmount: actualMdr,
                varianceAmount: Number((actualMdr - expectedMdr).toFixed(2)),
                rootCause: `MDR Fee charged (${actualMdr} INR) exceeds contracted 2.0% SLA (expected: ${expectedMdr} INR).`,
                suggestedAction: 'Raise automated fee dispute ticket with Razorpay Merchant Account Manager.',
                detectedAt: new Date().toISOString(),
                resolved: false
            });
        } else if (i === 11) {
            order.reconStatus = 'DELAYED_SLA';
            ws.discrepancies.push({
                id: ws.discrepancies.length + 1,
                orderId,
                batchId: 'batch_demo',
                paymentId,
                settlementId: null,
                bankUtr: null,
                type: 'DELAYED_SETTLEMENT_SLA',
                severity: 'HIGH',
                expectedAmount: Number((amount - (expectedMdr + actualTax)).toFixed(2)),
                actualAmount: 0,
                varianceAmount: Number((amount - (expectedMdr + actualTax)).toFixed(2)),
                rootCause: 'Payment captured 5 days ago, breaching standard T+2 settlement SLA.',
                suggestedAction: 'Check if merchant account has active risk reserve hold or bank holiday delays.',
                detectedAt: new Date().toISOString(),
                resolved: false
            });
        } else if (i === 18) {
            order.reconStatus = 'MISSING_BANK_CREDIT';
            ws.discrepancies.push({
                id: ws.discrepancies.length + 1,
                orderId,
                batchId: 'batch_demo',
                paymentId,
                settlementId: 'setl_BATCH_04',
                bankUtr: 'UTR_MISSING_991827',
                type: 'MISSING_BANK_CREDIT',
                severity: 'CRITICAL',
                expectedAmount: Number((amount - (expectedMdr + actualTax)).toFixed(2)),
                actualAmount: 0,
                varianceAmount: Number((amount - (expectedMdr + actualTax)).toFixed(2)),
                rootCause: 'Razorpay marked payout complete under UTR UTR_MISSING_991827, but no matching credit exists in Bank Statement.',
                suggestedAction: 'Contact Nodal banking desk at Razorpay with UTR reference for trace inquiry.',
                detectedAt: new Date().toISOString(),
                resolved: false
            });
        }

        ws.orders.push(order);

        if (order.reconStatus !== 'DELAYED_SLA') {
            const netSettlement = Number((amount - (actualMdr + actualTax)).toFixed(2));
            const settlementDate = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000);

            ws.settlements.push({
                settlementId: `setl_BATCH_${String(Math.floor((i - 1) / 7) + 1).padStart(2, '0')}`,
                paymentId,
                amount,
                fee: actualMdr,
                tax: actualTax,
                netAmount: netSettlement,
                status: 'SETTLED',
                settledAt: settlementDate.toISOString().slice(0, 19),
                batchId: 'batch_demo'
            });

            if (order.reconStatus !== 'MISSING_BANK_CREDIT') {
                ws.bankTxs.push({
                    utr: `UTR_HDFC_${9000000 + i}`,
                    transactionDate: settlementDate.toISOString().slice(0, 10),
                    creditAmount: netSettlement,
                    description: `CMS/RAZORPAY/SETL_${paymentId}`,
                    batchId: 'batch_demo'
                });
            }
        }
    }

    // 2. PAYROLL & EMPLOYEE REGISTER DATA
    ws.payroll = [
        { empId: 'EMP_101', name: 'Aarav Sharma', role: 'Lead Architect', department: 'Engineering', grossSalary: 145000, tdsDeduction: 14500, pfDeduction: 3600, netPayable: 126900, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_HDFC_991001', delayDays: 0 },
        { empId: 'EMP_102', name: 'Priya Iyer', role: 'Product Lead', department: 'Product', grossSalary: 125000, tdsDeduction: 12500, pfDeduction: 3600, netPayable: 108900, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_ICICI_991002', delayDays: 0 },
        { empId: 'EMP_103', name: 'Rahul Deshmukh', role: 'Senior Developer', department: 'Engineering', grossSalary: 95000, tdsDeduction: 9500, pfDeduction: 3600, netPayable: 81900, status: 'DELAYED', disbursedDate: null, bankUtr: null, delayDays: 24 },
        { empId: 'EMP_104', name: 'Neha Kapoor', role: 'Finance Executive', department: 'Finance', grossSalary: 68000, tdsDeduction: 6800, pfDeduction: 3600, netPayable: 57600, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_KOTAK_991004', delayDays: 0 },
        { empId: 'EMP_105', name: 'Karan Malhotra', role: 'Operations Manager', department: 'Operations', grossSalary: 85000, tdsDeduction: 8500, pfDeduction: 3600, netPayable: 72900, status: 'DELAYED', disbursedDate: null, bankUtr: null, delayDays: 24 },
        { empId: 'EMP_106', name: 'Ananya Sen', role: 'UI/UX Designer', department: 'Design', grossSalary: 72000, tdsDeduction: 7200, pfDeduction: 3600, netPayable: 61200, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_AXIS_991006', delayDays: 0 },
        { empId: 'EMP_107', name: 'Vikram Patel', role: 'Marketing Lead', department: 'Marketing', grossSalary: 78000, tdsDeduction: 7800, pfDeduction: 3600, netPayable: 66600, status: 'PENDING_CLEARANCE', disbursedDate: null, bankUtr: null, delayDays: 0 },
        { empId: 'EMP_108', name: 'Simran Roy', role: 'Customer Support', department: 'Support', grossSalary: 30000, tdsDeduction: 0, pfDeduction: 3600, netPayable: 26400, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_SBI_991008', delayDays: 0 }
    ];

    // 3. VENDOR INVOICES & MSME 45-DAY AGING DATA
    ws.vendorBills = [
        { billId: 'BILL_501', vendorName: 'Apex Cloud Services', category: 'AWS & Infrastructure', invoiceNo: 'INV-2026-881', gstin: '27AAACA9921K1Z1', amount: 48000, gstAmount: 8640, tdsRate: 0.02, tdsDeducted: 960, netPayable: 55680, isMsme: false, invoiceDate: '2026-08-05', dueDate: '2026-08-20', paymentStatus: 'PAID', bankUtr: 'UTR_HDFC_VEND_501', msmeDaysRemaining: null },
        { billId: 'BILL_502', vendorName: 'Balaji Packaging Solutions', category: 'Packaging Supplies', invoiceNo: 'BP-AUG-102', gstin: '27AABCB4419M1Z9', amount: 24500, gstAmount: 4410, tdsRate: 0.01, tdsDeducted: 245, netPayable: 28665, isMsme: true, invoiceDate: '2026-07-20', dueDate: '2026-09-03', paymentStatus: 'UNPAID', bankUtr: null, msmeDaysRemaining: 6 },
        { billId: 'BILL_503', vendorName: 'QuickLogix 3PL Logistics', category: 'Courier & Freight', invoiceNo: 'QL-DEL-9901', gstin: '27AACFQ8129L1ZA', amount: 62000, gstAmount: 11160, tdsRate: 0.02, tdsDeducted: 1240, netPayable: 71920, isMsme: false, invoiceDate: '2026-08-10', dueDate: '2026-08-25', paymentStatus: 'PAID', bankUtr: 'UTR_KOTAK_VEND_503', msmeDaysRemaining: null },
        { billId: 'BILL_504', vendorName: 'Zenith Legal & Compliance', category: 'Legal & Secretarial', invoiceNo: 'ZL-7729', gstin: '27AADFZ1102P1Z3', amount: 31500, gstAmount: 5670, tdsRate: 0.10, tdsDeducted: 3150, netPayable: 34020, isMsme: true, invoiceDate: '2026-07-14', dueDate: '2026-08-28', paymentStatus: 'CRITICAL_MSME', bankUtr: null, msmeDaysRemaining: 2 },
        { billId: 'BILL_505', vendorName: 'Optima Marketing Agency', category: 'Performance Ads', invoiceNo: 'OMA-4401', gstin: '27AABCO5521R1ZK', amount: 55000, gstAmount: 9900, tdsRate: 0.02, tdsDeducted: 1100, netPayable: 63800, isMsme: false, invoiceDate: '2026-08-15', dueDate: '2026-08-30', paymentStatus: 'UNPAID', bankUtr: null, msmeDaysRemaining: null }
    ];

    ws.batches.push({
        batchId: 'batch_demo',
        fileName: 'demo_live_feed.csv',
        uploadedAt: new Date().toISOString(),
        totalOrders: 35,
        type: 'RECON'
    });

    databaseInitialized = true;
}

// Auth Helper: Extract authenticated user from request
function getAuthUser(req) {
    const authHeader = req.headers['authorization'] || req.headers['x-auth-token'] || '';
    let token = '';
    if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    } else {
        token = authHeader.trim();
    }

    if (token && sessionsStore[token]) {
        const userId = sessionsStore[token];
        const user = Object.values(usersDatabase).find(u => u.id === userId);
        if (user) return user;
    }

    return {
        id: 'demo_user',
        name: 'Zenith Retail Demo',
        companyName: 'Zenith Retail India Pvt Ltd',
        email: 'demo@zenith.in',
        gstin: '27AAACZ8892Z1Z4'
    };
}

// 1. RECONCILIATION SUMMARY
function calculateReconSummary(userId, batchId = null) {
    const ws = getWorkspace(userId);
    const orders = batchId ? ws.orders.filter(o => o.batchId === batchId) : ws.orders;
    const settlements = batchId ? ws.settlements.filter(s => s.batchId === batchId) : ws.settlements;
    const bankTxs = batchId ? ws.bankTxs.filter(b => b.batchId === batchId) : ws.bankTxs;
    const discrepancies = batchId ? ws.discrepancies.filter(d => d.batchId === batchId) : ws.discrepancies;

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
        unsettledRefunds: 0
    };
}

// 2. PAYROLL SUMMARY
function calculatePayrollSummary(userId) {
    const ws = getWorkspace(userId);
    const employees = ws.payroll;
    const totalEmployees = employees.length;
    const totalGrossPayroll = employees.reduce((sum, e) => sum + (e.grossSalary || 0), 0);
    const totalTdsWithheld = employees.reduce((sum, e) => sum + (e.tdsDeduction || 0), 0);
    const totalPfWithheld = employees.reduce((sum, e) => sum + (e.pfDeduction || 0), 0);
    const totalNetPayable = employees.reduce((sum, e) => sum + (e.netPayable || 0), 0);

    const disbursed = employees.filter(e => e.status === 'DISBURSED');
    const delayed = employees.filter(e => e.status === 'DELAYED');
    const pending = employees.filter(e => e.status === 'PENDING_CLEARANCE');

    const totalDisbursed = disbursed.reduce((sum, e) => sum + (e.netPayable || 0), 0);
    const totalDelayedAmount = delayed.reduce((sum, e) => sum + (e.netPayable || 0), 0);
    const totalPendingAmount = pending.reduce((sum, e) => sum + (e.netPayable || 0), 0);

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
        pendingCount: pending.length
    };
}

// 3. VENDOR BILLS SUMMARY
function calculateVendorSummary(userId) {
    const ws = getWorkspace(userId);
    const bills = ws.vendorBills;
    const totalBills = bills.length;
    const totalInvoiced = bills.reduce((sum, b) => sum + (b.amount || 0) + (b.gstAmount || 0), 0);
    const totalGstItc = bills.reduce((sum, b) => sum + (b.gstAmount || 0), 0);
    const totalTdsDeducted = bills.reduce((sum, b) => sum + (b.tdsDeducted || 0), 0);
    const totalPaid = bills.filter(b => b.paymentStatus === 'PAID').reduce((sum, b) => sum + (b.netPayable || 0), 0);
    const paidCount = bills.filter(b => b.paymentStatus === 'PAID').length;
    const msmeUrgentBillsCount = bills.filter(b => b.isMsme && (b.paymentStatus === 'CRITICAL_MSME' || b.msmeDaysRemaining <= 2)).length;

    return {
        totalBills,
        totalInvoiced: Number(totalInvoiced.toFixed(2)),
        totalGstItc: Number(totalGstItc.toFixed(2)),
        totalTdsDeducted: Number(totalTdsDeducted.toFixed(2)),
        totalPaid: Number(totalPaid.toFixed(2)),
        paidCount,
        msmeUrgentBillsCount
    };
}

// 4. CASH FLOW & TAX COMPASS
function calculateCashFlowSummary(userId) {
    const recon = calculateReconSummary(userId);
    const payroll = calculatePayrollSummary(userId);
    const vendor = calculateVendorSummary(userId);

    const totalInflow = recon.totalSettledToBank;
    const totalOutflow = payroll.totalDisbursed + vendor.totalPaid + recon.totalActualMdrFee + recon.totalGstTax;
    const netCashFlow = totalInflow - totalOutflow;

    const availableGstItc = recon.totalGstTax + vendor.totalGstItc;
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth-token');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (!databaseInitialized) {
        initDemoData('demo_user');
    }

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

    const authUser = getAuthUser(req);
    const userId = authUser.id;
    const ws = getWorkspace(userId);

    try {
        // =====================================================================
        // AUTHENTICATION & USER MANAGEMENT ENDPOINTS
        // =====================================================================
        if (pathname === '/api/auth/signup' && req.method === 'POST') {
            const body = await readBody();
            const { name, companyName, email, gstin, password } = body;

            if (!email || !password || !name) {
                return json({ message: 'Name, email and password are required' }, 400);
            }

            const cleanEmail = email.toLowerCase().trim();
            if (usersDatabase[cleanEmail]) {
                return json({ message: 'An account with this email already exists' }, 400);
            }

            const newUserId = 'usr_' + Date.now();
            const newUser = {
                id: newUserId,
                name: name.trim(),
                companyName: companyName ? companyName.trim() : 'My Business',
                email: cleanEmail,
                gstin: gstin ? gstin.trim().toUpperCase() : '',
                passwordHash: hashPassword(password),
                createdAt: new Date().toISOString()
            };

            usersDatabase[cleanEmail] = newUser;
            const token = 'tok_' + crypto.randomUUID();
            sessionsStore[token] = newUserId;

            // Initialize fresh workspace for new user
            getWorkspace(newUserId);

            return json({
                token,
                user: { id: newUser.id, name: newUser.name, companyName: newUser.companyName, email: newUser.email, gstin: newUser.gstin }
            });
        }

        if (pathname === '/api/auth/login' && req.method === 'POST') {
            const body = await readBody();
            const { email, password } = body;

            if (!email || !password) {
                return json({ message: 'Email and password are required' }, 400);
            }

            const cleanEmail = email.toLowerCase().trim();
            const user = usersDatabase[cleanEmail];

            if (!user || user.passwordHash !== hashPassword(password)) {
                return json({ message: 'Invalid email or password' }, 401);
            }

            const token = 'tok_' + crypto.randomUUID();
            sessionsStore[token] = user.id;

            return json({
                token,
                user: { id: user.id, name: user.name, companyName: user.companyName, email: user.email, gstin: user.gstin }
            });
        }

        if (pathname === '/api/auth/me') {
            return json({
                user: { id: authUser.id, name: authUser.name, companyName: authUser.companyName, email: authUser.email, gstin: authUser.gstin }
            });
        }

        if (pathname === '/api/auth/logout' && req.method === 'POST') {
            const authHeader = req.headers['authorization'] || '';
            const token = authHeader.replace('Bearer ', '').trim();
            if (token && sessionsStore[token]) {
                delete sessionsStore[token];
            }
            return json({ message: 'Logged out successfully' });
        }

        // =====================================================================
        // MODULE 1: RECONCILIATION ENDPOINTS (USER-SCOPED)
        // =====================================================================
        if (pathname === '/api/recon/summary') return json(calculateReconSummary(userId, query.batchId || null));
        if (pathname === '/api/recon/orders') {
            const batchId = query.batchId || null;
            return json(batchId ? ws.orders.filter(o => o.batchId === batchId) : ws.orders);
        }
        if (pathname === '/api/recon/discrepancies') {
            const batchId = query.batchId || null;
            return json(batchId ? ws.discrepancies.filter(d => d.batchId === batchId) : ws.discrepancies);
        }
        if (pathname === '/api/recon/batches') return json(ws.batches);

        if (pathname.startsWith('/api/recon/batches/')) {
            const parts = pathname.split('/');
            const bId = parts[4];
            const sub = parts[5];

            const batch = ws.batches.find(b => b.batchId === bId);
            if (sub === 'summary') {
                return json(calculateReconSummary(userId, bId));
            } else if (sub === 'orders') {
                return json(ws.orders.filter(o => o.batchId === bId));
            } else if (sub === 'discrepancies') {
                return json(ws.discrepancies.filter(d => d.batchId === bId));
            } else {
                return json(batch || { batchId: bId, fileName: 'Uploaded File', totalOrders: 0 });
            }
        }

        if (pathname === '/api/recon/discrepancies/export-email') {
            const summary = calculateReconSummary(userId);
            const emailBody = `To: settlements@razorpay.com\nSubject: Formal Dispute: MDR Fee Variance & SLA Breaches (MID: ${authUser.companyName || 'MID_8892'})\n\nDear Razorpay Settlement & Compliance Team,\n\nWe are writing to formally lodge a reconciliation dispute regarding our merchant account.\nOur automated audit detected variances totaling INR ${summary.totalDiscrepancyAmount}.\n\nAudit Summary:\n1. Total Gross Volume Audited: INR ${summary.totalGrossVolume}\n2. Contracted MDR Rate: 2.00% + 18% GST\n3. Overcharged MDR Fees: INR ${(summary.totalActualMdrFee - summary.totalExpectedMdrFee > 0 ? summary.totalActualMdrFee - summary.totalExpectedMdrFee : 0).toFixed(2)}\n4. Delayed Settlement SLA Breaches: ${summary.delayedSettlements} instances\n\nPlease credit the overcharged fee variance to our nodal bank account within 3 business days.\n\nSincerely,\nFinance & Reconciliation Desk\n${authUser.companyName || 'Zenith Retail India Pvt Ltd'}`;
            return json({ emailBody, totalDisputedAmount: summary.totalDiscrepancyAmount });
        }

        // =====================================================================
        // MODULE 2: PAYROLL & SALARY ENDPOINTS (USER-SCOPED)
        // =====================================================================
        if (pathname === '/api/payroll/summary') return json(calculatePayrollSummary(userId));
        if (pathname === '/api/payroll/employees') return json(ws.payroll);

        if (pathname === '/api/ingest/upload-salary' && req.method === 'POST') {
            const body = await readBody();
            if (body && body.batchId) {
                ws.batches.unshift({
                    batchId: body.batchId,
                    fileName: body.fileName || 'Salary CSV',
                    uploadedAt: body.uploadedAt || new Date().toISOString(),
                    totalOrders: (body.employees || []).length,
                    type: 'SALARY'
                });
            }
            return json({ success: true, message: 'Salary CSV stored in user workspace' });
        }

        if (pathname.startsWith('/api/payroll/batches/')) {
            const parts = pathname.split('/');
            const bId = parts[4];
            const batch = ws.batches.find(b => b.batchId === bId);
            return json(batch || { batchId: bId, fileName: 'Salary CSV', employees: [] });
        }

        if (pathname === '/api/payroll/disburse' && req.method === 'POST') {
            const body = await readBody();
            const empId = body.empId;
            const emp = ws.payroll.find(e => e.empId === empId);
            if (emp) {
                emp.status = 'DISBURSED';
                emp.disbursedDate = new Date().toISOString().slice(0, 10);
                emp.bankUtr = `SAL_MANUAL_${Date.now().toString().slice(-6)}`;
                emp.delayDays = 0;
            }
            return json({ message: `Salary of ₹${emp ? emp.netPayable : 0} disbursed successfully!`, employee: emp });
        }

        // =====================================================================
        // MODULE 3: VENDOR BILLS & MSME ENDPOINTS (USER-SCOPED)
        // =====================================================================
        if (pathname === '/api/vendors/summary') return json(calculateVendorSummary(userId));
        if (pathname === '/api/vendors/bills') return json(ws.vendorBills);
        if (pathname === '/api/vendors/pay' && req.method === 'POST') {
            const body = await readBody();
            const billId = body.billId;
            const bill = ws.vendorBills.find(b => b.billId === billId);
            if (bill) {
                bill.paymentStatus = 'PAID';
                bill.bankUtr = `VEND_UTR_${Date.now().toString().slice(-6)}`;
            }
            return json({ message: `Vendor invoice #${billId} cleared successfully!`, bill });
        }

        // =====================================================================
        // MODULE 4: CASH FLOW & TAX COMPASS (USER-SCOPED)
        // =====================================================================
        if (pathname === '/api/cashflow/summary') return json(calculateCashFlowSummary(userId));

        // =====================================================================
        // FILE INGESTION & SIMULATION (USER-SCOPED)
        // =====================================================================
        if (pathname === '/api/ingest/demo' && req.method === 'POST') {
            initDemoData(userId);
            return json(calculateReconSummary(userId));
        }

        if (pathname === '/api/ingest/upload-orders' && req.method === 'POST') {
            const body = await readBody();
            if (body && body.batchId) {
                ws.batches.unshift({
                    batchId: body.batchId,
                    fileName: body.fileName || 'Uploaded Batch.csv',
                    uploadedAt: body.uploadedAt || new Date().toISOString(),
                    totalOrders: body.totalOrders || (body.orders || []).length,
                    type: 'RECON'
                });
                if (body.orders) {
                    body.orders.forEach(o => ws.orders.unshift(o));
                }
                if (body.discrepancies) {
                    body.discrepancies.forEach(d => ws.discrepancies.unshift(d));
                }
            }
            return json({
                batchId: body.batchId || 'batch_' + Date.now(),
                fileName: body.fileName || 'Uploaded File',
                count: (body.orders || []).length,
                reportUrl: `/report.html?batchId=${body.batchId}`
            });
        }

        if (pathname === '/api/ingest/simulate' && req.method === 'POST') {
            const body = await readBody();
            const customerName = body.customerName || 'Simulated Customer';
            const amount = parseFloat(body.amount) || 5000;
            const method = body.method || 'upi';
            const scenario = body.scenario || 'CLEAN';

            const orderId = `order_SIM_${Date.now().toString().slice(-4)}`;
            const paymentId = `pay_SIM_${Date.now().toString().slice(-4)}`;
            const expectedMdr = Number((amount * CONTRACT_MDR_RATE).toFixed(2));
            let actualMdr = expectedMdr;
            let reconStatus = 'RECONCILED';

            if (scenario === 'MDR_OVERCHARGE') {
                actualMdr = Number((amount * 0.035).toFixed(2));
                reconStatus = 'FEE_MISMATCH';
                ws.discrepancies.unshift({
                    id: ws.discrepancies.length + 1,
                    orderId,
                    batchId: 'batch_sim',
                    paymentId,
                    settlementId: 'setl_SIM',
                    bankUtr: `UTR_SIM_${Date.now().toString().slice(-4)}`,
                    type: 'MDR_FEE_OVERCHARGE',
                    severity: 'MEDIUM',
                    expectedAmount: expectedMdr,
                    actualAmount: actualMdr,
                    varianceAmount: Number((actualMdr - expectedMdr).toFixed(2)),
                    rootCause: `MDR Fee charged (${actualMdr} INR) exceeds 2.0% SLA.`,
                    suggestedAction: 'Claim fee overcharge refund in dispute room.',
                    detectedAt: new Date().toISOString(),
                    resolved: false
                });
            }

            ws.orders.unshift({
                orderId,
                customerName,
                amount,
                currency: 'INR',
                orderDate: new Date().toISOString().slice(0, 19),
                status: 'COMPLETED',
                paymentMethod: method,
                batchId: 'batch_sim',
                reconStatus
            });

            return json({ success: true, orderId });
        }

        // =====================================================================
        // AI MUNIMJI COPILOT (MULTI-DOMAIN & USER CONTEXT)
        // =====================================================================
        if (pathname === '/api/chat/config') {
            return json({ isLiveGeminiActive: true, model: 'gemini-2.5-flash', persona: 'Multi-Tasking AI Munimji' });
        }

        if (pathname === '/api/chat/query' && req.method === 'POST') {
            const body = await readBody();
            const queryText = (body.message || '').toLowerCase();

            const recon = calculateReconSummary(userId);
            const payroll = calculatePayrollSummary(userId);
            const vendor = calculateVendorSummary(userId);
            const cf = calculateCashFlowSummary(userId);

            let reply = '';

            if (queryText.includes('salary') || queryText.includes('employee') || queryText.includes('delay')) {
                reply = `Namaste! 🙏 In your payroll register for **${authUser.companyName}**, total gross payroll is **₹${payroll.totalGrossPayroll.toLocaleString('en-IN')}** across **${payroll.totalEmployees} employees**.\n\n⚠️ **Salary Delay Alert**: **${payroll.delayedCount} employees** have overdue payouts totaling **₹${payroll.totalDelayedAmount.toLocaleString('en-IN')}** (overdue by 24 days). You can click **"1-Click Disburse"** or generate an **AI Delay Notice** from the Payroll tab.`;
            } else if (queryText.includes('msme') || queryText.includes('vendor') || queryText.includes('43b') || queryText.includes('invoice')) {
                reply = `🧾 **Vendor AP & MSME Audit**:\nYou have **${vendor.totalBills} vendor invoices** totaling **₹${vendor.totalInvoiced.toLocaleString('en-IN')}**.\n\n🔴 **Section 43B(h) Alarm**: **${vendor.msmeUrgentBillsCount} MSME invoice** is within 2 days of the mandatory 45-day payment deadline. Please clear it immediately to safeguard your tax deduction.`;
            } else if (queryText.includes('cash') || queryText.includes('runway') || queryText.includes('tax') || queryText.includes('itc')) {
                reply = `📊 **Cash Flow & Tax Compass**:\n• **Net Operating Cash Flow**: ₹${cf.netCashFlow.toLocaleString('en-IN')}\n• **Estimated Cash Runway**: **${cf.estimatedRunwayMonths} Months**\n• **Claimable GST ITC (Input Tax Credit)**: **₹${cf.availableGstItc.toLocaleString('en-IN')}** available for GSTR-3B offset.`;
            } else if (queryText.includes('dispute') || queryText.includes('leak') || queryText.includes('overcharge') || queryText.includes('fee')) {
                reply = `💳 **Gateway Audit**:\nRazorpay audited volume: ₹${recon.totalGrossVolume.toLocaleString('en-IN')}.\nDetected **${recon.mdrFeeMismatches} fee overcharges** totaling **₹${recon.totalDiscrepancyAmount.toLocaleString('en-IN')}**. Open the Dispute Room to copy your pre-filled Razorpay dispute email.`;
            } else {
                reply = `Namaste! 🙏 I am your **AI Munimji** for **${authUser.companyName}**.\n\nHere is your financial overview:\n• 💳 **Reconciliation Health**: ${recon.healthScorePercentage}% (${recon.totalOrders} orders)\n• 👥 **Pending Salaries**: ₹${payroll.totalDelayedAmount.toLocaleString('en-IN')}\n• 🧾 **MSME 45-Day Alarms**: ${vendor.msmeUrgentBillsCount} urgent bill\n• 📊 **Cash Runway**: ${cf.estimatedRunwayMonths} Months (₹${cf.availableGstItc.toLocaleString('en-IN')} GST ITC)\n\nWhat would you like me to audit or disburse?`;
            }

            return json({ reply });
        }

        // Default 404
        return json({ error: 'Endpoint not found', path: pathname }, 404);

    } catch (err) {
        console.error('API Server Error:', err);
        return json({ error: 'Internal Server Error', message: err.message }, 500);
    }
};
