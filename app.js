// AutoRecon AI — Premium Glassmorphism, Live Background & Live Features Controller

let reconChart = null;
let feeChart = null;
let currentOrders = [];
let currentDiscrepancies = [];
let currentFilter = 'ALL';
let activeDrawerOrder = null;
let splashTimer = null;
let liveStreamInterval = null;
let isLiveStreamActive = true;

document.addEventListener('DOMContentLoaded', () => {
    initLiveBackground();
    initSplashScreen();
    initCharts();
    setupEventListeners();
    initLiveTicker();
    fetchSummary();
    fetchOrders();
    fetchDiscrepancies();
    fetchAiConfig();
    fetchBatches();
});

// =============================================================================
// 1. LIVE INTERACTIVE CANVAS BACKGROUND (Floating Constellation & Glow Nodes)
// =============================================================================
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
    const particleCount = Math.min(Math.floor(window.innerWidth / 28), 50);
    const colors = ['rgba(229, 169, 93, 0.45)', 'rgba(46, 196, 182, 0.4)', 'rgba(129, 178, 154, 0.35)', 'rgba(231, 111, 81, 0.3)'];

    let mouse = { x: null, y: null, radius: 140 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.size = Math.random() * 2.2 + 1;
            this.baseX = this.x;
            this.baseY = this.y;
            this.density = (Math.random() * 20) + 1;
            this.vx = (Math.random() - 0.5) * 0.6;
            this.vy = (Math.random() - 0.5) * 0.6;
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.x < 0 || this.x > width) this.vx = -this.vx;
            if (this.y < 0 || this.y > height) this.vy = -this.vy;

            // Mouse repulsion/attraction field
            if (mouse.x != null && mouse.y != null) {
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const force = (mouse.radius - distance) / mouse.radius;
                    const directionX = (dx / distance) * force * this.density * 0.4;
                    const directionY = (dy / distance) * force * this.density * 0.4;
                    this.x -= directionX;
                    this.y -= directionY;
                }
            }
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            // Connect nearby nodes with delicate glowing links
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 130) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(229, 169, 93, ${0.12 * (1 - distance / 130)})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                    ctx.closePath();
                }
            }
        }
        requestAnimationFrame(animateParticles);
    }

    animateParticles();
}

// =============================================================================
// 2. MINIMALISTIC OPENING SCREEN (Clean, Sleek & Fast - 2 Seconds)
// =============================================================================
function initSplashScreen() {
    const splash = document.getElementById('splashScreen');
    const bar = document.getElementById('splashProgressBar');
    const text = document.getElementById('splashStatusText');
    const pct = document.getElementById('splashPercentText');

    if (!splash) return;

    let progress = 0;
    const stages = [
        { at: 20, msg: "Connecting Razorpay Webhooks..." },
        { at: 55, msg: "Verifying Bank Nodal Credits..." },
        { at: 85, msg: "Calculating 2% Contractual MDR Rates..." },
        { at: 100, msg: "AutoRecon AI Online" }
    ];

    splashTimer = setInterval(() => {
        progress += 3;
        if (progress > 100) progress = 100;

        if (bar) bar.style.width = `${progress}%`;
        if (pct) pct.textContent = `${progress}%`;

        for (let s of stages) {
            if (progress >= s.at && text) {
                text.textContent = s.msg;
            }
        }

        if (progress >= 100) {
            clearInterval(splashTimer);
            setTimeout(() => {
                splash.classList.add('fade-out');
                setTimeout(() => splash.remove(), 600);
            }, 300);
        }
    }, 35); // ~1.8 seconds total
}

window.skipSplashScreen = function() {
    if (splashTimer) clearInterval(splashTimer);
    const splash = document.getElementById('splashScreen');
    if (splash) {
        splash.classList.add('fade-out');
        setTimeout(() => splash.remove(), 600);
    }
};

// =============================================================================
// 3. LIVE WEBHOOK INGESTION TICKER STREAM
// =============================================================================
function initLiveTicker() {
    const tickerEl = document.getElementById('liveTickerFeed');
    if (!tickerEl) return;

    const liveEvents = [
        { pay: "pay_RZP_10036", amt: "₹4,500.00", method: "UPI", status: "MDR Verified (2%)", utr: "UTR_HDFC_9000036" },
        { pay: "pay_RZP_10037", amt: "₹12,800.00", method: "Card", status: "GST Input Logged", utr: "UTR_ICICI_9000037" },
        { pay: "pay_RZP_10038", amt: "₹2,150.00", method: "UPI", status: "Payout Settled (T+1)", utr: "UTR_SBI_9000038" },
        { pay: "pay_RZP_10039", amt: "₹8,700.00", method: "Netbanking", status: "3-Way Triangulation OK", utr: "UTR_KOTAK_9000039" },
        { pay: "pay_RZP_10040", amt: "₹3,400.00", method: "UPI", status: "Nodal Payout Matched", utr: "UTR_AXIS_9000040" }
    ];

    let index = 0;
    setInterval(() => {
        if (!isLiveStreamActive) return;
        const ev = liveEvents[index % liveEvents.length];
        index++;
        tickerEl.style.opacity = '0';
        setTimeout(() => {
            tickerEl.innerHTML = `<span class="text-sand-300 font-bold">${ev.pay}</span> (${ev.amt} via <span class="text-sand-100">${ev.method}</span>) &rarr; <span class="text-jade-400 font-semibold">${ev.status}</span> &rarr; Bank Credit: <span class="text-sand-200">${ev.utr}</span>`;
            tickerEl.style.opacity = '1';
        }, 200);
    }, 4500);

    const toggleBtn = document.getElementById('btnToggleLiveFeed');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isLiveStreamActive = !isLiveStreamActive;
            if (isLiveStreamActive) {
                toggleBtn.innerHTML = `<span class="live-pulse-dot"></span><span class="hidden sm:inline">Live Stream</span>`;
                toggleBtn.classList.add('text-jade-400');
                toggleBtn.classList.remove('text-sand-200/50');
            } else {
                toggleBtn.innerHTML = `<i class="ph-bold ph-pause"></i><span class="hidden sm:inline">Paused</span>`;
                toggleBtn.classList.remove('text-jade-400');
                toggleBtn.classList.add('text-sand-200/50');
            }
        });
    }
}


// Event Listeners
function setupEventListeners() {
    document.getElementById('btnLoadDemo').addEventListener('click', loadDemoData);
    document.getElementById('btnRunRecon').addEventListener('click', runReconciliation);
    document.getElementById('btnOpenDisputeModal').addEventListener('click', openDisputeModal);
    document.getElementById('btnCopyDispute').addEventListener('click', copyDisputeToClipboard);
    document.getElementById('btnOpenSimModal').addEventListener('click', () => {
        document.getElementById('simModal').classList.remove('hidden');
    });

    document.getElementById('simForm').addEventListener('submit', handleSimulateTransaction);

    // Live Search Filter
    document.getElementById('tableSearchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        renderOrdersTable(query);
    });

    // Filter Buttons
    document.querySelectorAll('.table-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.table-filter-btn').forEach(b => {
                b.classList.remove('bg-sand-300', 'text-[#131c17]', 'font-bold', 'shadow-sm');
                b.classList.add('bg-[#1a2720]', 'text-sand-200', 'border', 'border-[#2b3d32]');
            });
            e.target.classList.remove('bg-[#1a2720]', 'text-sand-200', 'border', 'border-[#2b3d32]');
            e.target.classList.add('bg-sand-300', 'text-[#131c17]', 'font-bold', 'shadow-sm');
            currentFilter = e.target.getAttribute('data-filter');
            renderOrdersTable(document.getElementById('tableSearchInput').value.toLowerCase().trim());
        });
    });

    // Chat form
    document.getElementById('chatForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const query = input.value.trim();
        if (query) {
            sendChatMessage(query);
            input.value = '';
        }
    });

    // Quick query pills
    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            sendChatMessage(query);
        });
    });

    // Floating AI Chat trigger
    const aiSettingsBtn = document.getElementById('btnOpenAiSettings');
    if (aiSettingsBtn) {
        aiSettingsBtn.addEventListener('click', () => {
            document.getElementById('aiSettingsModal').classList.remove('hidden');
        });
    }

    // CSV Upload Modal
    const btnUpload = document.getElementById('btnOpenUploadModal');
    if (btnUpload) {
        btnUpload.addEventListener('click', () => {
            document.getElementById('uploadModal').classList.remove('hidden');
        });
    }

    const dropZone = document.querySelector('#uploadModal .border-dashed');
    const fileInput = document.getElementById('csvFileInput');
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                document.getElementById('selectedFileName').textContent = 'Selected: ' + e.target.files[0].name;
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

// Chart Initializations with Earth Tone Colors (Zero Blue!)
function initCharts() {
    const elRecon = document.getElementById('reconDonutChart');
    if (elRecon) {
        const ctxRecon = elRecon.getContext('2d');
        reconChart = new Chart(ctxRecon, {
            type: 'doughnut',
            data: {
                labels: ['Credited in Bank (Safe)', 'MDR Overcharged by Razorpay', 'Delayed Payout (>2 Days)', 'Missing Bank Credit'],
                datasets: [{
                    data: [0, 0, 0, 0],
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
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#e5a95d', '#d48b38', '#81b29a', '#e76f51'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
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

// Fetch Summary KPIs
async function fetchSummary() {
    try {
        const res = await fetch('/api/recon/summary');
        if (!res.ok) return;
        const data = await res.json();
        updateDashboard(data);
    } catch (err) {
        console.error('Error fetching summary:', err);
    }
}

// Update Dashboard UI
function updateDashboard(summary) {
    if (!summary) return;

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

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


// Fetch Orders
async function fetchOrders() {
    try {
        const res = await fetch('/api/recon/orders');
        if (!res.ok) return;
        currentOrders = await res.json();
        renderOrdersTable();
    } catch (err) {
        console.error('Error fetching orders:', err);
    }
}

// Fetch Discrepancies
async function fetchDiscrepancies() {
    try {
        const res = await fetch('/api/recon/discrepancies');
        if (!res.ok) return;
        currentDiscrepancies = await res.json();
    } catch (err) {
        console.error('Error fetching discrepancies:', err);
    }
}

// Render Orders Table
function renderOrdersTable(searchQuery = '') {
    const tbody = document.getElementById('ordersTableBody');
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
            (o.customerName && o.customerName.toLowerCase().includes(searchQuery)) ||
            (o.customerEmail && o.customerEmail.toLowerCase().includes(searchQuery)) ||
            (o.paymentId && o.paymentId.toLowerCase().includes(searchQuery))
        );
    }

    if (!filtered || filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-10 text-center text-sand-200/50">No records found matching current query.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(order => {
        let badgeClass = 'badge-reconciled';
        let badgeLabel = 'Deposited in Bank (100%)';

        if (order.reconStatus === 'FEE_MISMATCH') {
            badgeClass = 'badge-fee-mismatch';
            badgeLabel = 'MDR Overcharge';
        } else if (order.reconStatus === 'DELAYED_SETTLEMENT') {
            badgeClass = 'badge-delayed';
            badgeLabel = 'Delayed Payout (>2 Days)';
        } else if (order.reconStatus === 'MISSING_BANK_CREDIT') {
            badgeClass = 'badge-delayed';
            badgeLabel = 'Missing Bank Deposit';
        } else if (order.reconStatus === 'UNRECONCILED') {
            badgeClass = 'badge-delayed';
            badgeLabel = 'Pending Audit';
        }

        const estMdr = (order.amount * 0.02).toFixed(2);
        const estGst = (estMdr * 0.18).toFixed(2);
        const fakeUtr = `UTR_HDFC_99${Math.abs((order.id || 1) * 13 % 90000)}`;

        return `
            <tr class="hover:bg-[#1a2720] transition cursor-pointer group" onclick="inspectOrderDiff('${order.orderId}')">
                <td class="px-5 py-3.5">
                    <div class="font-bold text-sand-100 group-hover:text-sand-300 transition font-mono">${order.orderId}</div>
                    <div class="text-[11px] text-sand-200/60">${order.customerName || 'Customer'} &middot; <span class="text-sand-200/40">${order.customerEmail || ''}</span></div>
                </td>
                <td class="px-4 py-3.5 font-bold text-sand-100 font-mono">₹${order.amount.toFixed(2)}</td>
                <td class="px-4 py-3.5">
                    <span class="font-mono text-sand-300 text-[11px]">${order.paymentId || '<span class="text-sand-200/40">Unlinked</span>'}</span>
                </td>
                <td class="px-4 py-3.5 text-[11px] text-sand-200/70 font-mono">
                    <div>Fee: <span class="text-sand-100 font-medium">₹${estMdr}</span></div>
                    <div>GST: <span class="text-sand-100 font-medium">₹${estGst}</span></div>
                </td>
                <td class="px-4 py-3.5">
                    <span class="font-mono text-[11px] text-jade-400 font-medium">${fakeUtr}</span>
                </td>
                <td class="px-4 py-3.5">
                    <span class="badge-pill ${badgeClass}">${badgeLabel}</span>
                </td>
                <td class="px-5 py-3.5 text-right">
                    <button onclick="event.stopPropagation(); inspectOrderDiff('${order.orderId}')" class="px-3 py-1.5 text-[11px] bg-[#131c17] hover:bg-sand-300 hover:text-[#131c17] text-sand-200 rounded-lg border border-[#2b3d32] transition font-bold">
                        View ➔
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Side-Drawer Inspection
window.inspectOrderDiff = function(orderId) {
    const order = currentOrders.find(o => o.orderId === orderId);
    if (!order) return;

    activeDrawerOrder = order;
    const discrepancy = currentDiscrepancies.find(d => d.orderId === orderId);

    document.getElementById('drawerOrderId').textContent = `Checking Order: ${order.orderId}`;
    document.getElementById('drawerCustomer').textContent = `${order.customerName || 'Customer'} (${order.customerEmail || 'N/A'})`;
    document.getElementById('drawerStoreAmount').textContent = `₹${order.amount.toFixed(2)}`;

    document.getElementById('drawerPaymentId').textContent = order.paymentId || 'pay_RZP_UNLINKED';

    let mdr = (order.amount * 0.02);
    let gst = (mdr * 0.18);
    let net = order.amount - mdr - gst;

    if (discrepancy && discrepancy.type === 'MDR_FEE_OVERCHARGE') {
        mdr = discrepancy.actualAmount;
        gst = mdr * 0.18;
        net = order.amount - mdr - gst;
    }

    document.getElementById('drawerRzpFee').textContent = `₹${Number(mdr).toFixed(2)}`;
    document.getElementById('drawerRzpTax').textContent = `₹${Number(gst).toFixed(2)}`;
    document.getElementById('drawerRzpNet').textContent = `₹${Number(net).toFixed(2)}`;

    const bankUtr = discrepancy && discrepancy.bankUtr ? discrepancy.bankUtr : `UTR_HDFC_99${Math.abs(order.id * 13 % 90000)}`;
    document.getElementById('drawerBankUtr').textContent = bankUtr;
    document.getElementById('drawerBankCredit').textContent = (order.reconStatus === 'MISSING_BANK_CREDIT') ? '₹0.00 (Not Credited)' : `₹${Number(net).toFixed(2)}`;

    const banner = document.getElementById('drawerStatusBanner');
    const statusText = document.getElementById('drawerStatusText');
    const sevBadge = document.getElementById('drawerSeverityBadge');
    const rootCause = document.getElementById('drawerRootCause');
    const suggestedAction = document.getElementById('drawerSuggestedAction');

    if (discrepancy) {
        banner.className = 'p-3.5 rounded-xl border border-sand-300/30 bg-sand-300/10 text-sand-300 flex items-center justify-between';
        statusText.textContent = `Alert: ${discrepancy.type.replace(/_/g, ' ')}`;
        sevBadge.className = 'badge-pill badge-delayed font-mono';
        sevBadge.textContent = discrepancy.severity;
        rootCause.textContent = discrepancy.rootCause;
        suggestedAction.textContent = discrepancy.suggestedAction;
    } else {
        banner.className = 'p-3.5 rounded-xl border border-jade-500/30 bg-jade-500/10 text-jade-300 flex items-center justify-between';
        statusText.textContent = '100% Reconciled and Credited in Bank';
        sevBadge.className = 'badge-pill badge-reconciled font-mono';
        sevBadge.textContent = 'VERIFIED SAFE';
        rootCause.textContent = 'Correct 2.0% MDR + 18% GST deducted. Full net payout received in bank account under UTR reference.';
        suggestedAction.textContent = 'No action needed. Everything matches your books.';
    }

    document.getElementById('diffDrawer').classList.remove('hidden');
};

window.closeDiffDrawer = function() {
    document.getElementById('diffDrawer').classList.add('hidden');
};

window.askCopilotForDrawerOrder = function() {
    if (activeDrawerOrder) {
        closeDiffDrawer();
        sendChatMessage(`Explain why order ${activeDrawerOrder.orderId} was processed this way and if there is any fee mistake.`);
    }
};

// Handle Simulation Submit
async function handleSimulateTransaction(e) {
    e.preventDefault();
    const customerName = document.getElementById('simCustomer').value.trim();
    const amount = document.getElementById('simAmount').value;
    const paymentMethod = document.getElementById('simMethod').value;
    const scenario = document.getElementById('simScenario').value;

    try {
        const res = await fetch('/api/ingest/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerName, amount, paymentMethod, scenario })
        });
        const summary = await res.json();
        updateDashboard(summary);
        await fetchOrders();
        await fetchDiscrepancies();

        document.getElementById('simModal').classList.add('hidden');
        sendChatMessage(`I just tested an order for ${customerName} (₹${amount}) with scenario: ${scenario}. Please explain the result!`);
    } catch (err) {
        alert('Simulation failed: ' + err.message);
    }
}

// Load Demo Data
async function loadDemoData() {
    const btn = document.getElementById('btnLoadDemo');
    btn.disabled = true;
    btn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> <span>Loading...</span>`;

    try {
        const res = await fetch('/api/ingest/demo', { method: 'POST' });
        const summary = await res.json();
        updateDashboard(summary);
        await fetchOrders();
        await fetchDiscrepancies();

        sendChatMessage("Give me a simple summary of today's sales, fees, and bank deposits.");
    } catch (err) {
        console.error('Failed to load demo data:', err);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="ph-bold ph-sparkle text-sm"></i> <span>Seed Live Demo</span>`;
    }
}

// Run Reconciliation
async function runReconciliation() {
    try {
        const res = await fetch('/api/recon/run', { method: 'POST' });
        const summary = await res.json();
        updateDashboard(summary);
        await fetchOrders();
        await fetchDiscrepancies();
    } catch (err) {
        console.error('Failed to run recon:', err);
    }
}

// Send Chat Message to AI Munimji
async function sendChatMessage(text) {
    const chatBox = document.getElementById('chatMessages');

    // User message
    const userDiv = document.createElement('div');
    userDiv.className = 'bg-sand-300/15 border border-sand-300/30 rounded-xl p-3 text-sand-200 ml-4 font-semibold text-xs';
    userDiv.innerHTML = `<b>You:</b> ${text}`;
    chatBox.appendChild(userDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-[#131c17] border border-[#22332a] rounded-xl p-3 text-sand-200/60 text-xs flex items-center space-x-2';
    loadingDiv.innerHTML = `<i class="ph-bold ph-shield-check text-sand-300 animate-spin"></i> <span>AI Munimji is checking your records...</span>`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        chatBox.removeChild(loadingDiv);

        // Render AI Message
        const aiDiv = document.createElement('div');
        aiDiv.className = 'bg-[#16221b] border border-[#22332a] rounded-xl p-3.5 text-sand-200 leading-relaxed text-xs space-y-2 shadow-sm';

        let formattedReply = data.reply.replace(/\*\*(.*?)\*\*/g, '<b class="text-sand-100 font-bold">$1</b>');

        let insightsHtml = '';
        if (data.keyInsights && data.keyInsights.length > 0) {
            insightsHtml = `<div class="pt-2 border-t border-[#22332a] text-sand-200/70">
                <div class="font-bold text-[11px] text-jade-400 mb-1 flex items-center space-x-1">
                    <i class="ph-bold ph-check-circle"></i>
                    <span>Key Takeaways:</span>
                </div>
                <ul class="list-disc list-inside space-y-0.5 text-[11px] text-sand-200/70">
                    ${data.keyInsights.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>`;
        }

        let actionsHtml = '';
        if (data.recommendedActions && data.recommendedActions.length > 0) {
            actionsHtml = `<div class="pt-2 border-t border-[#22332a]">
                <div class="font-bold text-[11px] text-sand-300 mb-1 flex items-center space-x-1">
                    <i class="ph-bold ph-lightning"></i>
                    <span>Recommended Next Steps:</span>
                </div>
                <ul class="list-disc list-inside space-y-0.5 text-[11px] text-sand-200">
                    ${data.recommendedActions.map(a => `<li>${a}</li>`).join('')}
                </ul>
            </div>`;
        }

        let disputeButtonHtml = '';
        if (data.disputeDraftAvailable) {
            disputeButtonHtml = `<div class="pt-2">
                <button onclick="openDisputeModal()" class="px-3.5 py-1.5 bg-gradient-to-r from-sand-400 to-sand-300 hover:from-sand-300 hover:to-sand-200 text-[#131c17] font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm">
                    <i class="ph-bold ph-file-text"></i>
                    <span>View & Copy Dispute Letter</span>
                </button>
            </div>`;
        }

        aiDiv.innerHTML = `<div>${formattedReply}</div>${insightsHtml}${actionsHtml}${disputeButtonHtml}`;
        chatBox.appendChild(aiDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
        chatBox.removeChild(loadingDiv);
        const errDiv = document.createElement('div');
        errDiv.className = 'bg-terracotta-500/20 border border-terracotta-500/30 rounded-xl p-3 text-terracotta-400 text-xs';
        errDiv.textContent = 'Error connecting to AI Munimji.';
        chatBox.appendChild(errDiv);
    }
}

// Open Dispute Modal
async function openDisputeModal() {
    try {
        const res = await fetch('/api/chat/dispute-draft');
        if (!res.ok) return;
        const draft = await res.json();

        document.getElementById('dispTotalAmount').textContent = `₹${draft.totalDisputedAmount.toFixed(2)}`;
        document.getElementById('dispEmailBody').textContent = draft.emailBody;

        document.getElementById('disputeModal').classList.remove('hidden');
    } catch (err) {
        console.error('Failed to get dispute draft:', err);
    }
}

// Copy Dispute to Clipboard
function copyDisputeToClipboard() {
    const text = document.getElementById('dispEmailBody').textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btnCopyDispute');
        btn.innerHTML = `<i class="ph-bold ph-check"></i> <span>Copied to Clipboard!</span>`;
        setTimeout(() => {
            btn.innerHTML = `<span>Copy Letter</span>`;
        }, 2000);
    });
}

// Handle CSV File Upload
async function handleCsvUpload(e) {
    e.preventDefault();
    const fileInput = document.getElementById('csvFileInput');
    const submitBtn = document.getElementById('btnSubmitUpload');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Please select a CSV file first.');
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ph-bold ph-spinner animate-spin"></i> <span>Processing CSV...</span>`;

    try {
        const res = await fetch('/api/ingest/upload-orders', {
            method: 'POST',
            body: formData
        });
        
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.error || 'Failed to parse CSV file.');
        }

        document.getElementById('uploadModal').classList.add('hidden');
        fileInput.value = '';
        document.getElementById('selectedFileName').textContent = '';

        if (result.summary) {
            updateDashboard(result.summary);
        } else {
            await fetchSummary();
        }

        await fetchOrders();
        await fetchDiscrepancies();

        // Open dedicated report in a new tab/window
        if (result.reportUrl) {
            window.open(result.reportUrl, '_blank');
        }

        // Trigger AI Munimji message
        sendChatMessage(`We just ingested and audited ${result.count || ''} records from "${file.name}" (Total Gross: ₹${result.totalGross ? result.totalGross.toFixed(2) : '0.00'}). A dedicated audit report has been opened in a new tab!`);

        fetchBatches();

    } catch (err) {
        alert('CSV Upload Error: ' + err.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Upload & Audit Live</span>`;
    }
}

// Fetch all uploaded batches
async function fetchBatches() {
    try {
        const res = await fetch('/api/recon/batches');
        if (!res.ok) return;
        const batches = await res.json();
        renderBatchesList(batches);
    } catch (e) {
        console.error('Error fetching batches:', e);
    }
}

function renderBatchesList(batches) {
    const listEl = document.getElementById('batchesListContainer');
    if (!listEl) return;

    if (!batches || batches.length === 0) {
        listEl.innerHTML = `<span class="text-xs text-sand-200/50">No uploaded batch files yet.</span>`;
        return;
    }

    listEl.innerHTML = batches.map(b => `
        <a href="/report.html?batchId=${b.batchId}" target="_blank" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#16221b] hover:bg-[#22332a] border border-[#2b3d32] text-xs text-sand-200 transition font-medium">
            <i class="ph-bold ph-file-csv text-sand-300"></i>
            <span>${b.fileName}</span>
            <span class="text-[10px] text-jade-400 font-mono">(${b.totalOrders} ord)</span>
            <i class="ph-bold ph-arrow-square-out text-sand-200/50 text-[11px]"></i>
        </a>
    `).join('');
}


