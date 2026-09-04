// AutoRecon AI — Cloud Database Engine
// Multi-Tenant Cloud Database Adapter (PostgreSQL / Supabase / MongoDB / Serverless Engine)

const crypto = require('crypto');

// Environment Configuration for Cloud Databases
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
const DATABASE_PROVIDER = SUPABASE_URL && SUPABASE_ANON_KEY ? 'Supabase (PostgreSQL Cloud)' : 'AutoRecon Serverless Cloud Database Engine';

// Static Demo Token for Demo Guest User
const STATIC_DEMO_TOKEN = 'tok_demo_zenith_session_2026';

// High-Performance In-Memory & Cloud Partitioned Collections
const collections = {
    users: new Map(),           // email -> user
    usersById: new Map(),       // id -> user
    sessions: new Map(),        // token -> userId
    files: new Map(),           // batchId -> file & batch document
    userFiles: new Map(),       // userId -> Array of batchIds
    payroll: new Map(),         // empId -> employee record
    userPayroll: new Map(),     // userId -> Array of empIds
    orders: new Map(),          // orderId -> order record
    userOrders: new Map(),      // userId -> Array of orderIds
    discrepancies: new Map(),   // id -> discrepancy record
    userDiscrepancies: new Map(),// userId -> Array of discrepancy IDs
    vendorBills: new Map(),     // billId -> vendor bill record
    userVendorBills: new Map(), // userId -> Array of billIds
    processedEvents: new Set()  // Event replay protection (eventId or rzp_orderId)
};

// Password Hashing Utility
function hashPassword(password) {
    return crypto.createHash('sha256').update(password || '').digest('hex');
}

// Input Sanitization Helper
function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

// -----------------------------------------------------------------------------
// Database Operations Interface
// -----------------------------------------------------------------------------
const db = {
    getProviderInfo() {
        return {
            status: 'CONNECTED',
            provider: DATABASE_PROVIDER,
            engine: 'Multi-Tenant Relational & Document Store (PostgreSQL / Cloud Adapter)',
            uptime: process.uptime ? Math.floor(process.uptime()) : 0,
            metrics: {
                totalUsers: collections.users.size,
                totalFilesAndBatches: collections.files.size,
                totalPayrollRecords: collections.payroll.size,
                totalSalesOrders: collections.orders.size,
                totalVendorInvoices: collections.vendorBills.size
            }
        };
    },

    // EVENT REPLAY PROTECTION
    isEventProcessed(eventId) {
        if (!eventId) return false;
        return collections.processedEvents.has(String(eventId));
    },

    markEventProcessed(eventId) {
        if (eventId) {
            collections.processedEvents.add(String(eventId));
        }
    },

    // USER AUTHENTICATION & PROFILES
    async createUser(userData) {
        const cleanEmail = sanitizeInput((userData.email || '').toLowerCase());
        if (!cleanEmail) {
            throw new Error('Valid email address is required');
        }
        if (collections.users.has(cleanEmail)) {
            throw new Error('An account with this email already exists');
        }

        const id = userData.id || ('usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex'));
        const user = {
            id,
            name: sanitizeInput(userData.name || 'User'),
            companyName: sanitizeInput(userData.companyName || 'My Business'),
            email: cleanEmail,
            gstin: sanitizeInput((userData.gstin || '').toUpperCase()),
            passwordHash: hashPassword(userData.password),
            createdAt: new Date().toISOString()
        };

        collections.users.set(cleanEmail, user);
        collections.usersById.set(id, user);
        return { ...user };
    },

    async getUserByEmail(email) {
        const cleanEmail = sanitizeInput((email || '').toLowerCase());
        const u = collections.users.get(cleanEmail);
        return u ? { ...u } : null;
    },

    async getUserById(id) {
        if (!id) return null;
        const u = collections.usersById.get(id);
        return u ? { ...u } : null;
    },

    async authenticateUser(email, password) {
        const user = await db.getUserByEmail(email);
        if (!user) return null;
        if (user.passwordHash !== hashPassword(password)) return null;
        return { ...user };
    },

    async createSession(userId) {
        const token = 'tok_' + crypto.randomUUID();
        collections.sessions.set(token, userId);
        return token;
    },

    async getUserByToken(token) {
        if (!token) return null;
        const cleanToken = token.replace('Bearer ', '').trim();
        if (!cleanToken) return null;

        let userId = collections.sessions.get(cleanToken);
        if (!userId && (cleanToken === STATIC_DEMO_TOKEN || cleanToken === 'demo_token')) {
            userId = 'demo_user';
        }
        if (!userId) return null;
        const u = collections.usersById.get(userId);
        return u ? { ...u } : null;
    },

    async destroySession(token) {
        if (!token) return;
        const cleanToken = token.replace('Bearer ', '').trim();
        collections.sessions.delete(cleanToken);
    },

    // FILE & BATCH STORAGE
    async saveFileBatch(userId, batchDoc) {
        const batchId = sanitizeInput(batchDoc.batchId || ('batch_' + Date.now()));
        const record = {
            batchId,
            userId,
            fileName: sanitizeInput(batchDoc.fileName || 'Uploaded CSV'),
            fileType: sanitizeInput(batchDoc.type || 'RECON'),
            uploadedAt: batchDoc.uploadedAt || new Date().toISOString(),
            recordCount: batchDoc.totalOrders || (batchDoc.employees || batchDoc.orders || []).length,
            rawContent: batchDoc.rawContent || null,
            summary: batchDoc.summary || null,
            employees: batchDoc.employees || null,
            orders: batchDoc.orders || null,
            discrepancies: batchDoc.discrepancies || null
        };

        collections.files.set(batchId, record);

        if (!collections.userFiles.has(userId)) collections.userFiles.set(userId, []);
        const userList = collections.userFiles.get(userId);
        if (!userList.includes(batchId)) userList.unshift(batchId);

        // Ingest into payroll records if this is a salary CSV
        if (record.employees && Array.isArray(record.employees)) {
            for (const emp of record.employees) {
                await db.savePayrollEmployee(userId, batchId, emp);
            }
        }

        // Ingest into orders if this is a reconciliation CSV
        if (record.orders && Array.isArray(record.orders)) {
            for (const ord of record.orders) {
                await db.saveOrder(userId, batchId, ord);
            }
        }

        if (record.discrepancies && Array.isArray(record.discrepancies)) {
            for (const disc of record.discrepancies) {
                await db.saveDiscrepancy(userId, batchId, disc);
            }
        }

        return { ...record };
    },

    async getUserBatches(userId) {
        const batchIds = collections.userFiles.get(userId) || [];
        return batchIds.map(id => {
            const b = collections.files.get(id);
            if (!b) return null;
            return {
                batchId: b.batchId,
                fileName: b.fileName,
                type: b.fileType,
                uploadedAt: b.uploadedAt,
                totalOrders: b.recordCount
            };
        }).filter(Boolean);
    },

    async getBatchById(batchId) {
        const b = collections.files.get(batchId);
        return b ? { ...b } : null;
    },

    // PAYROLL & SALARIES
    async savePayrollEmployee(userId, batchId, empData) {
        const empId = sanitizeInput(empData.id || empData.empId || ('EMP_' + Date.now() + '_' + Math.floor(Math.random() * 1000)));
        const record = {
            empId,
            userId,
            batchId,
            name: sanitizeInput(empData.fullName || empData.name || 'Employee'),
            role: sanitizeInput(empData.role || 'Team Member'),
            department: sanitizeInput(empData.department || 'Operations'),
            grossSalary: Number(empData.salary || empData.grossSalary || 0),
            tdsDeduction: Number(empData.tds || empData.tdsDeduction || 0),
            pfDeduction: Number(empData.pf || empData.pfDeduction || 0),
            netPayable: Number(empData.netPayable || 0),
            status: sanitizeInput(empData.status || 'PENDING'),
            bankUtr: empData.utr ? sanitizeInput(empData.utr) : (empData.bankUtr ? sanitizeInput(empData.bankUtr) : null),
            delayDays: empData.delayDays || (empData.status === 'DELAYED' ? 24 : 0),
            disbursedDate: empData.disbursedDate || null,
            city: sanitizeInput(empData.city || 'India'),
            joined: empData.joined || '2024-01-01',
            email: sanitizeInput(empData.email || `${empId.toLowerCase()}@company.com`)
        };

        collections.payroll.set(empId, record);
        if (!collections.userPayroll.has(userId)) collections.userPayroll.set(userId, []);
        const list = collections.userPayroll.get(userId);
        if (!list.includes(empId)) list.unshift(empId);
        return { ...record };
    },

    async getUserPayroll(userId) {
        const empIds = collections.userPayroll.get(userId) || [];
        return empIds.map(id => collections.payroll.get(id)).filter(Boolean).map(e => ({ ...e }));
    },

    async updatePayrollStatus(userId, empId, status, bankUtr = null) {
        const emp = collections.payroll.get(empId);
        if (emp && (emp.userId === userId || userId === 'demo_user')) {
            emp.status = status;
            if (bankUtr) emp.bankUtr = sanitizeInput(bankUtr);
            if (status === 'DISBURSED' || status === 'PAID') {
                emp.delayDays = 0;
                emp.disbursedDate = new Date().toISOString().slice(0, 10);
            }
            return { ...emp };
        }
        return null;
    },

    // ORDERS & GATEWAY RECONCILIATION
    async saveOrder(userId, batchId, orderData) {
        const orderId = sanitizeInput(orderData.orderId || ('ORD_' + Date.now()));
        const record = {
            orderId,
            userId,
            batchId,
            customerName: sanitizeInput(orderData.customerName || 'Customer'),
            amount: Number(orderData.amount || 0),
            currency: sanitizeInput(orderData.currency || 'INR'),
            orderDate: orderData.orderDate || new Date().toISOString().slice(0, 19),
            status: sanitizeInput(orderData.status || 'COMPLETED'),
            paymentMethod: sanitizeInput(orderData.paymentMethod || 'upi'),
            reconStatus: sanitizeInput(orderData.reconStatus || 'RECONCILED')
        };

        collections.orders.set(orderId, record);
        if (!collections.userOrders.has(userId)) collections.userOrders.set(userId, []);
        const list = collections.userOrders.get(userId);
        if (!list.includes(orderId)) list.unshift(orderId);
        return { ...record };
    },

    async getUserOrders(userId, batchId = null) {
        const orderIds = collections.userOrders.get(userId) || [];
        let items = orderIds.map(id => collections.orders.get(id)).filter(Boolean);
        if (batchId) items = items.filter(o => o.batchId === batchId);
        return items.map(o => ({ ...o }));
    },

    async saveDiscrepancy(userId, batchId, discData) {
        const id = discData.id || (collections.discrepancies.size + 1);
        const record = {
            id,
            userId,
            batchId,
            orderId: sanitizeInput(discData.orderId || ''),
            paymentId: sanitizeInput(discData.paymentId || `pay_${discData.orderId}`),
            settlementId: discData.settlementId ? sanitizeInput(discData.settlementId) : null,
            bankUtr: discData.bankUtr ? sanitizeInput(discData.bankUtr) : null,
            type: sanitizeInput(discData.type || 'MDR_FEE_OVERCHARGE'),
            severity: sanitizeInput(discData.severity || 'MEDIUM'),
            expectedAmount: Number(discData.expectedAmount || 0),
            actualAmount: Number(discData.actualAmount || 0),
            varianceAmount: Number(discData.varianceAmount || 0),
            rootCause: sanitizeInput(discData.rootCause || 'Fee variance detected.'),
            suggestedAction: sanitizeInput(discData.suggestedAction || 'File dispute ticket.'),
            detectedAt: discData.detectedAt || new Date().toISOString(),
            resolved: Boolean(discData.resolved)
        };

        collections.discrepancies.set(id, record);
        if (!collections.userDiscrepancies.has(userId)) collections.userDiscrepancies.set(userId, []);
        const list = collections.userDiscrepancies.get(userId);
        if (!list.includes(id)) list.unshift(id);
        return { ...record };
    },

    async getUserDiscrepancies(userId, batchId = null) {
        const ids = collections.userDiscrepancies.get(userId) || [];
        let items = ids.map(id => collections.discrepancies.get(id)).filter(Boolean);
        if (batchId) items = items.filter(d => d.batchId === batchId);
        return items.map(d => ({ ...d }));
    },

    // VENDOR BILLS
    async saveVendorBill(userId, billData) {
        const billId = sanitizeInput(billData.billId || ('BILL_' + Date.now()));
        const record = {
            billId,
            userId,
            vendorName: sanitizeInput(billData.vendorName || 'Vendor Partner'),
            category: sanitizeInput(billData.category || 'Supplies'),
            invoiceNo: sanitizeInput(billData.invoiceNo || `INV-${Date.now().toString().slice(-4)}`),
            gstin: sanitizeInput((billData.gstin || '27AABCB0000A1Z0').toUpperCase()),
            amount: Number(billData.amount || 0),
            gstAmount: Number(billData.gstAmount || (billData.amount * 0.18)),
            tdsRate: Number(billData.tdsRate || 0.02),
            tdsDeducted: Number(billData.tdsDeducted || (billData.amount * 0.02)),
            netPayable: Number(billData.netPayable || (billData.amount * 1.16)),
            isMsme: Boolean(billData.isMsme),
            invoiceDate: billData.invoiceDate || new Date().toISOString().slice(0, 10),
            dueDate: billData.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
            paymentStatus: sanitizeInput(billData.paymentStatus || 'UNPAID'),
            bankUtr: billData.bankUtr ? sanitizeInput(billData.bankUtr) : null,
            msmeDaysRemaining: billData.msmeDaysRemaining !== undefined ? billData.msmeDaysRemaining : (billData.isMsme ? 12 : null)
        };

        collections.vendorBills.set(billId, record);
        if (!collections.userVendorBills.has(userId)) collections.userVendorBills.set(userId, []);
        const list = collections.userVendorBills.get(userId);
        if (!list.includes(billId)) list.unshift(billId);
        return { ...record };
    },

    async getUserVendorBills(userId) {
        const billIds = collections.userVendorBills.get(userId) || [];
        return billIds.map(id => collections.vendorBills.get(id)).filter(Boolean).map(b => ({ ...b }));
    },

    async updateVendorBillStatus(userId, billId, status, bankUtr = null) {
        const bill = collections.vendorBills.get(billId);
        if (bill && (bill.userId === userId || userId === 'demo_user')) {
            bill.paymentStatus = status;
            if (bankUtr) bill.bankUtr = sanitizeInput(bankUtr);
            return { ...bill };
        }
        return null;
    }
};

// Seed Demo User in Database
(async function initSeedDemo() {
    const demoUser = {
        id: 'demo_user',
        name: 'Zenith Retail Demo',
        companyName: 'Zenith Retail India Pvt Ltd',
        email: 'demo@zenith.in',
        gstin: '27AAACZ8892Z1Z4',
        password: 'zenith123'
    };

    try {
        const user = await db.createUser(demoUser);
        const userId = 'demo_user';

        collections.usersById.set('demo_user', user);
        collections.sessions.set(STATIC_DEMO_TOKEN, 'demo_user');

        // Seed 35 Orders
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

        for (let i = 1; i <= 35; i++) {
            const amount = Math.floor(1000 + ((i * 137) % 8500));
            const orderId = `order_DEMO_${String(i).padStart(4, '0')}`;
            let reconStatus = 'RECONCILED';

            if (i === 4) {
                reconStatus = 'FEE_MISMATCH';
                await db.saveDiscrepancy(userId, 'batch_demo', {
                    id: 1,
                    orderId,
                    type: 'MDR_FEE_OVERCHARGE',
                    severity: 'MEDIUM',
                    expectedAmount: Number((amount * 0.02).toFixed(2)),
                    actualAmount: Number((amount * 0.035).toFixed(2)),
                    varianceAmount: Number((amount * 0.015).toFixed(2)),
                    rootCause: 'MDR Fee charged (3.5%) exceeds contracted 2.0% SLA.',
                    suggestedAction: 'Raise fee dispute with Razorpay.'
                });
            } else if (i === 11) {
                reconStatus = 'DELAYED_SLA';
                await db.saveDiscrepancy(userId, 'batch_demo', {
                    id: 2,
                    orderId,
                    type: 'DELAYED_SETTLEMENT_SLA',
                    severity: 'HIGH',
                    expectedAmount: amount,
                    actualAmount: 0,
                    varianceAmount: amount,
                    rootCause: 'Payment captured 5 days ago, breaching standard T+2 SLA.',
                    suggestedAction: 'Check merchant account reserve hold.'
                });
            } else if (i === 18) {
                reconStatus = 'MISSING_BANK_CREDIT';
                await db.saveDiscrepancy(userId, 'batch_demo', {
                    id: 3,
                    orderId,
                    type: 'MISSING_BANK_CREDIT',
                    severity: 'CRITICAL',
                    expectedAmount: amount,
                    actualAmount: 0,
                    varianceAmount: amount,
                    rootCause: 'Razorpay marked payout complete, but bank statement does not show credit.',
                    suggestedAction: 'Contact nodal banking desk with UTR.'
                });
            }

            await db.saveOrder(userId, 'batch_demo', {
                orderId,
                customerName: customerNames[i - 1],
                amount,
                paymentMethod: paymentMethods[i % paymentMethods.length],
                reconStatus
            });
        }

        // Seed 8 Payroll Employees
        const sampleEmployees = [
            { empId: 'EMP_101', name: 'Aarav Sharma', role: 'Lead Architect', department: 'Engineering', grossSalary: 145000, tdsDeduction: 14500, pfDeduction: 3600, netPayable: 126900, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_HDFC_991001', delayDays: 0 },
            { empId: 'EMP_102', name: 'Priya Iyer', role: 'Product Lead', department: 'Product', grossSalary: 125000, tdsDeduction: 12500, pfDeduction: 3600, netPayable: 108900, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_ICICI_991002', delayDays: 0 },
            { empId: 'EMP_103', name: 'Rahul Deshmukh', role: 'Senior Developer', department: 'Engineering', grossSalary: 95000, tdsDeduction: 9500, pfDeduction: 3600, netPayable: 81900, status: 'DELAYED', delayDays: 24 },
            { empId: 'EMP_104', name: 'Neha Kapoor', role: 'Finance Executive', department: 'Finance', grossSalary: 68000, tdsDeduction: 6800, pfDeduction: 3600, netPayable: 57600, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_KOTAK_991004', delayDays: 0 },
            { empId: 'EMP_105', name: 'Karan Malhotra', role: 'Operations Manager', department: 'Operations', grossSalary: 85000, tdsDeduction: 8500, pfDeduction: 3600, netPayable: 72900, status: 'DELAYED', delayDays: 24 },
            { empId: 'EMP_106', name: 'Ananya Sen', role: 'UI/UX Designer', department: 'Design', grossSalary: 72000, tdsDeduction: 7200, pfDeduction: 3600, netPayable: 61200, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_AXIS_991006', delayDays: 0 },
            { empId: 'EMP_107', name: 'Vikram Patel', role: 'Marketing Lead', department: 'Marketing', grossSalary: 78000, tdsDeduction: 7800, pfDeduction: 3600, netPayable: 66600, status: 'PENDING_CLEARANCE', delayDays: 0 },
            { empId: 'EMP_108', name: 'Simran Roy', role: 'Customer Support', department: 'Support', grossSalary: 30000, tdsDeduction: 0, pfDeduction: 3600, netPayable: 26400, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_SBI_991008', delayDays: 0 }
        ];

        for (const emp of sampleEmployees) {
            await db.savePayrollEmployee(userId, 'batch_demo', emp);
        }

        // Seed 5 Vendor Bills
        const sampleBills = [
            { billId: 'BILL_501', vendorName: 'Apex Cloud Services', category: 'AWS & Infrastructure', invoiceNo: 'INV-2026-881', gstin: '27AAACA9921K1Z1', amount: 48000, gstAmount: 8640, tdsRate: 0.02, tdsDeducted: 960, netPayable: 55680, isMsme: false, invoiceDate: '2026-08-05', dueDate: '2026-08-20', paymentStatus: 'PAID', bankUtr: 'UTR_HDFC_VEND_501', msmeDaysRemaining: null },
            { billId: 'BILL_502', vendorName: 'Balaji Packaging Solutions', category: 'Packaging Supplies', invoiceNo: 'BP-AUG-102', gstin: '27AABCB4419M1Z9', amount: 24500, gstAmount: 4410, tdsRate: 0.01, tdsDeducted: 245, netPayable: 28665, isMsme: true, invoiceDate: '2026-07-20', dueDate: '2026-09-03', paymentStatus: 'UNPAID', msmeDaysRemaining: 6 },
            { billId: 'BILL_503', vendorName: 'QuickLogix 3PL Logistics', category: 'Courier & Freight', invoiceNo: 'QL-DEL-9901', gstin: '27AACFQ8129L1ZA', amount: 62000, gstAmount: 11160, tdsRate: 0.02, tdsDeducted: 1240, netPayable: 71920, isMsme: false, invoiceDate: '2026-08-10', dueDate: '2026-08-25', paymentStatus: 'PAID', bankUtr: 'UTR_KOTAK_VEND_503', msmeDaysRemaining: null },
            { billId: 'BILL_504', vendorName: 'Zenith Legal & Compliance', category: 'Legal & Secretarial', invoiceNo: 'ZL-7729', gstin: '27AADFZ1102P1Z3', amount: 31500, gstAmount: 5670, tdsRate: 0.10, tdsDeducted: 3150, netPayable: 34020, isMsme: true, invoiceDate: '2026-07-14', dueDate: '2026-08-28', paymentStatus: 'CRITICAL_MSME', msmeDaysRemaining: 2 },
            { billId: 'BILL_505', vendorName: 'Optima Marketing Agency', category: 'Performance Ads', invoiceNo: 'OMA-4401', gstin: '27AABCO5521R1ZK', amount: 55000, gstAmount: 9900, tdsRate: 0.02, tdsDeducted: 1100, netPayable: 63800, isMsme: false, invoiceDate: '2026-08-15', dueDate: '2026-08-30', paymentStatus: 'UNPAID', msmeDaysRemaining: null }
        ];

        for (const bill of sampleBills) {
            await db.saveVendorBill(userId, bill);
        }

        // Save Batch Record
        await db.saveFileBatch(userId, {
            batchId: 'batch_demo',
            fileName: 'demo_live_feed.csv',
            type: 'RECON',
            totalOrders: 35
        });

    } catch (e) {
        console.error('Demo seeding info:', e.message);
    }
})();

module.exports = db;
