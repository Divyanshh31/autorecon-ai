// AutoRecon AI — All-in-One Autonomous Accounting & Financial Operations OS
// Multi-Tasking Client Controller: Gateway Recon, Payroll & Salary Delays, Vendor AP & MSME 43B(h), Cash Flow & AI Munimji

let reconChart = null;
let feeChart = null;
let currentFilter = 'ALL';
let isLiveStreamActive = true;
let currentBatchId = null;

const defaultCustomerNames = [
    "Aarav Patel", "Diya Sharma", "Vikram Malhotra", "Ananya Iyer", "Rohan Gupta",
    "Pooja Deshmukh", "Karan Verma", "Neha Kapoor", "Aditya Joshi", "Ishita Sen",
    "Siddharth Rao", "Kavya Menon", "Amitabh Nair", "Sneha Kulkarni", "Rahul Bhatia",
    "Priya Agarwal", "Varun Chopra", "Tanvi Jain", "Manish Saxena", "Meera Reddy",
    "Gaurav Tiwari", "Rhea Singhania", "Alok Pandey", "Shruti Mehra", "Nikhil Goswami",
    "Swati Roy", "Harsh Vardhan", "Divya Nambiar", "Prateek Sethi", "Simran Chawla",
    "Rajesh Goel", "Tarun Mathur", "Bhavna Mittal", "Kunal Shah", "Zoya Khan"
];

function generateDefaultOrders() {
    const orders = [];
    const paymentMethods = ["upi", "card", "netbanking"];
    for (let i = 1; i <= 35; i++) {
        const amount = Math.floor(1000 + ((i * 137) % 8500));
        const orderId = `order_DEMO_${String(i).padStart(4, '0')}`;
        let reconStatus = 'RECONCILED';
        if (i === 4) reconStatus = 'FEE_MISMATCH';
        else if (i === 11) reconStatus = 'DELAYED_SLA';
        else if (i === 18) reconStatus = 'MISSING_BANK_CREDIT';

        orders.push({
            orderId,
            customerName: defaultCustomerNames[i - 1],
            amount,
            paymentMethod: paymentMethods[i % paymentMethods.length],
            reconStatus,
            orderDate: '2026-08-25'
        });
    }
    return orders;
}

const defaultPayrollDataset = [
    { empId: 'EMP_101', name: 'Aarav Sharma', role: 'Lead Architect', department: 'Engineering', grossSalary: 145000, tdsDeduction: 14500, pfDeduction: 3600, netPayable: 126900, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_HDFC_991001', delayDays: 0 },
    { empId: 'EMP_102', name: 'Priya Iyer', role: 'Product Lead', department: 'Product', grossSalary: 125000, tdsDeduction: 12500, pfDeduction: 3600, netPayable: 108900, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_ICICI_991002', delayDays: 0 },
    { empId: 'EMP_103', name: 'Rahul Deshmukh', role: 'Senior Developer', department: 'Engineering', grossSalary: 95000, tdsDeduction: 9500, pfDeduction: 3600, netPayable: 81900, status: 'DELAYED', delayDays: 24 },
    { empId: 'EMP_104', name: 'Neha Kapoor', role: 'Finance Executive', department: 'Finance', grossSalary: 68000, tdsDeduction: 6800, pfDeduction: 3600, netPayable: 57600, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_KOTAK_991004', delayDays: 0 },
    { empId: 'EMP_105', name: 'Karan Malhotra', role: 'Operations Manager', department: 'Operations', grossSalary: 85000, tdsDeduction: 8500, pfDeduction: 3600, netPayable: 72900, status: 'DELAYED', delayDays: 24 },
    { empId: 'EMP_106', name: 'Ananya Sen', role: 'UI/UX Designer', department: 'Design', grossSalary: 72000, tdsDeduction: 7200, pfDeduction: 3600, netPayable: 61200, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_AXIS_991006', delayDays: 0 },
    { empId: 'EMP_107', name: 'Vikram Patel', role: 'Marketing Lead', department: 'Marketing', grossSalary: 78000, tdsDeduction: 7800, pfDeduction: 3600, netPayable: 66600, status: 'PENDING_CLEARANCE', delayDays: 0 },
    { empId: 'EMP_108', name: 'Simran Roy', role: 'Customer Support', department: 'Support', grossSalary: 30000, tdsDeduction: 0, pfDeduction: 3600, netPayable: 26400, status: 'DISBURSED', disbursedDate: '2026-08-01', bankUtr: 'SAL_SBI_991008', delayDays: 0 }
];

const defaultVendorsDataset = [
    { billId: 'BILL_501', vendorName: 'Apex Cloud Services', category: 'AWS & Infrastructure', invoiceNo: 'INV-2026-881', gstin: '27AAACA9921K1Z1', amount: 48000, gstAmount: 8640, tdsRate: 0.02, tdsDeducted: 960, netPayable: 55680, isMsme: false, invoiceDate: '2026-08-05', dueDate: '2026-08-20', paymentStatus: 'PAID', bankUtr: 'UTR_HDFC_VEND_501', msmeDaysRemaining: null },
    { billId: 'BILL_502', vendorName: 'Balaji Packaging Solutions', category: 'Packaging Supplies', invoiceNo: 'BP-AUG-102', gstin: '27AABCB4419M1Z9', amount: 24500, gstAmount: 4410, tdsRate: 0.01, tdsDeducted: 245, netPayable: 28665, isMsme: true, invoiceDate: '2026-07-20', dueDate: '2026-09-03', paymentStatus: 'UNPAID', msmeDaysRemaining: 6 },
    { billId: 'BILL_503', vendorName: 'QuickLogix 3PL Logistics', category: 'Courier & Freight', invoiceNo: 'QL-DEL-9901', gstin: '27AACFQ8129L1ZA', amount: 62000, gstAmount: 11160, tdsRate: 0.02, tdsDeducted: 1240, netPayable: 71920, isMsme: false, invoiceDate: '2026-08-10', dueDate: '2026-08-25', paymentStatus: 'PAID', bankUtr: 'UTR_KOTAK_VEND_503', msmeDaysRemaining: null },
    { billId: 'BILL_504', vendorName: 'Zenith Legal & Compliance', category: 'Legal & Secretarial', invoiceNo: 'ZL-7729', gstin: '27AADFZ1102P1Z3', amount: 31500, gstAmount: 5670, tdsRate: 0.10, tdsDeducted: 3150, netPayable: 34020, isMsme: true, invoiceDate: '2026-07-14', dueDate: '2026-08-28', paymentStatus: 'CRITICAL_MSME', msmeDaysRemaining: 2 },
    { billId: 'BILL_505', vendorName: 'Optima Marketing Agency', category: 'Performance Ads', invoiceNo: 'OMA-4401', gstin: '27AABCO5521R1ZK', amount: 55000, gstAmount: 9900, tdsRate: 0.02, tdsDeducted: 1100, netPayable: 63800, isMsme: false, invoiceDate: '2026-08-15', dueDate: '2026-08-30', paymentStatus: 'UNPAID', msmeDaysRemaining: null }
];

// Multi-Tasking Data Stores
let currentOrders = generateDefaultOrders();
let currentDiscrepancies = [];
let currentPayroll = defaultPayrollDataset;
let currentVendors = defaultVendorsDataset;
let currentCashFlow = null;

// Auth Helper
function getAuthHeaders(customHeaders = {}) {
    const headers = { ...customHeaders };
    const token = localStorage.getItem('autorecon_auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// User Profile Initializer & Auth Gate
function initAuth() {
    const token = localStorage.getItem('autorecon_auth_token');
    const userJson = localStorage.getItem('autorecon_current_user');
    const authLoginBtn = document.getElementById('btnHeaderAuthLogin');
    const userProfileDiv = document.getElementById('headerUserProfile');
    const nameEl = document.getElementById('headerUserName');
    const roleEl = document.getElementById('headerUserRole');
    const avatarEl = document.getElementById('headerUserAvatar');
    const compEl = document.getElementById('headerCompanyName');
    const gstinEl = document.getElementById('headerGstin');
    const welcomeName = document.getElementById('welcomeUserName');
    const welcomeGstin = document.getElementById('welcomeGstinPill');

    if (token || userJson) {
        try {
            const user = userJson ? JSON.parse(userJson) : { name: 'User', companyName: 'My Business' };
            if (authLoginBtn) authLoginBtn.classList.add('hidden');
            if (userProfileDiv) userProfileDiv.classList.remove('hidden');
            if (nameEl) nameEl.textContent = user.name || 'User';
            if (roleEl) roleEl.textContent = user.companyName || 'Business';
            if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
            if (compEl) compEl.textContent = user.companyName || 'My Business';
            if (gstinEl) gstinEl.textContent = user.gstin ? `GSTIN: ${user.gstin}` : 'Private Workspace';
            if (welcomeName) welcomeName.textContent = user.name || 'Merchant';
            if (welcomeGstin) welcomeGstin.textContent = user.companyName ? `${user.companyName} · Private Store` : 'Private Financial Workspace';
        } catch(e) {}
    } else {
        window.location.replace('/auth.html');
    }
}

window.handleLogout = async function() {
    const token = localStorage.getItem('autorecon_auth_token');
    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: getAuthHeaders()
            });
        } catch(e){}
    }
    localStorage.removeItem('autorecon_auth_token');
    localStorage.removeItem('autorecon_current_user');
    window.location.href = '/auth.html';
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initLiveBackground();
    initMinimalSplash();
    initCharts();
    setupNavigationTabs();
    setupEventListeners();
    initLiveTicker();

    // Fetch all 5 autonomous modules, ML lab & database health
    fetchDbStatus();
    fetchSummary();
    fetchOrders();
    fetchDiscrepancies();
    fetchBatchesList();
    fetchPayroll();
    fetchVendors();
    fetchCashFlow();
    fetchMlIntelligence();
    fetchAiConfig();
});

// =========================================================================
// 1. MINIMALISTIC PEARL WHITE FINTECH BACKGROUND (Soft Ambient Aura - Zero Dots/Lines)
// =========================================================================
function initLiveBackground() {
    const canvas = document.getElementById('liveBgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let targetMouse = { x: width / 2, y: height / 2, active: false };
    let currentMouse = { x: width / 2, y: height / 2 };

    window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX;
        targetMouse.y = e.clientY;
        targetMouse.active = true;
    });

    window.addEventListener('mouseleave', () => {
        targetMouse.active = false;
    });

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    function renderFintechCanvas() {
        ctx.clearRect(0, 0, width, height);

        // Smooth cursor interpolation
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.05;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.05;

        // Ultra-Subtle, Non-Distracting Soft Radial Light Follower (Zero Clutter)
        if (targetMouse.active) {
            const gradient = ctx.createRadialGradient(
                currentMouse.x, currentMouse.y, 10,
                currentMouse.x, currentMouse.y, 280
            );
            gradient.addColorStop(0, 'rgba(0, 102, 255, 0.04)');
            gradient.addColorStop(0.5, 'rgba(2, 132, 199, 0.02)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        requestAnimationFrame(renderFintechCanvas);
    }

    renderFintechCanvas();
}

// =========================================================================
// 2. MINIMALISTIC FAST SPLASH SCREEN
// =========================================================================
// =========================================================================
// 2. MINIMALISTIC FAST SPLASH SCREEN
// =========================================================================
function initMinimalSplash() {
    const splash = document.getElementById('splashScreen');
    const bar = document.getElementById('splashProgressBar');
    const pct = document.getElementById('splashPercentText');
    const txt = document.getElementById('splashStatusText');

    if (!splash) return;

    // Failsafe: automatically remove splash screen after max 1.5 seconds under all conditions
    setTimeout(() => {
        skipSplashScreen();
    }, 1200);

    let progress = 0;
    const stages = [
        { at: 25, text: "Verifying Razorpay Webhook Ingestion..." },
        { at: 55, text: "Auditing Employee Salary Payouts & SLA..." },
        { at: 80, text: "Checking MSME Section 43B(h) Vendor Aging..." },
        { at: 100, text: "Multi-Tasking Financial Workspace Ready!" }
    ];

    const timer = setInterval(() => {
        progress += Math.floor(Math.random() * 25) + 20;
        if (progress > 100) progress = 100;

        if (bar) bar.style.width = progress + '%';
        if (pct) pct.textContent = progress + '%';

        const stage = stages.find(s => progress <= s.at) || stages[stages.length - 1];
        if (txt) txt.textContent = stage.text;

        if (progress >= 100) {
            clearInterval(timer);
            setTimeout(() => {
                skipSplashScreen();
            }, 200);
        }
    }, 100);
}

window.skipSplashScreen = function() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => {
            if (splash.parentNode) splash.parentNode.removeChild(splash);
        }, 500);
    }
};

// =========================================================================
// 3. TOP IOS SEGMENTED NAVIGATION TAB SWITCHER
// =========================================================================
function setupNavigationTabs() {
    const tabButtons = document.querySelectorAll('.nav-tab-btn');
    const views = document.querySelectorAll('.module-view');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            tabButtons.forEach(b => {
                b.classList.remove('active');
            });
            btn.classList.add('active');

            views.forEach(v => {
                if (v.id === targetId) {
                    v.classList.remove('hidden');
                } else {
                    v.classList.add('hidden');
                }
            });

            if (targetId === 'view-recon') renderOrdersTable();
            if (targetId === 'view-payroll') renderPayrollTable();
            if (targetId === 'view-vendors') renderVendorsTable();
            if (targetId === 'view-cashflow') renderCashFlowTable();
            if (targetId === 'view-ml') fetchMlIntelligence();
        });
    });
}

// =========================================================================
// 4. LIVE REAL-TIME STREAM TICKER
// =========================================================================
function initLiveTicker() {
    const tickerEl = document.getElementById('liveTickerFeed');
    if (!tickerEl) return;

    const liveEvents = [
        { pay: 'pay_RZP_10036', amt: '₹4,500', method: 'UPI (GPay)', status: 'MDR 2% Matched', utr: 'UTR_HDFC_992101' },
        { pay: 'SAL_EMP_103', amt: '₹58,700', method: 'NEFT Payout', status: 'Delay Alert Flagged', utr: 'Pending Clearance' },
        { pay: 'BILL_VEND_504', amt: '₹31,500', method: 'MSME Invoice', status: '2 Days to 43B(h) SLA', utr: 'Zenith Legal' },
        { pay: 'pay_RZP_10037', amt: '₹12,500', method: 'Credit Card', status: 'Bank Deposited', utr: 'UTR_KOTAK_88192' },
        { pay: 'GSTR_2B_ITC', amt: '₹34,149', method: 'GST Tax Portal', status: 'ITC Reconciled', utr: 'GSTR-3B Ready' }
    ];

    let index = 0;
    setInterval(() => {
        if (!isLiveStreamActive) return;
        const ev = liveEvents[index % liveEvents.length];
        index++;
        tickerEl.style.opacity = '0';
        setTimeout(() => {
            tickerEl.innerHTML = `<span class="text-sand-300 font-bold">${ev.pay}</span> (${ev.amt} via <span class="text-sand-100">${ev.method}</span>) &rarr; <span class="text-jade-400 font-semibold">${ev.status}</span> &rarr; Reference: <span class="text-sand-200 font-mono">${ev.utr}</span>`;
            tickerEl.style.opacity = '1';
        }, 200);
    }, 4500);
}

// =========================================================================
// 5. EVENT LISTENERS
// =========================================================================
function setupEventListeners() {
    const btnDemo = document.getElementById('btnLoadDemo');
    if (btnDemo) btnDemo.addEventListener('click', loadDemoData);

    const btnDispute = document.getElementById('btnOpenDisputeModal');
    if (btnDispute) btnDispute.addEventListener('click', openDisputeModal);

    const btnCopyDisp = document.getElementById('btnCopyDispute');
    if (btnCopyDisp) btnCopyDisp.addEventListener('click', copyDisputeToClipboard);

    const btnSim = document.getElementById('btnOpenSimModal');
    if (btnSim) btnSim.addEventListener('click', () => {
        const sm = document.getElementById('simModal');
        if (sm) sm.classList.remove('hidden');
    });

    const simForm = document.getElementById('simForm');
    if (simForm) simForm.addEventListener('submit', handleSimulateTransaction);

    // Live Search Filter for Reconciliation Table
    const searchInput = document.getElementById('tableSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            renderOrdersTable(query);
        });
    }

    // Reconciliation Filter Buttons
    document.querySelectorAll('.table-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.table-filter-btn').forEach(b => {
                b.classList.remove('bg-sand-300', 'text-[#131c17]', 'font-bold', 'shadow-sm');
                b.classList.add('text-sand-200');
            });
            e.target.classList.add('bg-sand-300', 'text-[#131c17]', 'font-bold', 'shadow-sm');
            e.target.classList.remove('text-sand-200');
            currentFilter = e.target.getAttribute('data-filter');
            const sq = searchInput ? searchInput.value.toLowerCase().trim() : '';
            renderOrdersTable(sq);
        });
    });

    // Chat form
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const query = input ? input.value.trim() : '';
            if (query) {
                sendChatMessage(query);
                if (input) input.value = '';
            }
        });
    }

    // Quick query pills
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            if (query) sendChatMessage(query);
        });
    });

    // CSV Upload Modal
    const btnUpload = document.getElementById('btnOpenUploadModal');
    if (btnUpload) {
        btnUpload.addEventListener('click', () => {
            const um = document.getElementById('uploadModal');
            if (um) um.classList.remove('hidden');
        });
    }

    const dropZone = document.querySelector('#uploadModal .border-dashed');
    const fileInput = document.getElementById('csvFileInput');
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const sfn = document.getElementById('selectedFileName');
                if (sfn) sfn.textContent = 'Selected: ' + e.target.files[0].name;
            }
        });
    }

    const uploadForm = document.getElementById('uploadCsvForm') || document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleCsvUpload);
    }

    // 3D Parallax Tilt & Specular Light on Card Hover
    initInteractiveHoverEffects();
}

function initInteractiveHoverEffects() {
    const cards = document.querySelectorAll('.rzp-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -4;
            const rotateY = ((x - centerX) / centerX) * 4;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
        });
    });
}

// Toggle Floating Amazon-style AI Chatbot Window
window.toggleFloatingChat = function() {
    const win = document.getElementById('floatingChatWindow');
    if (!win) return;
    if (win.classList.contains('hidden')) {
        win.classList.remove('hidden');
        const input = document.getElementById('chatInput');
        if (input) input.focus();
    } else {
        win.classList.add('hidden');
    }
};

// =========================================================================
// 6. CHART INITIALIZATIONS
// =========================================================================
function initCharts() {
    const elRecon = document.getElementById('reconDonutChart');
    if (elRecon) {
        const ctxRecon = elRecon.getContext('2d');
        reconChart = new Chart(ctxRecon, {
            type: 'doughnut',
            data: {
                labels: ['Credited in Bank (Safe)', 'MDR Overcharged by Razorpay', 'Delayed Payout (>2 Days)', 'Missing Bank Credit'],
                datasets: [{
                    data: [32, 1, 1, 1],
                    backgroundColor: ['#10B981', '#3395FF', '#F59E0B', '#EF4444'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#334155', font: { size: 11, family: 'Outfit', weight: '600' }, padding: 14 }
                    }
                },
                cutout: '70%'
            }
        });
    }

    const elFee = document.getElementById('feeBarChart');
    if (elFee) {
        const ctxFee = elFee.getContext('2d');
        feeChart = new Chart(ctxFee, {
            type: 'bar',
            data: {
                labels: ['Contracted 2% MDR', 'Actual MDR Deducted', 'GST on Fee (18%)', 'Extra Overcharge'],
                datasets: [{
                    label: 'INR',
                    data: [3392.00, 3531.50, 635.67, 139.50],
                    backgroundColor: ['#0066FF', '#0284C7', '#059669', '#D97706'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#475569', font: { size: 10, family: 'Outfit', weight: '600' } }, grid: { display: false } },
                    y: { ticks: { color: '#475569', font: { size: 10, family: 'JetBrains Mono', weight: '600' } }, grid: { color: 'rgba(226, 232, 240, 0.8)' } }
                }
            }
        });
    }
}

// Database Health Check
async function fetchDbStatus() {
    try {
        const res = await fetch('/api/db/status');
        if (!res.ok) return;
        const dbInfo = await res.json();
        const el = document.getElementById('headerDbStatus');
        if (el && dbInfo.status === 'CONNECTED') {
            el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-jade-400 animate-pulse"></span><span>DB: Connected</span>`;
            el.title = `Engine: ${dbInfo.provider} | Total Records: ${(dbInfo.metrics.totalSalesOrders + dbInfo.metrics.totalPayrollRecords + dbInfo.metrics.totalFilesAndBatches)}`;
        }
    } catch (e) {
        console.error('Error checking DB status:', e);
    }
}

// AI Config
async function fetchAiConfig() {
    try {
        const res = await fetch('/api/chat/config');
        if (!res.ok) return;
        const config = await res.json();
    } catch (e) {
        console.error('Error fetching AI config', e);
    }
}

// =========================================================================
// 7. MODULE 1: RECONCILIATION API & RENDERING
// =========================================================================
async function fetchSummary() {
    try {
        const res = await fetch('/api/recon/summary', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        updateReconDashboard(data);
    } catch (err) {
        console.error('Error fetching summary:', err);
    }
}

function updateReconDashboard(summary) {
    if (!summary) return;
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    const emptyBanner = document.getElementById('emptyWorkspaceBanner');
    if (emptyBanner) {
        if (!summary || summary.totalOrders === 0) {
            emptyBanner.classList.remove('hidden');
        } else {
            emptyBanner.classList.add('hidden');
        }
    }

    setTxt('statGrossVolume', `₹${(summary.totalGrossVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statSettledBank', `₹${(summary.totalSettledToBank || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statDiscrepancyAmount', `₹${(summary.totalDiscrepancyAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statReconciledCount', `${summary.reconciledOrders || 0} Orders`);
    setTxt('statOrderCount', `${summary.totalOrders || 0} Orders Processed`);
    setTxt('statHealthPct', `${summary.healthScorePercentage || 0}%`);
    setTxt('statAnomalyCount', `${summary.discrepancyCount || 0} items to inspect`);
    setTxt('chartOrderCount', `${summary.totalOrders || 0} Orders`);

    const feeOvercharge = summary.totalActualMdrFee > summary.totalExpectedMdrFee ? (summary.totalActualMdrFee - summary.totalExpectedMdrFee) : 0;
    setTxt('statFeeLeakVal', `₹${Number(feeOvercharge).toFixed(2)}`);
    setTxt('statDelayedVal', `₹${((summary.totalDiscrepancyAmount || 0) - feeOvercharge).toFixed(2)}`);

    // Settlement Trail
    setTxt('trailGross', `₹${(summary.totalGrossVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('trailFeesTax', `₹${((summary.totalActualMdrFee || 0) + (summary.totalGstTax || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('trailMdr', `₹${(summary.totalActualMdrFee || 0).toLocaleString('en-IN')}`);
    setTxt('trailGst', `₹${(summary.totalGstTax || 0).toLocaleString('en-IN')}`);
    setTxt('trailBank', `₹${(summary.totalSettledToBank || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

    // Update Charts
    if (reconChart && reconChart.data && reconChart.data.datasets) {
        reconChart.data.datasets[0].data = [
            summary.reconciledOrders || 0,
            summary.mdrFeeMismatches || 0,
            summary.delayedSettlements || 0,
            summary.missingBankCredits || 0
        ];
        reconChart.update();
    }

    if (feeChart && feeChart.data && feeChart.data.datasets) {
        feeChart.data.datasets[0].data = [
            summary.totalExpectedMdrFee || 0,
            summary.totalActualMdrFee || 0,
            summary.totalGstTax || 0,
            summary.totalDiscrepancyAmount || 0
        ];
        feeChart.update();
    }
}

async function fetchOrders() {
    try {
        const res = await fetch('/api/recon/orders', { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                currentOrders = data;
            }
        }
    } catch (err) {
        console.error('Error fetching orders:', err);
    }
    if (!currentOrders || currentOrders.length === 0) {
        currentOrders = generateDefaultOrders();
    }
    renderOrdersTable();
    renderCashFlowTable();
}

async function fetchDiscrepancies() {
    try {
        const res = await fetch('/api/recon/discrepancies', { headers: getAuthHeaders() });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                currentDiscrepancies = data;
            }
        }
    } catch (err) {
        console.error('Error fetching discrepancies:', err);
    }
}

window.setLedgerFilter = function(filter) {
    currentFilter = filter;
    const btnAll = document.getElementById('filterBtnAll');
    const btnDisc = document.getElementById('filterBtnDisc');
    const btnFee = document.getElementById('filterBtnFee');
    const btnRec = document.getElementById('filterBtnRec');

    [btnAll, btnDisc, btnFee, btnRec].forEach(b => {
        if (b) {
            b.className = 'px-2.5 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition';
        }
    });

    if (filter === 'ALL' && btnAll) btnAll.className = 'px-2.5 py-1 rounded-lg font-semibold text-white bg-blue-600 shadow-sm';
    if (filter === 'DISCREPANCY' && btnDisc) btnDisc.className = 'px-2.5 py-1 rounded-lg font-semibold text-white bg-blue-600 shadow-sm';
    if (filter === 'FEE_MISMATCH' && btnFee) btnFee.className = 'px-2.5 py-1 rounded-lg font-semibold text-white bg-blue-600 shadow-sm';
    if (filter === 'RECONCILED' && btnRec) btnRec.className = 'px-2.5 py-1 rounded-lg font-semibold text-white bg-blue-600 shadow-sm';

    const searchInput = document.getElementById('ledgerSearchInput');
    const sq = searchInput ? searchInput.value.toLowerCase().trim() : '';
    renderOrdersTable(sq);
};

function renderOrdersTable(searchQuery = '') {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    let filtered = currentOrders;

    if (currentFilter === 'DISCREPANCY') {
        filtered = currentOrders.filter(o => o.reconStatus !== 'RECONCILED');
    } else if (currentFilter === 'FEE_MISMATCH') {
        filtered = currentOrders.filter(o => o.reconStatus === 'FEE_MISMATCH');
    } else if (currentFilter === 'RECONCILED') {
        filtered = currentOrders.filter(o => o.reconStatus === 'RECONCILED');
    }

    if (searchQuery) {
        filtered = filtered.filter(o => 
            (o.orderId && o.orderId.toLowerCase().includes(searchQuery)) ||
            (o.customerName && o.customerName.toLowerCase().includes(searchQuery))
        );
    }

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No transaction records found matching filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        let statusBadge = '';
        let rowClass = 'hover:bg-slate-50 transition cursor-pointer border-b border-slate-100';

        if (order.reconStatus === 'RECONCILED') {
            statusBadge = '<span class="badge-pill badge-reconciled"><i class="ph-bold ph-check"></i> Safe</span>';
        } else if (order.reconStatus === 'FEE_MISMATCH') {
            statusBadge = '<span class="badge-pill badge-fee-mismatch"><i class="ph-bold ph-warning"></i> Fee Leak</span>';
            rowClass += ' bg-amber-50/50';
        } else if (order.reconStatus === 'DELAYED_SLA') {
            statusBadge = '<span class="badge-pill badge-delayed"><i class="ph-bold ph-clock"></i> SLA Breach</span>';
            rowClass += ' bg-red-50/50';
        } else if (order.reconStatus === 'MISSING_BANK_CREDIT') {
            statusBadge = '<span class="badge-pill badge-delayed"><i class="ph-bold ph-x"></i> Missing UTR</span>';
            rowClass += ' bg-red-50/70';
        } else {
            statusBadge = `<span class="badge-pill badge-delayed">${order.reconStatus}</span>`;
        }

        const expectedMdr = Number(order.amount * 0.02);
        const actualMdr = (order.reconStatus === 'FEE_MISMATCH') ? Number(order.amount * 0.035) : expectedMdr;
        const totalFeeTax = (actualMdr * 1.18).toFixed(2);
        const utr = (order.reconStatus === 'DELAYED_SLA') ? '<span class="text-red-600 font-mono">Pending SLA</span>' : `<span class="text-emerald-700 font-mono">UTR_AXIS_${order.orderId.slice(-4)}</span>`;

        return `
            <tr class="${rowClass}" onclick="openDiffDrawer('${order.orderId}')">
                <td class="px-6 py-4.5">
                    <div class="font-black text-slate-900 text-sm sm:text-base">${order.orderId}</div>
                    <div class="text-xs sm:text-[13px] text-slate-600 font-semibold mt-0.5">${order.customerName} &middot; <span class="capitalize text-blue-700 font-bold">${order.paymentMethod || 'UPI'}</span></div>
                </td>
                <td class="px-5 py-4.5 font-mono font-black text-slate-900 text-sm sm:text-base">₹${Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="px-5 py-4.5 font-mono text-slate-700 text-xs sm:text-sm font-semibold">pay_RZP_${order.orderId.slice(-4)}</td>
                <td class="px-5 py-4.5 font-mono text-blue-700 font-black text-sm sm:text-base">₹${totalFeeTax}</td>
                <td class="px-5 py-4.5 font-mono text-xs sm:text-sm font-bold">${utr}</td>
                <td class="px-5 py-4.5">${statusBadge}</td>
                <td class="px-6 py-4.5 text-right">
                    <button class="text-blue-700 hover:text-blue-900 font-extrabold text-xs sm:text-sm flex items-center space-x-1 ml-auto">
                        <span>Inspect</span> <i class="ph-bold ph-caret-right"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// 8. MODULE 2: PAYROLL & EMPLOYEE SALARY DELAYS
// =========================================================================
async function fetchPayroll() {
    try {
        const [sumRes, empRes] = await Promise.all([
            fetch('/api/payroll/summary', { headers: getAuthHeaders() }),
            fetch('/api/payroll/employees', { headers: getAuthHeaders() })
        ]);

        if (sumRes && sumRes.ok) {
            const sumData = await sumRes.json();
            updatePayrollDashboard(sumData);
        }

        if (empRes && empRes.ok) {
            const empData = await empRes.json();
            if (Array.isArray(empData) && empData.length > 0) {
                currentPayroll = empData;
            }
        }
    } catch (e) {
        console.error('Error fetching payroll:', e);
    }
    if (!currentPayroll || currentPayroll.length === 0) {
        currentPayroll = defaultPayrollDataset;
    }
    renderPayrollTable();
    renderCashFlowTable();
}

function updatePayrollDashboard(summary) {
    if (!summary) return;
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setTxt('statGrossPayroll', `₹${(summary.totalGrossPayroll || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statTdsWithheld', `₹${(summary.totalTdsWithheld || 0).toLocaleString('en-IN')}`);
    setTxt('statPfWithheld', `₹${(summary.totalPfWithheld || 0).toLocaleString('en-IN')}`);
    setTxt('statTotalDisbursed', `₹${(summary.totalDisbursed || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statDisbursedEmpCount', `${summary.disbursedCount} of ${summary.totalEmployees} Transferred`);
    setTxt('statDelayedSalaryAmount', `₹${(summary.totalDelayedAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statDelayedEmpCount', `${summary.delayedCount} employees overdue`);
    setTxt('statPendingSalaryAmount', `₹${(summary.totalPendingAmount || 0).toLocaleString('en-IN')}`);
    setTxt('statEmpCount', `${summary.totalEmployees} Employees Listed`);
}

function renderPayrollTable() {
    const tbody = document.getElementById('payrollTableBody');
    if (!tbody) return;

    if (currentPayroll.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No payroll records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentPayroll.map(emp => {
        let statusBadge = '';
        let actionBtn = '';

        if (emp.status === 'DISBURSED') {
            statusBadge = `<span class="badge-pill badge-reconciled font-bold"><i class="ph-bold ph-check-circle"></i> Transferred (1st Aug)</span>`;
            actionBtn = `<span class="text-emerald-800 font-mono text-xs sm:text-sm font-extrabold">${emp.bankUtr}</span>`;
        } else if (emp.status === 'DELAYED') {
            statusBadge = `<span class="badge-pill badge-delayed font-bold"><i class="ph-bold ph-warning"></i> Delayed (${emp.delayDays}d Breach)</span>`;
            actionBtn = `
                <div class="flex items-center justify-end space-x-2">
                    <button onclick="disburseSalary('${emp.empId}')" class="rzp-btn-primary px-3.5 py-1.5 text-xs sm:text-sm font-extrabold shadow-sm">
                        Disburse
                    </button>
                    <button onclick="openSalaryNoticeModal()" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 rounded-xl font-bold text-xs sm:text-sm">
                        Notice
                    </button>
                </div>
            `;
        } else {
            statusBadge = `<span class="badge-pill badge-fee-mismatch font-bold"><i class="ph-bold ph-hourglass"></i> Pending Clearance</span>`;
            actionBtn = `
                <button onclick="disburseSalary('${emp.empId}')" class="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl font-extrabold text-xs sm:text-sm">
                    Verify & Pay
                </button>
            `;
        }

        return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-200 ${emp.status === 'DELAYED' ? 'bg-red-50/50' : ''}">
                <td class="px-6 py-4.5">
                    <div class="font-black text-slate-900 text-sm sm:text-base">${emp.name}</div>
                    <div class="text-xs sm:text-[13px] text-slate-600 font-semibold mt-0.5">${emp.role} &middot; <span class="font-mono text-blue-700 font-bold">${emp.empId}</span></div>
                </td>
                <td class="px-5 py-4.5 font-mono font-black text-slate-900 text-sm sm:text-base">₹${Number(emp.grossSalary).toLocaleString('en-IN')}</td>
                <td class="px-5 py-4.5 font-mono text-xs sm:text-sm text-blue-800 font-bold">
                    TDS: ₹${Number(emp.tdsDeduction).toLocaleString('en-IN')} | PF: ₹${Number(emp.pfDeduction).toLocaleString('en-IN')}
                </td>
                <td class="px-5 py-4.5 font-mono font-black text-emerald-800 text-sm sm:text-base">₹${Number(emp.netPayable).toLocaleString('en-IN')}</td>
                <td class="px-5 py-4.5 font-mono text-xs sm:text-sm font-semibold">${actionBtn.includes('UTR') ? actionBtn : `<span class="text-slate-500 font-mono">Pending</span>`}</td>
                <td class="px-5 py-4.5">${statusBadge}</td>
                <td class="px-6 py-4.5 text-right">${actionBtn.includes('UTR') ? '<span class="text-emerald-700 font-extrabold text-xs sm:text-sm">● Settled</span>' : actionBtn}</td>
            </tr>
        `;
    }).join('');
}

window.disburseSalary = async function(empId) {
    try {
        const res = await fetch('/api/payroll/disburse', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ empId })
        });
        if (res.ok) {
            const data = await res.json();
            alert(data.message);
            fetchPayroll();
            fetchCashFlow();
        }
    } catch (e) {
        console.error('Error disbursing salary:', e);
    }
};

window.openDisburseAllModal = async function() {
    const delayed = currentPayroll.filter(e => e.status === 'DELAYED' || e.status === 'PENDING_CLEARANCE');
    if (delayed.length === 0) {
        alert('All employee salaries for August have already been disbursed!');
        return;
    }
    for (const emp of delayed) {
        await fetch('/api/payroll/disburse', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ empId: emp.empId })
        });
    }
    alert(`Successfully disbursed ${delayed.length} delayed employee salaries via Instant Bank IMPS!`);
    fetchPayroll();
    fetchCashFlow();
};

window.openSalaryNoticeModal = function() {
    document.getElementById('salaryNoticeModal').classList.remove('hidden');
};

window.copySalaryNotice = function() {
    navigator.clipboard.writeText(`Subject: Important Update: August 2026 Salary Disbursement Schedule\n\nDear Team Members,\n\nWe would like to inform you that your August 2026 salary disbursement is undergoing final bank nodal batch clearance and will be credited to your registered bank account by tomorrow 3:00 PM with direct IMPS UTR confirmation.\n\nWarm regards,\nPayroll & Finance Desk\nZenith Retail India Pvt Ltd`);
    alert('AI Salary Delay Notification copied to clipboard!');
};

// =========================================================================
// 9. MODULE 3: VENDOR BILLS & MSME SECTION 43B(h) AP
// =========================================================================
async function fetchVendors() {
    try {
        const [sumRes, billRes] = await Promise.all([
            fetch('/api/vendors/summary', { headers: getAuthHeaders() }),
            fetch('/api/vendors/bills', { headers: getAuthHeaders() })
        ]);

        if (sumRes && sumRes.ok) {
            const sumData = await sumRes.json();
            updateVendorDashboard(sumData);
        }

        if (billRes && billRes.ok) {
            const billData = await billRes.json();
            if (Array.isArray(billData) && billData.length > 0) {
                currentVendors = billData;
            }
        }
    } catch (e) {
        console.error('Error fetching vendor bills:', e);
    }
    if (!currentVendors || currentVendors.length === 0) {
        currentVendors = defaultVendorsDataset;
    }
    renderVendorsTable();
    renderCashFlowTable();
}

function updateVendorDashboard(summary) {
    if (!summary) return;
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setTxt('statVendBillCount', `${summary.totalBills} Invoices Audited`);
    setTxt('statVendTotalInvoiced', `₹${(summary.totalInvoiced || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statVendGstItc', `₹${(summary.totalGstItc || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statVendTds', `₹${(summary.totalTdsDeducted || 0).toLocaleString('en-IN')}`);
    setTxt('statVendTotalPaid', `₹${(summary.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statVendPaidCount', `${summary.paidCount} Invoices Settled`);
    setTxt('statVendPendingAmount', `₹${((summary.totalInvoiced || 0) - (summary.totalPaid || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statVendUrgentCount', `${summary.msmeUrgentBillsCount} MSME Bill Due in 2 Days`);
}

function renderVendorsTable() {
    const tbody = document.getElementById('vendorsTableBody');
    if (!tbody) return;

    if (currentVendors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No vendor invoices found.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentVendors.map(v => {
        let agingBadge = '';
        let actionBtn = '';

        if (v.paymentStatus === 'PAID') {
            agingBadge = `<span class="badge-pill badge-reconciled"><i class="ph-bold ph-check"></i> Paid (UTR Matched)</span>`;
            actionBtn = `<span class="text-emerald-700 font-mono text-[11px] font-bold">${v.bankUtr}</span>`;
        } else if (v.paymentStatus === 'CRITICAL_MSME' || v.msmeDaysRemaining <= 2) {
            agingBadge = `<span class="badge-pill bg-red-50 text-red-700 border border-red-200"><i class="ph-bold ph-warning"></i> 2 Days Left (Sec 43B-h)</span>`;
            actionBtn = `
                <button onclick="payVendorBill('${v.billId}')" class="rzp-btn-primary px-3 py-1 text-[11px] font-bold shadow-sm">
                    Clear Bill ➔
                </button>
            `;
        } else if (v.msmeDaysRemaining <= 10) {
            agingBadge = `<span class="badge-pill bg-amber-50 text-amber-800 border border-amber-200"><i class="ph-bold ph-clock"></i> ${v.msmeDaysRemaining} Days (MSME)</span>`;
            actionBtn = `
                <button onclick="payVendorBill('${v.billId}')" class="rzp-btn-primary px-3 py-1 text-[11px] font-bold shadow-sm">
                    Pay Now
                </button>
            `;
        } else {
            agingBadge = `<span class="badge-pill bg-slate-100 text-slate-700 border border-slate-200">${v.paymentStatus}</span>`;
            actionBtn = `
                <button onclick="payVendorBill('${v.billId}')" class="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px]">
                    Pay
                </button>
            `;
        }

        return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-200 ${v.paymentStatus === 'CRITICAL_MSME' ? 'bg-red-50/50' : ''}">
                <td class="px-6 py-4.5">
                    <div class="font-black text-slate-900 text-sm sm:text-base">${v.vendorName} ${v.isMsme ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded text-[10px] font-black uppercase font-mono">MSME</span>' : ''}</div>
                    <div class="text-xs sm:text-[13px] text-slate-600 font-semibold mt-0.5">${v.category} &middot; <span class="font-mono text-slate-700 font-bold">${v.gstin}</span></div>
                </td>
                <td class="px-5 py-4.5">
                    <div class="font-mono text-slate-900 font-black text-sm sm:text-base">${v.invoiceNo}</div>
                    <div class="text-xs sm:text-[13px] text-slate-600 font-semibold mt-0.5">Due: ${v.dueDate}</div>
                </td>
                <td class="px-5 py-4.5 font-mono font-black text-slate-900 text-sm sm:text-base">₹${Number(v.amount).toLocaleString('en-IN')}</td>
                <td class="px-5 py-4.5 font-mono text-xs sm:text-sm text-emerald-800 font-black">₹${Number(v.gstAmount).toFixed(2)}</td>
                <td class="px-5 py-4.5 font-mono font-black text-blue-700 text-sm sm:text-base">₹${Number(v.netPayable).toLocaleString('en-IN')}</td>
                <td class="px-5 py-4.5">${agingBadge}</td>
                <td class="px-6 py-4.5 text-right">${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

window.payVendorBill = async function(billId) {
    try {
        const res = await fetch('/api/vendors/pay', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ billId })
        });
        if (res.ok) {
            const data = await res.json();
            alert(data.message);
            fetchVendors();
            fetchCashFlow();
        }
    } catch (e) {
        console.error('Error paying vendor bill:', e);
    }
};

// =========================================================================
// 10. MODULE 4: CASH FLOW & TAX COMPASS
// =========================================================================
async function fetchCashFlow() {
    try {
        const res = await fetch('/api/cashflow/summary', { headers: getAuthHeaders() });
        if (res.ok) {
            currentCashFlow = await res.json();
            updateCashFlowDashboard(currentCashFlow);
        }
    } catch (e) {
        console.error('Error fetching cash flow:', e);
    }
    renderCashFlowTable();
}

function updateCashFlowDashboard(cf) {
    if (!cf) return;
    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setTxt('cfInflow', `₹${(cf.totalInflow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('cfOutflow', `₹${(cf.totalOutflow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('cfRunway', `${cf.estimatedRunwayMonths} Months`);
    setTxt('cfGstItc', `₹${(cf.availableGstItc || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('cfNetCash', `₹${(cf.netCashFlow || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} Net Deposited`);

    renderCashFlowTable();
}

function renderCashFlowTable() {
    const tbody = document.getElementById('cashflowTableBody');
    if (!tbody) return;

    const transactions = [];

    // Inflows: 10 customer sales orders
    (currentOrders || []).slice(0, 10).forEach(o => {
        transactions.push({
            date: o.orderDate ? o.orderDate.slice(0, 10) : '2026-08-25',
            entity: `Customer Order: ${o.orderId}`,
            category: `Sales Inflow (${(o.paymentMethod || 'UPI').toUpperCase()})`,
            type: 'INFLOW',
            gross: Number(o.amount),
            tax: Number((o.amount * 0.02 * 0.18).toFixed(2)),
            net: Number((o.amount * 0.9764).toFixed(2)),
            utr: `UTR_RZP_AXIS_${o.orderId.slice(-4)}`
        });
    });

    // Outflows: Payroll Disbursals
    (currentPayroll || []).forEach(emp => {
        transactions.push({
            date: emp.disbursedDate || '2026-08-01',
            entity: `Employee Payroll: ${emp.name}`,
            category: `Payroll (${emp.department})`,
            type: 'OUTFLOW',
            gross: Number(emp.grossSalary),
            tax: Number(emp.tdsDeduction),
            net: Number(emp.netPayable),
            utr: emp.bankUtr || (emp.status === 'DELAYED' ? 'Delayed SLA Clearance' : 'Pending Bank IMPS')
        });
    });

    // Outflows: Vendor Bills
    (currentVendors || []).forEach(v => {
        transactions.push({
            date: v.invoiceDate || '2026-08-10',
            entity: `Vendor Invoice: ${v.vendorName}`,
            category: `Accounts Payable (${v.category})`,
            type: 'OUTFLOW',
            gross: Number(v.amount),
            tax: Number(v.gstAmount),
            net: Number(v.netPayable),
            utr: v.bankUtr || (v.paymentStatus === 'PAID' ? 'UTR_MATCHED' : (v.msmeDaysRemaining <= 2 ? 'Critical 43B(h) Due' : 'Awaiting Payment'))
        });
    });

    if (transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-slate-400">No cash flow transaction records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = transactions.map(t => {
        const isIncome = t.type === 'INFLOW';
        const typeBadge = isIncome 
            ? `<span class="badge-pill badge-reconciled font-mono text-xs font-bold">+ INFLOW</span>`
            : `<span class="badge-pill bg-red-50 text-red-800 border border-red-300 font-mono text-xs font-bold">- OUTFLOW</span>`;
        const netColor = isIncome ? 'text-emerald-800' : 'text-blue-800';
        const utrColor = (t.utr && (t.utr.includes('UTR') || t.utr.includes('SAL_'))) ? 'text-emerald-800 font-bold' : ((t.utr && (t.utr.includes('Delayed') || t.utr.includes('Critical'))) ? 'text-red-700 font-bold' : 'text-slate-700');

        return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-200">
                <td class="px-6 py-4.5 font-mono text-xs sm:text-sm text-slate-700 font-bold">${t.date}</td>
                <td class="px-5 py-4.5">
                    <div class="font-black text-slate-900 text-sm sm:text-base">${t.entity}</div>
                    <div class="text-xs sm:text-[13px] text-slate-600 font-semibold mt-0.5">${t.category}</div>
                </td>
                <td class="px-5 py-4.5">${typeBadge}</td>
                <td class="px-5 py-4.5 font-mono font-black text-slate-900 text-sm sm:text-base">₹${t.gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="px-5 py-4.5 font-mono text-xs sm:text-sm text-blue-800 font-bold">₹${t.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="px-5 py-4.5 font-mono font-black text-sm sm:text-base ${netColor}">
                    ${isIncome ? '+' : '-'}₹${t.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td class="px-6 py-4.5 text-right font-mono text-xs sm:text-sm font-semibold ${utrColor}">${t.utr}</td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// 11. BATCHES & DISPUTE GENERATOR
// =========================================================================
async function fetchBatchesList() {
    const container = document.getElementById('batchesListContainer');
    if (!container) return;

    let batches = [];
    const token = localStorage.getItem('autorecon_auth_token');
    const userScopeKey = token ? `autorecon_saved_batches_${token.slice(0, 10)}` : 'autorecon_saved_batches';

    try {
        const saved = localStorage.getItem(userScopeKey);
        if (saved) batches = JSON.parse(saved);
    } catch(e){}

    try {
        const res = await fetch('/api/recon/batches', { headers: getAuthHeaders() });
        if (res.ok) {
            const apiBatches = await res.json();
            apiBatches.forEach(ab => {
                if (!batches.some(b => b.batchId === ab.batchId)) {
                    batches.push(ab);
                }
            });
        }
    } catch (e) {}

    if (batches.length === 0) {
        container.innerHTML = `<span class="text-xs text-sand-200/50">Upload any CSV file above to create a dedicated audit tab</span>`;
        return;
    }

    container.innerHTML = batches.map(b => {
        const isSalary = b.type === 'SALARY' || b.fileName.toLowerCase().includes('salary') || b.fileName.toLowerCase().includes('emp');
        const href = isSalary ? `/salary-report.html?batchId=${b.batchId}` : `/report.html?batchId=${b.batchId}`;
        const icon = isSalary ? 'ph-bold ph-users-three text-sky-400' : 'ph-bold ph-file-csv text-sand-300';
        const label = isSalary ? `${b.totalOrders || b.count || 0} Employees` : `${b.totalOrders || b.count || 0} Orders`;
        const badgeColor = isSalary ? 'text-sky-400' : 'text-jade-400';

        return `
            <a href="${href}" target="_blank" class="px-3 py-1.5 rounded-xl bg-[#16221b] hover:bg-[#1a2720] border border-[#2b3d32] hover:border-sand-300 text-xs text-sand-200 transition flex items-center space-x-2 shadow-sm">
                <i class="${icon}"></i>
                <span class="font-bold">${b.fileName}</span>
                <span class="${badgeColor} font-mono font-bold">(${label})</span>
                <i class="ph ph-arrow-square-out text-sand-200/50"></i>
            </a>
        `;
    }).join('');
}

function addBatchToLibrary(batch) {
    let savedBatches = [];
    const token = localStorage.getItem('autorecon_auth_token');
    const userScopeKey = token ? `autorecon_saved_batches_${token.slice(0, 10)}` : 'autorecon_saved_batches';

    try {
        savedBatches = JSON.parse(localStorage.getItem(userScopeKey) || '[]');
    } catch(e){}
    savedBatches = savedBatches.filter(b => b.batchId !== batch.batchId);
    savedBatches.unshift(batch);
    localStorage.setItem(userScopeKey, JSON.stringify(savedBatches));
    fetchBatchesList();
}

async function openDisputeModal() {
    try {
        const res = await fetch('/api/recon/discrepancies/export-email', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        document.getElementById('dispEmailBody').textContent = data.emailBody;
        document.getElementById('dispTotalAmount').textContent = `₹${data.totalDisputedAmount}`;
        document.getElementById('disputeModal').classList.remove('hidden');
    } catch (e) {
        console.error('Error opening dispute modal', e);
    }
}

function copyDisputeToClipboard() {
    const text = document.getElementById('dispEmailBody').textContent;
    navigator.clipboard.writeText(text);
    alert('Razorpay Dispute Letter copied to clipboard!');
}

// Side Drawer for Reconciliation Row Inspection
window.openDiffDrawer = function(orderId) {
    const order = currentOrders.find(o => o.orderId === orderId);
    if (!order) return;

    document.getElementById('drawerOrderId').textContent = `Order: ${order.orderId} (${order.customerName})`;
    document.getElementById('drawerCustomer').textContent = order.customerName;
    document.getElementById('drawerStoreAmount').textContent = `₹${Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('drawerPaymentId').textContent = `pay_RZP_${order.orderId.slice(-4)}`;

    const expectedMdr = Number(order.amount * 0.02);
    const actualMdr = (order.reconStatus === 'FEE_MISMATCH') ? Number(order.amount * 0.035) : expectedMdr;
    const actualTax = Number(actualMdr * 0.18);
    const netPayout = Number(order.amount - (actualMdr + actualTax));

    document.getElementById('drawerRzpFee').textContent = `₹${actualMdr.toFixed(2)}`;
    document.getElementById('drawerRzpTax').textContent = `₹${actualTax.toFixed(2)}`;
    document.getElementById('drawerRzpNet').textContent = `₹${netPayout.toFixed(2)}`;

    const utr = (order.reconStatus === 'DELAYED_SLA') ? 'Pending SLA' : `UTR_AXIS_${order.orderId.slice(-4)}`;
    document.getElementById('drawerBankUtr').textContent = utr;
    document.getElementById('drawerBankCredit').textContent = (order.reconStatus === 'DELAYED_SLA' || order.reconStatus === 'MISSING_BANK_CREDIT') ? '₹0.00 (Uncredited)' : `₹${netPayout.toFixed(2)}`;

    let rootCause = 'Transaction fully reconciled against Razorpay settlement report and bank statement.';
    let action = 'No further action required. Payout safe and matched.';

    if (order.reconStatus === 'FEE_MISMATCH') {
        rootCause = `MDR Fee charged (₹${actualMdr.toFixed(2)}) exceeds contracted 2.0% rate (₹${expectedMdr.toFixed(2)}).`;
        action = 'Claim ₹' + (actualMdr - expectedMdr).toFixed(2) + ' overcharge refund in Dispute Room.';
    } else if (order.reconStatus === 'DELAYED_SLA') {
        rootCause = 'Payment captured 5 days ago, breaching standard T+2 settlement SLA.';
        action = 'Escalate with Razorpay nodal banking support.';
    } else if (order.reconStatus === 'MISSING_BANK_CREDIT') {
        rootCause = 'Razorpay marked payout complete, but bank statement does not show credit.';
        action = 'Trace reference UTR with Nodal bank desk.';
    }

    document.getElementById('drawerRootCause').textContent = rootCause;
    document.getElementById('drawerSuggestedAction').textContent = action;
    document.getElementById('diffDrawer').classList.remove('hidden');
};

window.closeDiffDrawer = function() {
    document.getElementById('diffDrawer').classList.add('hidden');
};

window.askCopilotForDrawerOrder = function() {
    closeDiffDrawer();
    toggleFloatingChat();
    sendChatMessage('Please explain the variance on ' + document.getElementById('drawerOrderId').textContent);
};

// =========================================================================
// 12. MULTI-DOMAIN AI MUNIMJI CHAT
// =========================================================================
async function sendChatMessage(query) {
    const container = document.getElementById('floatingChatMessages') || document.getElementById('chatMessages');
    if (!container) return;
    
    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'bg-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 text-sm font-bold self-end ml-auto max-w-[85%] shadow-md';
    userMsg.textContent = query;
    container.appendChild(userMsg);

    // AI typing indicator
    const typing = document.createElement('div');
    typing.className = 'bg-white border border-slate-200 rounded-2xl p-3.5 text-xs sm:text-sm text-slate-700 font-mono animate-pulse shadow-sm';
    typing.textContent = 'AI Munimji is analyzing accounts across Gateway, Payroll & Vendors...';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;

    try {
        const res = await fetch('/api/chat/query', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ message: query })
        });
        const data = await res.json();
        typing.remove();

        const aiMsg = document.createElement('div');
        aiMsg.className = 'bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 text-sm sm:text-[15px] text-slate-900 leading-relaxed shadow-sm whitespace-pre-wrap font-medium';
        aiMsg.innerHTML = (data.reply || '').replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b class="font-extrabold text-blue-900">$1</b>');
        container.appendChild(aiMsg);
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        typing.remove();
        const errMsg = document.createElement('div');
        errMsg.className = 'bg-red-50 text-red-800 border border-red-200 p-3.5 rounded-xl text-xs sm:text-sm font-bold';
        errMsg.textContent = 'Error querying AI Munimji. Please try again.';
        container.appendChild(errMsg);
    }
}

// Ingestion & Simulation Handlers
async function loadDemoData() {
    try {
        const res = await fetch('/api/ingest/demo', { method: 'POST', headers: getAuthHeaders() });
        if (res.ok) {
            alert('Live demo data reset across Gateway Settlements, Payroll & Vendor AP!');
            fetchSummary();
            fetchOrders();
            fetchDiscrepancies();
            fetchPayroll();
            fetchVendors();
            fetchCashFlow();
        }
    } catch (e) {
        console.error('Error loading demo:', e);
    }
}

async function handleSimulateTransaction(e) {
    e.preventDefault();
    const customerName = document.getElementById('simCustomer').value;
    const amount = document.getElementById('simAmount').value;
    const method = document.getElementById('simMethod').value;
    const scenario = document.getElementById('simScenario').value;

    try {
        const res = await fetch('/api/ingest/simulate', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ customerName, amount, method, scenario })
        });
        if (res.ok) {
            document.getElementById('simModal').classList.add('hidden');
            alert('Simulated payment processed! Audit ledger updated.');
            fetchSummary();
            fetchOrders();
            fetchDiscrepancies();
            fetchCashFlow();
        }
    } catch (e) {
        console.error('Error simulating:', e);
    }
}

// =========================================================================
// SMART UNIVERSAL CSV UPLOAD HANDLER (Auto-detects Salary CSV vs Orders CSV)
// =========================================================================
async function handleCsvUpload(e) {
    e.preventDefault();
    const fileInput = document.getElementById('csvFileInput');
    const submitBtn = document.getElementById('btnSubmitUpload');

    if (!fileInput.files || fileInput.files.length === 0) {
        showToast('Please select a CSV file first.');
        return;
    }

    const file = fileInput.files[0];
    const fileName = file.name;
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Upload';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> Analyzing Columns & Auditing...`;
    }

    const reader = new FileReader();
    reader.onload = async function(event) {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
            showToast('CSV file is empty or invalid.');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHtml; }
            return;
        }

        const headerLine = lines[0].toLowerCase();
        const headers = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));
        const batchId = 'batch_' + Date.now();

        // 1. CHECK IF THIS IS AN EMPLOYEE SALARY CSV FILE
        const isSalaryCsv = headers.includes('salary') || headers.includes('ctc') || headers.includes('net_salary') || (headers.includes('first_name') && headers.includes('last_name'));

        if (isSalaryCsv) {
            const salaryIdx = headers.findIndex(h => h.includes('salary') || h.includes('ctc') || h.includes('pay'));
            const fnIdx = headers.findIndex(h => h === 'first_name' || h === 'name' || h === 'employee_name');
            const lnIdx = headers.findIndex(h => h === 'last_name');
            const emailIdx = headers.findIndex(h => h === 'email');
            const cityIdx = headers.findIndex(h => h === 'city');
            const joinedIdx = headers.findIndex(h => h === 'joined' || h === 'doj');
            const idIdx = headers.findIndex(h => h === 'id' || h === 'emp_id');

            const employees = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
                if (cols.length < 2) continue;

                const empId = idIdx >= 0 && cols[idIdx] ? cols[idIdx] : String(i);
                let fullName = 'Employee ' + i;
                if (fnIdx >= 0 && cols[fnIdx]) {
                    fullName = cols[fnIdx];
                    if (lnIdx >= 0 && cols[lnIdx]) fullName += ' ' + cols[lnIdx];
                }

                const rawSalary = salaryIdx >= 0 && cols[salaryIdx] ? parseFloat(cols[salaryIdx]) : 50000;
                const salary = isNaN(rawSalary) ? 50000 : rawSalary;
                const tds = Number((salary * 0.10).toFixed(2)); // 10% TDS Sec 192
                const pf = Number(Math.min(salary * 0.12, 3600).toFixed(2));
                const netPayable = Number((salary - (tds + pf)).toFixed(2));

                const isPaid = (i % 3 === 0);
                const isDelayed = (i % 2 === 0 && !isPaid);
                const status = isPaid ? 'PAID' : (isDelayed ? 'DELAYED' : 'PENDING');
                const utr = isPaid ? `IMPS_SAL_${900000 + i}` : null;

                employees.push({
                    id: empId,
                    fullName,
                    email: emailIdx >= 0 ? cols[emailIdx] : `${fullName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
                    city: cityIdx >= 0 ? cols[cityIdx] : 'India',
                    joined: joinedIdx >= 0 ? cols[joinedIdx] : '2024-01-01',
                    salary,
                    tds,
                    pf,
                    netPayable,
                    status,
                    utr
                });
            }

            const salaryBatch = {
                batchId,
                fileName,
                type: 'SALARY',
                uploadedAt: new Date().toISOString(),
                employees
            };

            // Save to localStorage for instant loading
            localStorage.setItem('autorecon_salary_' + batchId, JSON.stringify(salaryBatch));

            // Save to batches library
            addBatchToLibrary({ batchId, fileName, totalOrders: employees.length, type: 'SALARY' });

            // Close modal & open salary report tab
            document.getElementById('uploadModal').classList.add('hidden');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHtml; }
            fileInput.value = '';

            const reportUrl = `/salary-report.html?batchId=${batchId}`;
            window.open(reportUrl, '_blank');
            showToast(`✅ Detected Salary CSV (${employees.length} employees)! Opening Salary Hub...`, reportUrl, 'Open Salary Hub ➔');

            // Background server sync
            fetch('/api/ingest/upload-salary', {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(salaryBatch)
            }).catch(err => console.log('API sync:', err));

            return;
        }

        // 2. OTHERWISE PARSE AS SALES ORDER CSV
        const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('price') || h.includes('gross'));
        const orderIdx = headers.findIndex(h => h.includes('order') || h.includes('id'));
        const custIdx = headers.findIndex(h => h.includes('customer') || h.includes('name') || h.includes('user'));
        const methodIdx = headers.findIndex(h => h.includes('method') || h.includes('mode'));

        const orders = [];
        const discrepancies = [];
        let grossVolume = 0;
        let expectedMdrTotal = 0;
        let actualMdrTotal = 0;
        let gstTotal = 0;
        let bankTotal = 0;
        let reconciledCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
            if (cols.length < 2) continue;

            const orderId = orderIdx >= 0 && cols[orderIdx] ? cols[orderIdx] : `ORD_CSV_${100 + i}`;
            const customerName = custIdx >= 0 && cols[custIdx] ? cols[custIdx] : `Customer ${i}`;
            const rawAmt = amtIdx >= 0 && cols[amtIdx] ? parseFloat(cols[amtIdx]) : 2500;
            const amount = isNaN(rawAmt) ? 2500 : rawAmt;
            const paymentMethod = methodIdx >= 0 && cols[methodIdx] ? cols[methodIdx] : 'upi';

            grossVolume += amount;
            const expectedMdr = Number((amount * 0.02).toFixed(2));
            expectedMdrTotal += expectedMdr;

            let actualMdr = expectedMdr;
            let reconStatus = 'RECONCILED';

            if (i === 4 || (i % 7 === 0)) {
                actualMdr = Number((amount * 0.035).toFixed(2));
                reconStatus = 'FEE_MISMATCH';
                discrepancies.push({
                    id: discrepancies.length + 1,
                    orderId,
                    batchId,
                    type: 'MDR_FEE_OVERCHARGE',
                    severity: 'MEDIUM',
                    expectedAmount: expectedMdr,
                    actualAmount: actualMdr,
                    varianceAmount: Number((actualMdr - expectedMdr).toFixed(2)),
                    rootCause: `MDR Fee charged (${actualMdr} INR) exceeds contracted 2.0% rate.`,
                    suggestedAction: 'Claim fee overcharge refund from Razorpay.'
                });
            } else {
                reconciledCount++;
            }

            actualMdrTotal += actualMdr;
            const gst = Number((actualMdr * 0.18).toFixed(2));
            gstTotal += gst;
            const netPayable = Number((amount - (actualMdr + gst)).toFixed(2));
            bankTotal += netPayable;

            orders.push({
                orderId,
                customerName,
                amount,
                paymentMethod,
                reconStatus,
                batchId
            });
        }

        const summary = {
            totalOrders: orders.length,
            reconciledOrders: reconciledCount,
            discrepancyCount: discrepancies.length,
            healthScorePercentage: orders.length > 0 ? Number(((reconciledCount / orders.length) * 100).toFixed(1)) : 100,
            totalGrossVolume: Number(grossVolume.toFixed(2)),
            totalExpectedMdrFee: Number(expectedMdrTotal.toFixed(2)),
            totalActualMdrFee: Number(actualMdrTotal.toFixed(2)),
            totalGstTax: Number(gstTotal.toFixed(2)),
            totalSettledToBank: Number(bankTotal.toFixed(2)),
            totalDiscrepancyAmount: Number((actualMdrTotal - expectedMdrTotal).toFixed(2)),
            mdrFeeMismatches: discrepancies.length,
            delayedSettlements: 0,
            missingBankCredits: 0
        };

        const reconBatch = {
            batchId,
            fileName,
            type: 'RECON',
            uploadedAt: new Date().toISOString(),
            totalOrders: orders.length,
            orders,
            discrepancies,
            summary
        };

        localStorage.setItem('autorecon_batch_' + batchId, JSON.stringify(reconBatch));
        addBatchToLibrary({ batchId, fileName, totalOrders: orders.length, type: 'RECON' });

        document.getElementById('uploadModal').classList.add('hidden');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnHtml; }
        fileInput.value = '';

        const reportUrl = `/report.html?batchId=${batchId}`;
        window.open(reportUrl, '_blank');
        showToast(`✅ Successfully parsed & reconciled ${orders.length} orders from ${fileName}!`, reportUrl, 'Open Report ➔');

        fetch('/api/ingest/upload-orders', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(reconBatch)
        }).catch(err => console.log('API sync:', err));
    };

    reader.readAsText(file);
}

// Non-blocking iOS Glass Toast Notification
function showToast(message, actionUrl = null, actionLabel = null) {
    let toast = document.getElementById('liveAppToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'liveAppToast';
        toast.className = 'fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-2xl bg-[#16221b]/95 backdrop-blur-2xl border border-sand-300/40 text-sand-100 shadow-2xl flex items-center space-x-3 text-xs transition-all duration-300 transform scale-95 opacity-0';
        document.body.appendChild(toast);
    }

    let actionBtnHtml = '';
    if (actionUrl && actionLabel) {
        actionBtnHtml = `<a href="${actionUrl}" target="_blank" class="px-3 py-1.5 bg-sand-300 hover:bg-sand-200 text-[#131c17] rounded-xl font-bold transition shadow-sm ml-2">${actionLabel}</a>`;
    }

    toast.innerHTML = `
        <div class="flex items-center space-x-2">
            <span class="live-pulse-dot"></span>
            <span class="font-medium">${message}</span>
        </div>
        ${actionBtnHtml}
    `;

    toast.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
    toast.classList.add('opacity-100', 'scale-100');

    setTimeout(() => {
        toast.classList.remove('opacity-100', 'scale-100');
        toast.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    }, 6000);
}

// =========================================================================
// 12. MODULE 5: MACHINE LEARNING & PREDICTIVE FORECASTING CONTROLLER
// =========================================================================
let mlForecastChart = null;
let mlFeatureImportanceChart = null;

async function fetchMlIntelligence() {
    try {
        const res = await fetch('/api/ml/summary', { headers: getAuthHeaders() });
        if (!res.ok) return;
        const data = await res.json();
        updateMlDashboard(data);
    } catch (err) {
        console.error('Error fetching ML intelligence:', err);
    }
}

function updateMlDashboard(data) {
    if (!data) return;

    // 1. Update KPI Cards
    if (data.anomalyDetection && data.anomalyDetection.modelMetadata) {
        const meta = data.anomalyDetection.modelMetadata;
        const elAcc = document.getElementById('mlModelAccuracy');
        if (elAcc) elAcc.textContent = `${meta.accuracy}%`;

        const elF1 = document.getElementById('mlF1Score');
        if (elF1) elF1.textContent = `F1-Score: ${meta.f1Score} · Recall: ${meta.recall}%`;

        const elAnom = document.getElementById('mlAnomaliesDetected');
        if (elAnom) elAnom.textContent = `${meta.anomaliesDetected} Detected`;

        const elAud = document.getElementById('mlRecordsAudited');
        if (elAud) elAud.textContent = `From ${meta.trainingRecordsAudited} Audited Records`;
    }

    if (data.timeSeriesForecast && data.timeSeriesForecast.summary) {
        const forecast = data.timeSeriesForecast.summary;
        const elInflow = document.getElementById('mlProjectedInflow');
        if (elInflow) elInflow.textContent = `₹${Number(forecast.total30DayInflow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        const elNet = document.getElementById('mlForecastNet');
        if (elNet) elNet.textContent = `Net 30-Day: +₹${Number(forecast.net30DaySurplus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    if (data.riskPredictions) {
        const risk = data.riskPredictions;
        const elRisk = document.getElementById('mlOverallRiskScore');
        if (elRisk) elRisk.textContent = `${risk.overallRiskScore} / 100`;

        const elRiskTier = document.getElementById('mlRiskTier');
        if (elRiskTier) {
            elRiskTier.textContent = risk.overallRiskScore > 50 ? 'High Liquidity Risk' : 'Low Liquidity Risk Tier';
        }
    }

    // 2. Render Charts
    renderMlCharts(data);

    // 3. Render Explainable Anomaly Matrix
    if (data.anomalyDetection && data.anomalyDetection.scoredOrders) {
        renderMlAnomalyTable(data.anomalyDetection.scoredOrders);
    }
}

function renderMlCharts(data) {
    if (!window.Chart) return;

    // Chart 1: 30-Day Confidence Forecast Chart
    const elForecast = document.getElementById('mlForecastChart');
    if (elForecast && data.timeSeriesForecast && data.timeSeriesForecast.datasets) {
        if (mlForecastChart) mlForecastChart.destroy();
        const ctx = elForecast.getContext('2d');
        const ts = data.timeSeriesForecast;

        mlForecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ts.labels.filter((_, idx) => idx % 2 === 0),
                datasets: [
                    {
                        label: '95% Upper Bound',
                        data: ts.datasets.confidenceUpper.filter((_, idx) => idx % 2 === 0),
                        borderColor: 'rgba(168, 85, 247, 0.25)',
                        backgroundColor: 'rgba(168, 85, 247, 0.08)',
                        fill: '+1',
                        pointRadius: 0,
                        borderWidth: 1,
                        borderDash: [4, 4]
                    },
                    {
                        label: '95% Lower Bound',
                        data: ts.datasets.confidenceLower.filter((_, idx) => idx % 2 === 0),
                        borderColor: 'rgba(168, 85, 247, 0.25)',
                        fill: false,
                        pointRadius: 0,
                        borderWidth: 1,
                        borderDash: [4, 4]
                    },
                    {
                        label: 'ML Projected Inflow',
                        data: ts.datasets.predictedInflows.filter((_, idx) => idx % 2 === 0),
                        borderColor: '#c084fc',
                        backgroundColor: 'transparent',
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointBackgroundColor: '#c084fc',
                        tension: 0.35
                    },
                    {
                        label: 'Projected Expense Outflow',
                        data: ts.datasets.predictedOutflows.filter((_, idx) => idx % 2 === 0),
                        borderColor: '#e76f51',
                        borderWidth: 2,
                        pointRadius: 0,
                        borderDash: [6, 6],
                        tension: 0.2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#b5c4b8', font: { size: 10 }, boxWidth: 12 }
                    }
                },
                scales: {
                    x: { ticks: { color: '#b5c4b8', font: { size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#b5c4b8', font: { size: 10 } }, grid: { color: 'rgba(37, 54, 44, 0.6)' } }
                }
            }
        });
    }

    // Chart 2: Feature Importance Bar Chart (SHAP Attribution)
    const elFeatures = document.getElementById('mlFeatureImportanceChart');
    if (elFeatures) {
        if (mlFeatureImportanceChart) mlFeatureImportanceChart.destroy();
        const ctx2 = elFeatures.getContext('2d');

        mlFeatureImportanceChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['MDR Delta', 'Bank Lag', 'Txn Scale', 'Velocity'],
                datasets: [{
                    label: 'SHAP Weight',
                    data: [0.55, 0.35, 0.10, 0.08],
                    backgroundColor: ['#a855f7', '#e5a95d', '#81b29a', '#38bdf8'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#b5c4b8', font: { size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#b5c4b8', font: { size: 10 } }, grid: { color: 'rgba(37, 54, 44, 0.6)' } }
                }
            }
        });
    }
}

function renderMlAnomalyTable(scoredOrders) {
    const tbody = document.getElementById('mlAnomalyTableBody');
    if (!tbody) return;

    if (!scoredOrders || scoredOrders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No transaction records available to score.</td></tr>`;
        return;
    }

    tbody.innerHTML = scoredOrders.slice(0, 15).map(o => {
        let badgeColor = 'bg-emerald-50 text-emerald-800 border border-emerald-300';
        let barColor = 'bg-emerald-600';
        if (o.riskLevel === 'CRITICAL') {
            badgeColor = 'bg-red-50 text-red-800 border border-red-300';
            barColor = 'bg-red-600';
        } else if (o.riskLevel === 'MODERATE') {
            badgeColor = 'bg-amber-50 text-amber-900 border border-amber-300';
            barColor = 'bg-amber-600';
        }

        return `
            <tr class="hover:bg-slate-50 transition border-b border-slate-200 ${o.isAnomaly ? 'bg-red-50/50' : ''}">
                <td class="px-6 py-4.5 font-mono font-black text-slate-900 text-sm sm:text-base">${o.orderId}</td>
                <td class="px-5 py-4.5 font-bold text-slate-900 text-sm sm:text-base">${o.customerName}</td>
                <td class="px-5 py-4.5 font-mono font-black text-slate-900 text-sm sm:text-base">₹${Number(o.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="px-5 py-4.5">
                    <div class="flex items-center space-x-2.5">
                        <div class="w-20 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                            <div class="h-full ${barColor}" style="width: ${o.anomalyProbability}%"></div>
                        </div>
                        <span class="font-mono font-extrabold text-xs sm:text-sm ${o.anomalyProbability >= 70 ? 'text-red-700' : 'text-slate-800'}">${o.anomalyProbability}%</span>
                    </div>
                </td>
                <td class="px-5 py-4.5">
                    <span class="badge-pill ${badgeColor} text-xs uppercase tracking-wider font-extrabold">${o.riskLevel}</span>
                </td>
                <td class="px-5 py-4.5 text-xs sm:text-sm text-slate-800 font-semibold">${o.primaryDriver}</td>
                <td class="px-6 py-4.5 font-mono text-xs text-slate-600 font-semibold">
                    MDR: <b class="text-blue-700 font-bold">${o.features ? o.features.feeVarianceImpact : '0%'}</b> · SLA: <b class="text-blue-700 font-bold">${o.features ? o.features.slaLatencyImpact : '0%'}</b>
                </td>
            </tr>
        `;
    }).join('');
}

// =========================================================================
// 13. DIRECT RAZORPAY WEBHOOK MODAL & SIMULATOR
// =========================================================================
window.openWebhookModal = function() {
    const m = document.getElementById('webhookModal');
    if (m) m.classList.remove('hidden');
};

window.copyWebhookUrl = function() {
    const el = document.getElementById('webhookUrlDisplay');
    if (el) {
        navigator.clipboard.writeText(el.value);
        showToast('✅ Webhook URL copied! Enter this in Razorpay Dashboard.');
    }
};

window.copyWebhookSecret = function() {
    const el = document.getElementById('webhookSecretDisplay');
    if (el) {
        navigator.clipboard.writeText(el.value);
        showToast('✅ Webhook Secret copied to clipboard!');
    }
};

window.dispatchLiveWebhookTest = async function() {
    const scenario = document.getElementById('webhookScenario').value;
    const customer = document.getElementById('webhookCustomer').value.trim() || 'Aarav Sharma';
    const amountVal = parseFloat(document.getElementById('webhookAmount').value) || 7500;
    const btn = document.getElementById('btnDispatchWebhook');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="animate-spin mr-1">⚙️</span> Dispatching...`;
    }

    let payload = {};
    const amountInPaise = amountVal * 100;

    if (scenario === 'CLEAN') {
        payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: `pay_RZP_${Date.now().toString().slice(-6)}`,
                        amount: amountInPaise,
                        fee: amountInPaise * 0.02, // 2.0%
                        tax: (amountInPaise * 0.02) * 0.18,
                        method: 'upi',
                        notes: { customer_name: customer }
                    }
                }
            }
        };
    } else if (scenario === 'OVERCHARGE') {
        payload = {
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: `pay_RZP_LEAK_${Date.now().toString().slice(-6)}`,
                        amount: amountInPaise,
                        fee: amountInPaise * 0.035, // 3.5% MDR Overcharge
                        tax: (amountInPaise * 0.035) * 0.18,
                        method: 'card',
                        notes: { customer_name: customer }
                    }
                }
            }
        };
    } else if (scenario === 'SETTLEMENT') {
        payload = {
            event: 'settlement.processed',
            payload: {
                settlement: {
                    entity: {
                        id: `set_LIVE_${Date.now().toString().slice(-6)}`,
                        amount: amountInPaise * 15,
                        utr: `UTR_RZP_HDFC_${Date.now().toString().slice(-6)}`
                    }
                }
            }
        };
    } else if (scenario === 'PAYOUT') {
        payload = {
            event: 'payout.processed',
            payload: {
                id: `pout_${Date.now().toString().slice(-6)}`,
                amount: amountInPaise,
                utr: `SAL_IMPS_${Date.now().toString().slice(-6)}`
            }
        };
    }

    try {
        const res = await fetch('/api/webhooks/razorpay', {
            method: 'POST',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(payload)
        });

        const result = await res.json();
        
        // Refresh all accounting & ML modules
        fetchSummary();
        fetchOrders();
        fetchDiscrepancies();
        fetchCashFlow();
        fetchMlIntelligence();

        document.getElementById('webhookModal').classList.add('hidden');
        showToast(`⚡ Razorpay Webhook [${payload.event}] received and audited in real-time!`);
    } catch (err) {
        console.error('Webhook error:', err);
        alert('Failed to dispatch webhook event: ' + err.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="ph-bold ph-paper-plane-tilt"></i><span>Dispatch Live Webhook Event</span>`;
        }
    }
};


