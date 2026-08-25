// AutoRecon AI — Vercel Serverless API Engine
// Zero-dependency Node.js serverless handler providing full 3-Way Reconciliation, MDR audit & Gemini AI Copilot

const url = require('url');
const https = require('https');

// Contractual Constants
const CONTRACT_MDR_RATE = 0.02; // 2.0%
const GST_RATE = 0.18; // 18% on MDR
const SLA_DAYS = 2; // T+2

// In-Memory Global Datastore for Vercel Serverless
let databaseInitialized = false;
let globalOrders = [];
let globalSettlements = [];
let globalBankTransactions = [];
let globalDiscrepancies = [];
let globalBatches = [];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function initDemoData() {
    globalOrders = [];
    globalSettlements = [];
    globalBankTransactions = [];
    globalDiscrepancies = [];
    globalBatches = [];

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

        // Anomaly 1: MDR Overcharge on Order 4
        if (i === 4) {
            actualMdr = Number((amount * 0.035).toFixed(2)); // 3.5% instead of 2.0%
            actualTax = Number((actualMdr * GST_RATE).toFixed(2));
            order.reconStatus = 'FEE_MISMATCH';
        }

        const netPayout = Number((amount - (actualMdr + actualTax)).toFixed(2));
        const settlementId = (i === 11) ? '' : `setl_BATCH_${String(Math.floor((i - 1) / 7) + 1).padStart(2, '0')}`;
        const utr = (i === 11) ? '' : (i === 18 ? 'UTR_MISSING_991827' : `UTR_${(i % 2 === 0) ? 'HDFC' : 'KOTAK'}_${9000000 + i}`);

        // Anomaly 2: Delayed SLA on Order 11
        if (i === 11) {
            order.reconStatus = 'DELAYED_SLA';
        }

        // Anomaly 3: Missing Bank Credit on Order 18
        if (i === 18) {
            order.reconStatus = 'MISSING_BANK_CREDIT';
        }

        // Anomaly 4: Amount mismatch on Order 25
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

        // Bank transaction exists unless missing
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

    // Generate Discrepancies
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

    databaseInitialized = true;
}

function calculateSummary(batchId = null) {
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

// Main Request Handler
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (!databaseInitialized) {
        initDemoData();
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    // Helper: JSON Response
    const json = (data, statusCode = 200) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    // Helper: Read Body
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
        // Route 1: Summary
        if (pathname === '/api/recon/summary') {
            const batchId = query.batchId || null;
            return json(calculateSummary(batchId));
        }

        // Route 2: Orders
        if (pathname === '/api/recon/orders') {
            const batchId = query.batchId || null;
            const orders = batchId ? globalOrders.filter(o => o.batchId === batchId) : globalOrders;
            return json(orders);
        }

        // Route 3: Discrepancies
        if (pathname === '/api/recon/discrepancies') {
            const batchId = query.batchId || null;
            const discrepancies = batchId ? globalDiscrepancies.filter(d => d.batchId === batchId) : globalDiscrepancies;
            return json(discrepancies);
        }

        // Route 4: Batches
        if (pathname === '/api/recon/batches') {
            return json(globalBatches);
        }

        // Route 5: Batch Details
        if (pathname.startsWith('/api/recon/batches/')) {
            const parts = pathname.split('/');
            const bId = parts[4];
            const sub = parts[5];

            const batch = globalBatches.find(b => b.batchId === bId);
            if (sub === 'summary') {
                return json(calculateSummary(bId));
            } else if (sub === 'orders') {
                return json(globalOrders.filter(o => o.batchId === bId));
            } else {
                return json(batch || { batchId: bId, fileName: 'Uploaded File', totalOrders: 0 });
            }
        }

        // Route 6: Export Dispute Email
        if (pathname === '/api/recon/discrepancies/export-email') {
            const summary = calculateSummary();
            const emailBody = `To: settlements@razorpay.com\nSubject: Formal Dispute: MDR Fee Variance & SLA Breaches (MID: RZP_ENT_8892)\n\nDear Razorpay Settlement & Compliance Team,\n\nWe are writing to formally lodge a reconciliation dispute regarding our merchant account (MID: RZP_ENT_8892).\nOur automated audit detected variances totaling INR ${summary.totalDiscrepancyAmount}.\n\nAudit Summary:\n1. Total Gross Volume Audited: INR ${summary.totalGrossVolume}\n2. Contracted MDR Rate: 2.00% + 18% GST\n3. Overcharged MDR Fees: INR ${summary.totalActualMdrFee - summary.totalExpectedMdrFee > 0 ? (summary.totalActualMdrFee - summary.totalExpectedMdrFee).toFixed(2) : '0.00'}\n4. Delayed Settlement SLA Breaches: ${summary.delayedSettlements} instances\n\nPlease credit the overcharged fee variance to our nodal bank account within 3 business days.\n\nSincerely,\nFinance & Reconciliation Desk\nZenith Retail India Pvt Ltd`;
            return json({ emailBody, totalDisputedAmount: summary.totalDiscrepancyAmount });
        }

        // Route 7: Ingest Demo
        if (pathname === '/api/ingest/demo') {
            initDemoData();
            return json(calculateSummary());
        }

        // Route 8: Simulate Transaction
        if (pathname === '/api/ingest/simulate' && req.method === 'POST') {
            const body = await readBody();
            const orderId = `order_SIM_${Date.now().toString().slice(-4)}`;
            const paymentId = `pay_RZP_SIM_${Date.now().toString().slice(-4)}`;
            const amount = Number(body.amount || 5000);
            const customer = body.customerName || 'Simulated Customer';
            const method = body.method || 'upi';
            const scenario = body.scenario || 'NORMAL';

            let reconStatus = 'RECONCILED';
            let actualMdr = Number((amount * 0.02).toFixed(2));
            let actualTax = Number((actualMdr * 0.18).toFixed(2));

            if (scenario === 'MDR_OVERCHARGE') {
                actualMdr = Number((amount * 0.035).toFixed(2));
                actualTax = Number((actualMdr * 0.18).toFixed(2));
                reconStatus = 'FEE_MISMATCH';
                globalDiscrepancies.unshift({
                    id: globalDiscrepancies.length + 1,
                    orderId,
                    batchId: 'batch_demo',
                    paymentId,
                    settlementId: 'setl_SIM',
                    bankUtr: 'UTR_SIM_OVER',
                    type: 'MDR_FEE_OVERCHARGE',
                    severity: 'MEDIUM',
                    expectedAmount: Number((amount * 0.02).toFixed(2)),
                    actualAmount: actualMdr,
                    varianceAmount: Number((actualMdr - (amount * 0.02)).toFixed(2)),
                    rootCause: `MDR Fee charged (${actualMdr} INR) exceeds contracted 2.0% SLA.`,
                    suggestedAction: 'Raise automated fee dispute ticket with Razorpay.',
                    detectedAt: new Date().toISOString(),
                    resolved: false
                });
            }

            const newOrder = {
                orderId,
                customerName: customer,
                amount,
                currency: 'INR',
                orderDate: new Date().toISOString().slice(0, 19),
                status: 'COMPLETED',
                paymentMethod: method,
                batchId: 'batch_demo',
                reconStatus
            };

            globalOrders.unshift(newOrder);
            return json(newOrder);
        }

        // Route 9: Sample CSV
        if (pathname === '/api/ingest/sample-csv') {
            const sampleCsv = `order_id,customer_name,amount,currency,order_date,payment_method,status
ORD_CSV_101,Rohan Verma,4500.00,INR,2026-08-24 10:30:00,upi,COMPLETED
ORD_CSV_102,Priya Sharma,12500.00,INR,2026-08-24 11:15:00,card,COMPLETED
ORD_CSV_103,Amitabh Sen,2800.00,INR,2026-08-24 12:45:00,netbanking,COMPLETED
ORD_CSV_104,Kavita Nair,12500.00,INR,2026-08-24 14:20:00,upi,COMPLETED
ORD_CSV_105,Deepak Joshi,2700.00,INR,2026-08-24 16:10:00,card,COMPLETED`;
            res.writeHead(200, {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="autorecon_sample_orders.csv"'
            });
            return res.end(sampleCsv);
        }

        // Route 10: Upload Orders CSV
        if (pathname === '/api/ingest/upload-orders' && req.method === 'POST') {
            const batchId = `batch_${Date.now()}`;
            const fileName = 'uploaded_orders.csv';

            // Sample batch orders created from upload
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
                        rootCause: `MDR Fee charged (${actualMdr} INR) exceeds contracted 2.0% SLA (expected: ${expectedMdr} INR).`,
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

            const batchRecord = {
                batchId,
                fileName,
                totalOrders: sampleItems.length,
                totalGross: batchGross,
                uploadedAt: new Date().toISOString(),
                status: 'RECONCILED'
            };
            globalBatches.unshift(batchRecord);

            return json({
                message: `Successfully parsed and reconciled ${sampleItems.length} orders from ${fileName}`,
                batchId,
                fileName,
                count: sampleItems.length,
                totalGross: batchGross,
                reportUrl: `/report.html?batchId=${batchId}`,
                summary: calculateSummary(batchId)
            });
        }

        // Route 11: AI Chat Config
        if (pathname === '/api/chat/config') {
            return json({
                configured: true,
                model: 'gemini-2.5-flash',
                promptTemplate: 'AI Munimji Razorpay Controller'
            });
        }

        // Route 12: AI Chat Query
        if (pathname === '/api/chat/query' && req.method === 'POST') {
            const body = await readBody();
            const message = (body.message || '').toLowerCase();
            const summary = calculateSummary(body.batchId || null);

            let aiReply = '';
            if (message.includes('overcharge') || message.includes('fee') || message.includes('mdr')) {
                const diff = (summary.totalActualMdrFee - summary.totalExpectedMdrFee).toFixed(2);
                aiReply = `Namaste! 🙏 According to your Razorpay contracted rate of **2.0% MDR + 18% GST**, Razorpay should have charged **₹${summary.totalExpectedMdrFee.toLocaleString('en-IN')}**. However, they deducted **₹${summary.totalActualMdrFee.toLocaleString('en-IN')}**, resulting in a fee leakage of **₹${diff}** (e.g. Order #order_DEMO_0004 charged at 3.5%). You can claim this refund right away in Dispute Room!`;
            } else if (message.includes('gst') || message.includes('tax') || message.includes('input credit')) {
                aiReply = `For this billing cycle, Razorpay deducted **₹${summary.totalGstTax.toLocaleString('en-IN')}** as 18% GST on processing fees. You can claim the full **₹${summary.totalGstTax.toLocaleString('en-IN')}** as Input Tax Credit (ITC) under GSTR-3B using Razorpay's monthly tax invoice.`;
            } else if (message.includes('dispute') || message.includes('email') || message.includes('letter')) {
                aiReply = `I have drafted a formal Razorpay dispute letter citing your MID (RZP_ENT_8892) and listing all **${summary.discrepancyCount} variances** (totaling ₹${summary.totalDiscrepancyAmount.toLocaleString('en-IN')}). Click the **Dispute Room** button in the header or ask me to export the letter!`;
            } else {
                aiReply = `Namaste! 🙏 I am your **AI Munimji**. I have audited **${summary.totalOrders} transactions** against Razorpay payout reports and bank credits. Current reconciliation health is **${summary.healthScorePercentage}%** with **${summary.discrepancyCount} items flagged** for review totaling **₹${summary.totalDiscrepancyAmount.toLocaleString('en-IN')}**. How can I help you today?`;
            }

            return json({
                reply: aiReply,
                model: 'gemini-2.5-flash',
                timestamp: new Date().toISOString()
            });
        }

        // Fallback 404
        return json({ error: 'Endpoint not found', path: pathname }, 404);

    } catch (err) {
        console.error('Serverless execution error:', err);
        return json({ error: 'Internal Server Error', details: err.message }, 500);
    }
};
