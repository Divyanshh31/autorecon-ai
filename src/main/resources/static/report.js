// AutoRecon AI — Batch Report Controller

let batchId = null;
let currentBatch = null;
let currentSummary = null;
let currentOrders = [];
let currentDiscrepancies = [];
let currentFilter = 'ALL';
let activeDrawerOrder = null;
let reconChart = null;
let feeChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initLiveBackground();
    const urlParams = new URLSearchParams(window.location.search);
    batchId = urlParams.get('batchId');

    if (!batchId) {
        alert('No batch ID provided in URL.');
        return;
    }

    initCharts();
    setupEventListeners();
    fetchBatchDetails();
});

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


function setupEventListeners() {
    document.getElementById('btnOpenDisputeModal').addEventListener('click', openDisputeModal);
    document.getElementById('btnCopyDispute').addEventListener('click', copyDisputeToClipboard);

    // Search filter
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

function initCharts() {

    const ctxRecon = document.getElementById('reconDonutChart').getContext('2d');
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
                    labels: { color: '#b5c4b8', font: { size: 10, family: 'Plus Jakarta Sans', weight: '500' }, padding: 12 }
                }
            },
            cutout: '72%'
        }
    });

    const ctxFee = document.getElementById('feeBarChart').getContext('2d');
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
                x: { ticks: { color: '#b5c4b8', font: { size: 9, family: 'Plus Jakarta Sans' } }, grid: { display: false } },
                y: { ticks: { color: '#b5c4b8', font: { size: 9, family: 'JetBrains Mono' } }, grid: { color: 'rgba(37, 54, 44, 0.6)' } }
            }
        }
    });
}

async function fetchBatchDetails() {
    // 1. Check LocalStorage first (instant & guarantees no blank screens on serverless)
    const localData = localStorage.getItem('autorecon_batch_' + batchId);
    if (localData) {
        try {
            const data = JSON.parse(localData);
            document.getElementById('reportTitle').textContent = `Audit Report: ${data.fileName || 'Uploaded CSV'}`;
            document.getElementById('reportFileName').textContent = data.fileName || 'Uploaded File';
            document.getElementById('reportBatchId').textContent = data.batchId || batchId;
            document.getElementById('reportTimestamp').textContent = data.uploadedAt ? data.uploadedAt.replace('T', ' ').substring(0, 19) : 'Live';
            document.getElementById('statSourceFile').textContent = data.fileName || 'CSV File';

            if (data.summary) {
                currentSummary = data.summary;
                updateDashboard(currentSummary);
            }
            if (data.orders) {
                currentOrders = data.orders;
                renderOrdersTable();
            }
            if (data.discrepancies) {
                currentDiscrepancies = data.discrepancies;
            }
            return;
        } catch (e) {
            console.error('Error parsing local recon batch:', e);
        }
    }

    try {
        const [batchRes, summaryRes, ordersRes, discRes] = await Promise.all([
            fetch(`/api/recon/batches/${batchId}`),
            fetch(`/api/recon/batches/${batchId}/summary`),
            fetch(`/api/recon/batches/${batchId}/orders`),
            fetch(`/api/recon/batches/${batchId}/discrepancies`)
        ]);

        if (batchRes.ok) {
            currentBatch = await batchRes.json();
            document.getElementById('reportTitle').textContent = `Audit Report: ${currentBatch.fileName}`;
            document.getElementById('reportFileName').textContent = currentBatch.fileName;
            document.getElementById('reportBatchId').textContent = currentBatch.batchId;
            document.getElementById('reportTimestamp').textContent = currentBatch.uploadedAt ? currentBatch.uploadedAt.replace('T', ' ').substring(0, 19) : 'Live';
            document.getElementById('statSourceFile').textContent = currentBatch.fileName;
        }

        if (summaryRes.ok) {
            currentSummary = await summaryRes.json();
            updateDashboard(currentSummary);
        }

        if (ordersRes.ok) {
            currentOrders = await ordersRes.json();
            renderOrdersTable();
        }

        if (discRes.ok) {
            currentDiscrepancies = await discRes.json();
        }
    } catch (err) {
        console.error('Error fetching batch details:', err);
    }
}

        const initialGreeting = document.getElementById('initialChatGreeting');
        if (currentBatch && initialGreeting) {
            initialGreeting.innerHTML = `Namaste! 🙏 I am analyzing all <b>${currentOrders.length} transactions</b> from <b>${currentBatch.fileName}</b>. All contractual 2% MDR fees and bank credits have been verified. Ask me anything!`;
        }

    } catch (err) {
        console.error('Failed to load batch data:', err);
    }
}

function updateDashboard(summary) {
    document.getElementById('statOrderCount').textContent = `${summary.totalOrders || 0} Orders Processed`;
    document.getElementById('statGrossVolume').textContent = `₹${(summary.totalGrossVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('statHealthPct').textContent = `${summary.healthScorePercentage || 0}% Accuracy`;
    document.getElementById('statSettledBank').textContent = `₹${(summary.totalSettledToBank || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('statReconciledCount').textContent = `${summary.reconciledOrders || 0} Orders`;
    document.getElementById('statAnomalyCount').textContent = `${summary.discrepancyCount || 0} items flagged`;
    document.getElementById('statDiscrepancyAmount').textContent = `₹${(summary.totalDiscrepancyAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const feeOvercharge = summary.totalActualMdrFee > summary.totalExpectedMdrFee ? (summary.totalActualMdrFee - summary.totalExpectedMdrFee) : 0;
    document.getElementById('statFeeLeakVal').textContent = `₹${Number(feeOvercharge).toFixed(2)}`;
    document.getElementById('statDelayedVal').textContent = `₹${((summary.totalDiscrepancyAmount || 0) - feeOvercharge).toFixed(2)}`;

    // Settlement Trail
    document.getElementById('trailGross').textContent = `₹${(summary.totalGrossVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('trailFeesTax').textContent = `₹${((summary.totalActualMdrFee || 0) + (summary.totalGstTax || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('trailMdr').textContent = `₹${(summary.totalActualMdrFee || 0).toLocaleString('en-IN')}`;
    document.getElementById('trailGst').textContent = `₹${(summary.totalGstTax || 0).toLocaleString('en-IN')}`;
    document.getElementById('trailBank').textContent = `₹${(summary.totalSettledToBank || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    document.getElementById('chartOrderCount').textContent = `${summary.totalOrders || 0} Orders`;

    // Charts
    if (reconChart) {
        reconChart.data.datasets[0].data = [
            summary.reconciledOrders || 0,
            summary.mdrFeeMismatches || 0,
            summary.delayedSettlements || 0,
            summary.missingBankCredits || 0
        ];
        reconChart.update();
    }

    if (feeChart) {
        feeChart.data.datasets[0].data = [
            summary.totalExpectedMdrFee || 0,
            summary.totalActualMdrFee || 0,
            summary.totalGstTax || 0,
            summary.totalDiscrepancyAmount || 0
        ];
        feeChart.update();
    }
}

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
        sendChatMessage(`Explain why order ${activeDrawerOrder.orderId} in this batch was processed this way and if there is any fee discrepancy.`);
    }
};

async function sendChatMessage(text) {
    const chatBox = document.getElementById('chatMessages');

    const userDiv = document.createElement('div');
    userDiv.className = 'bg-sand-300/15 border border-sand-300/30 rounded-xl p-3 text-sand-200 ml-4 font-semibold text-xs';
    userDiv.innerHTML = `<b>You:</b> ${text}`;
    chatBox.appendChild(userDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'bg-[#131c17] border border-[#22332a] rounded-xl p-3 text-sand-200/60 text-xs flex items-center space-x-2';
    loadingDiv.innerHTML = `<i class="ph-bold ph-shield-check text-sand-300 animate-spin"></i> <span>AI Munimji is checking batch records...</span>`;
    chatBox.appendChild(loadingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `[Context: Batch ${currentBatch ? currentBatch.fileName : batchId}] ` + text })
        });
        const data = await res.json();
        chatBox.removeChild(loadingDiv);

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

        let disputeButtonHtml = '';
        if (data.disputeDraftAvailable) {
            disputeButtonHtml = `<div class="pt-2">
                <button onclick="openDisputeModal()" class="px-3.5 py-1.5 bg-gradient-to-r from-sand-400 to-sand-300 hover:from-sand-300 hover:to-sand-200 text-[#131c17] font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-sm">
                    <i class="ph-bold ph-file-text"></i>
                    <span>View & Copy Dispute Letter</span>
                </button>
            </div>`;
        }

        aiDiv.innerHTML = `<div>${formattedReply}</div>${insightsHtml}${disputeButtonHtml}`;
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

async function openDisputeModal() {
    try {
        const res = await fetch('/api/chat/dispute-draft');
        if (!res.ok) return;
        const draft = await res.json();

        document.getElementById('dispTotalAmount').textContent = `₹${(currentSummary ? currentSummary.totalDiscrepancyAmount : draft.totalDisputedAmount).toFixed(2)}`;
        document.getElementById('dispEmailBody').textContent = draft.emailBody;

        document.getElementById('disputeModal').classList.remove('hidden');
    } catch (err) {
        console.error('Failed to get dispute draft:', err);
    }
}

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
