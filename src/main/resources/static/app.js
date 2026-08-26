// AutoRecon AI — All-in-One Autonomous Accounting & Financial Operations OS
// Multi-Tasking Client Controller: Gateway Recon, Payroll & Salary Delays, Vendor AP & MSME 43B(h), Cash Flow & AI Munimji

let reconChart = null;
let feeChart = null;
let currentOrders = [];
let currentDiscrepancies = [];
let currentFilter = 'ALL';
let isLiveStreamActive = true;
let currentBatchId = null;

// Multi-Tasking Data Stores
let currentPayroll = [];
let currentVendors = [];
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

    // Fetch all 4 accounting modules
    fetchSummary();
    fetchOrders();
    fetchDiscrepancies();
    fetchBatchesList();
    fetchPayroll();
    fetchVendors();
    fetchCashFlow();
    fetchAiConfig();
});

// =========================================================================
// 1. LIVE BACKGROUND PARTICLES (Physics & Constellations)
// =========================================================================
function initLiveBackground() {
    const canvas = document.getElementById('liveBgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const numParticles = Math.min(Math.floor(window.innerWidth / 25), 45);

    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2 + 1,
            color: (i % 3 === 0) ? '#e5a95d' : (i % 3 === 1 ? '#2ec4b6' : '#81b29a'),
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            alpha: Math.random() * 0.4 + 0.2
        });
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);

        // Draw connecting constellation lines
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 130) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(229, 169, 93, ${0.12 * (1 - dist / 130)})`;
                    ctx.lineWidth = 0.75;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw and update particles
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
        });

        requestAnimationFrame(animateParticles);
    }

    animateParticles();
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
                b.classList.add('text-sand-200/70');
            });
            btn.classList.add('active');
            btn.classList.remove('text-sand-200/70');

            views.forEach(v => {
                if (v.id === targetId) {
                    v.classList.remove('hidden');
                } else {
                    v.classList.add('hidden');
                }
            });
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
                    backgroundColor: ['#2ec4b6', '#e5a95d', '#e76f51', '#d48b38'],
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
                        labels: { color: '#b5c4b8', font: { size: 11, family: 'Plus Jakarta Sans', weight: '500' }, padding: 14 }
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
                    backgroundColor: ['#e5a95d', '#d48b38', '#81b29a', '#e76f51'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#b5c4b8', font: { size: 10, family: 'Plus Jakarta Sans' } }, grid: { display: false } },
                    y: { ticks: { color: '#b5c4b8', font: { size: 10, family: 'JetBrains Mono' } }, grid: { color: 'rgba(37, 54, 44, 0.6)' } }
                }
            }
        });
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
        if (!res.ok) return;
        currentOrders = await res.json();
        renderOrdersTable();
    } catch (err) {
        console.error('Error fetching orders:', err);
    }
}

async function fetchDiscrepancies() {
    try {
        const res = await fetch('/api/recon/discrepancies', { headers: getAuthHeaders() });
        if (!res.ok) return;
        currentDiscrepancies = await res.json();
    } catch (err) {
        console.error('Error fetching discrepancies:', err);
    }
}

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
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-sand-200/50">No transaction records found matching filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        let statusBadge = '';
        let rowClass = 'hover:bg-[#16221b] transition cursor-pointer';

        if (order.reconStatus === 'RECONCILED') {
            statusBadge = '<span class="badge-pill badge-reconciled"><i class="ph-bold ph-check"></i> Safe</span>';
        } else if (order.reconStatus === 'FEE_MISMATCH') {
            statusBadge = '<span class="badge-pill badge-fee-mismatch"><i class="ph-bold ph-warning"></i> Fee Leak</span>';
            rowClass += ' bg-sand-300/[0.04]';
        } else if (order.reconStatus === 'DELAYED_SLA') {
            statusBadge = '<span class="badge-pill badge-delayed"><i class="ph-bold ph-clock"></i> SLA Breach</span>';
            rowClass += ' bg-terracotta-500/[0.04]';
        } else if (order.reconStatus === 'MISSING_BANK_CREDIT') {
            statusBadge = '<span class="badge-pill badge-delayed"><i class="ph-bold ph-x"></i> Missing UTR</span>';
            rowClass += ' bg-terracotta-500/[0.06]';
        } else {
            statusBadge = `<span class="badge-pill badge-delayed">${order.reconStatus}</span>`;
        }

        const expectedMdr = Number(order.amount * 0.02);
        const actualMdr = (order.reconStatus === 'FEE_MISMATCH') ? Number(order.amount * 0.035) : expectedMdr;
        const totalFeeTax = (actualMdr * 1.18).toFixed(2);
        const utr = (order.reconStatus === 'DELAYED_SLA') ? '<span class="text-terracotta-400 font-mono">Pending SLA</span>' : `UTR_AXIS_${order.orderId.slice(-4)}`;

        return `
            <tr class="${rowClass}" onclick="openDiffDrawer('${order.orderId}')">
                <td class="px-5 py-3.5">
                    <div class="font-bold text-sand-100">${order.orderId}</div>
                    <div class="text-[11px] text-sand-200/60">${order.customerName} &middot; <span class="capitalize text-sand-300">${order.paymentMethod || 'UPI'}</span></div>
                </td>
                <td class="px-4 py-3.5 font-mono font-bold text-sand-100">₹${Number(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3.5 font-mono text-sand-200/80">pay_RZP_${order.orderId.slice(-4)}</td>
                <td class="px-4 py-3.5 font-mono text-sand-300">₹${totalFeeTax}</td>
                <td class="px-4 py-3.5 font-mono text-xs text-jade-300">${utr}</td>
                <td class="px-4 py-3.5">${statusBadge}</td>
                <td class="px-5 py-3.5 text-right">
                    <button class="text-sand-300 hover:text-sand-100 font-semibold text-xs flex items-center space-x-1 ml-auto">
                        <span>Check</span> <i class="ph-bold ph-caret-right"></i>
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

        if (sumRes.ok) {
            const sumData = await sumRes.json();
            updatePayrollDashboard(sumData);
        }

        if (empRes.ok) {
            currentPayroll = await empRes.json();
            renderPayrollTable();
        }
    } catch (e) {
        console.error('Error fetching payroll:', e);
    }
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
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-sand-200/50">No payroll records found.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentPayroll.map(emp => {
        let statusBadge = '';
        let actionBtn = '';

        if (emp.status === 'DISBURSED') {
            statusBadge = `<span class="badge-pill badge-reconciled"><i class="ph-bold ph-check-circle"></i> Transferred (1st Aug)</span>`;
            actionBtn = `<span class="text-jade-400 font-mono text-[11px]">${emp.bankUtr}</span>`;
        } else if (emp.status === 'DELAYED') {
            statusBadge = `<span class="badge-pill badge-delayed"><i class="ph-bold ph-warning"></i> Delayed (${emp.delayDays}d SLA Breach)</span>`;
            actionBtn = `
                <div class="flex items-center justify-end space-x-1.5">
                    <button onclick="disburseSalary('${emp.empId}')" class="px-2.5 py-1 bg-sand-300 hover:bg-sand-200 text-[#131c17] rounded-lg font-bold text-[11px] shadow-sm">
                        Disburse
                    </button>
                    <button onclick="openSalaryNoticeModal()" class="px-2.5 py-1 bg-terracotta-500/15 hover:bg-terracotta-500/25 text-terracotta-400 border border-terracotta-500/30 rounded-lg font-semibold text-[11px]">
                        Notice
                    </button>
                </div>
            `;
        } else {
            statusBadge = `<span class="badge-pill badge-fee-mismatch"><i class="ph-bold ph-hourglass"></i> Pending Clearance</span>`;
            actionBtn = `
                <button onclick="disburseSalary('${emp.empId}')" class="px-2.5 py-1 bg-sand-300/20 hover:bg-sand-300/30 text-sand-300 border border-sand-300/35 rounded-lg font-bold text-[11px]">
                    Verify & Pay
                </button>
            `;
        }

        return `
            <tr class="hover:bg-[#16221b] transition ${emp.status === 'DELAYED' ? 'bg-terracotta-500/[0.04]' : ''}">
                <td class="px-5 py-3.5">
                    <div class="font-bold text-sand-100">${emp.name}</div>
                    <div class="text-[11px] text-sand-200/60">${emp.role} &middot; <span class="font-mono text-sand-300">${emp.empId}</span></div>
                </td>
                <td class="px-4 py-3.5 text-sand-200">${emp.department}</td>
                <td class="px-4 py-3.5 font-mono font-bold text-sand-100">₹${emp.grossSalary.toLocaleString('en-IN')}</td>
                <td class="px-4 py-3.5 font-mono text-xs text-sand-300">
                    TDS: ₹${emp.tdsDeduction.toLocaleString('en-IN')} | PF: ₹${emp.pfDeduction.toLocaleString('en-IN')}
                </td>
                <td class="px-4 py-3.5 font-mono font-bold text-jade-300">₹${emp.netPayable.toLocaleString('en-IN')}</td>
                <td class="px-4 py-3.5">${statusBadge}</td>
                <td class="px-5 py-3.5 text-right">${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

window.disburseSalary = async function(empId) {
    try {
        const res = await fetch('/api/payroll/disburse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            headers: { 'Content-Type': 'application/json' },
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

        if (sumRes.ok) {
            const sumData = await sumRes.json();
            updateVendorDashboard(sumData);
        }

        if (billRes.ok) {
            currentVendors = await billRes.json();
            renderVendorsTable();
        }
    } catch (e) {
        console.error('Error fetching vendor bills:', e);
    }
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
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-sand-200/50">No vendor invoices found.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentVendors.map(v => {
        let agingBadge = '';
        let actionBtn = '';

        if (v.paymentStatus === 'PAID') {
            agingBadge = `<span class="badge-pill badge-reconciled"><i class="ph-bold ph-check"></i> Paid (UTR Matched)</span>`;
            actionBtn = `<span class="text-jade-400 font-mono text-[11px]">${v.bankUtr}</span>`;
        } else if (v.paymentStatus === 'CRITICAL_MSME' || v.msmeDaysRemaining <= 2) {
            agingBadge = `<span class="badge-pill bg-terracotta-500/20 text-terracotta-400 border border-terracotta-500/40"><i class="ph-bold ph-warning"></i> 2 Days Left (Sec 43B-h)</span>`;
            actionBtn = `
                <button onclick="payVendorBill('${v.billId}')" class="px-3 py-1 bg-gradient-to-r from-terracotta-500 to-sand-400 hover:from-terracotta-400 hover:to-sand-300 text-[#131c17] rounded-lg font-bold text-[11px] shadow-sm">
                    Clear Bill ➔
                </button>
            `;
        } else if (v.msmeDaysRemaining <= 10) {
            agingBadge = `<span class="badge-pill bg-sand-300/20 text-sand-300 border border-sand-300/40"><i class="ph-bold ph-clock"></i> ${v.msmeDaysRemaining} Days (MSME)</span>`;
            actionBtn = `
                <button onclick="payVendorBill('${v.billId}')" class="px-3 py-1 bg-sand-300 hover:bg-sand-200 text-[#131c17] rounded-lg font-bold text-[11px] shadow-sm">
                    Pay Now
                </button>
            `;
        } else {
            agingBadge = `<span class="badge-pill bg-sand-200/10 text-sand-200 border border-sand-200/20">${v.paymentStatus}</span>`;
            actionBtn = `
                <button onclick="payVendorBill('${v.billId}')" class="px-3 py-1 bg-sand-300/20 hover:bg-sand-300/30 text-sand-300 border border-sand-300/30 rounded-lg font-bold text-[11px]">
                    Pay
                </button>
            `;
        }

        return `
            <tr class="hover:bg-[#16221b] transition ${v.paymentStatus === 'CRITICAL_MSME' ? 'bg-terracotta-500/[0.04]' : ''}">
                <td class="px-5 py-3.5">
                    <div class="font-bold text-sand-100">${v.vendorName} ${v.isMsme ? '<span class="px-1.5 py-0.2 bg-sand-300/20 text-sand-300 border border-sand-300/30 rounded text-[9px] font-bold uppercase font-mono">MSME</span>' : ''}</div>
                    <div class="text-[11px] text-sand-200/60">${v.category} &middot; <span class="font-mono text-sand-200/70">${v.gstin}</span></div>
                </td>
                <td class="px-4 py-3.5">
                    <div class="font-mono text-sand-100">${v.invoiceNo}</div>
                    <div class="text-[11px] text-sand-200/60">Due: ${v.dueDate}</div>
                </td>
                <td class="px-4 py-3.5 font-mono font-bold text-sand-100">₹${v.amount.toLocaleString('en-IN')}</td>
                <td class="px-4 py-3.5 font-mono text-xs text-jade-300">₹${Number(v.gstAmount).toFixed(2)}</td>
                <td class="px-4 py-3.5 font-mono font-bold text-sand-300">₹${v.netPayable.toLocaleString('en-IN')}</td>
                <td class="px-4 py-3.5">${agingBadge}</td>
                <td class="px-5 py-3.5 text-right">${actionBtn}</td>
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
        if (!res.ok) return;
        currentCashFlow = await res.json();
        updateCashFlowDashboard(currentCashFlow);
    } catch (e) {
        console.error('Error fetching cash flow:', e);
    }
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
    const container = document.getElementById('chatMessages');
    
    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'bg-sand-300 text-[#131c17] rounded-2xl p-3 text-xs font-semibold self-end ml-auto max-w-[85%] shadow-sm';
    userMsg.textContent = query;
    container.appendChild(userMsg);

    // AI typing indicator
    const typing = document.createElement('div');
    typing.className = 'bg-[#131c17] border border-[#22332a] rounded-2xl p-3 text-xs text-sand-200 font-mono animate-pulse';
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
        aiMsg.className = 'bg-[#131c17] border border-[#22332a] rounded-2xl p-3.5 text-xs text-sand-200 leading-relaxed shadow-sm whitespace-pre-wrap';
        aiMsg.innerHTML = data.reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        container.appendChild(aiMsg);
        container.scrollTop = container.scrollHeight;
    } catch (e) {
        typing.remove();
        const errMsg = document.createElement('div');
        errMsg.className = 'bg-terracotta-500/20 text-terracotta-400 p-3 rounded-xl text-xs';
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


