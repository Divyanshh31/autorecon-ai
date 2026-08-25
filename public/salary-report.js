// AutoRecon AI — Dedicated Employee Salary & Payroll Audit Report Controller
// Features: Distinctive Sapphire Cosmic Background, Real-time CSV Column Parser & TDS Calculator

let batchId = null;
let currentBatch = null;
let currentEmployees = [];
let salaryDonutChart = null;
let salaryTierBarChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initLiveSalaryBackground();
    const urlParams = new URLSearchParams(window.location.search);
    batchId = urlParams.get('batchId');

    if (!batchId) {
        alert('No salary batch ID provided.');
        return;
    }

    initSalaryCharts();
    setupSalaryEventListeners();
    loadSalaryBatchData();
});

// =========================================================================
// 1. DISTINCTIVE SAPPHIRE & GOLDEN COSMIC LIVE BACKGROUND
// =========================================================================
function initLiveSalaryBackground() {
    const canvas = document.getElementById('liveSalaryCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const stars = [];
    const numStars = Math.min(Math.floor(window.innerWidth / 20), 65);
    const starColors = ['#38bdf8', '#818cf8', '#e5a95d', '#48e5c2', '#c084fc'];

    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 2.2 + 0.8,
            color: starColors[i % starColors.length],
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            alpha: Math.random() * 0.6 + 0.3
        });
    }

    function animateStars() {
        ctx.clearRect(0, 0, width, height);

        // Connecting constellation lines
        for (let i = 0; i < stars.length; i++) {
            for (let j = i + 1; j < stars.length; j++) {
                const dx = stars[i].x - stars[j].x;
                const dy = stars[i].y - stars[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 140) {
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 140)})`;
                    ctx.lineWidth = 0.8;
                    ctx.moveTo(stars[i].x, stars[i].y);
                    ctx.lineTo(stars[j].x, stars[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw stars
        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.alpha;
            ctx.fill();
            ctx.globalAlpha = 1;

            s.x += s.vx;
            s.y += s.vy;

            if (s.x < 0 || s.x > width) s.vx *= -1;
            if (s.y < 0 || s.y > height) s.vy *= -1;
        });

        requestAnimationFrame(animateStars);
    }

    animateStars();
}

// =========================================================================
// 2. LOAD SALARY BATCH DATA (Local Storage First + API Fallback)
// =========================================================================
function loadSalaryBatchData() {
    // 1. Check localStorage first (instant & guarantees no blank screens on serverless)
    const localData = localStorage.getItem('autorecon_salary_' + batchId);
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            populateSalaryReport(parsed);
            return;
        } catch (e) {
            console.error('Error parsing local salary batch data:', e);
        }
    }

    // 2. Fallback: Fetch from API
    fetch(`/api/payroll/batches/${batchId}`)
        .then(res => res.json())
        .then(data => populateSalaryReport(data))
        .catch(err => console.error('Error fetching salary batch:', err));
}

function populateSalaryReport(data) {
    if (!data) return;
    currentBatch = data;
    currentEmployees = data.employees || [];

    document.getElementById('reportTitle').textContent = `Salary Audit: ${data.fileName || 'Uploaded CSV'}`;
    document.getElementById('reportFileName').textContent = data.fileName || 'Uploaded Salary CSV';
    document.getElementById('reportBatchId').textContent = data.batchId || batchId;
    document.getElementById('reportTimestamp').textContent = data.uploadedAt ? data.uploadedAt.replace('T', ' ').substring(0, 19) : 'Live';
    document.getElementById('statSourceFile').textContent = data.fileName || 'Salary CSV';

    // Calculate totals
    const totalGross = currentEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const totalTds = currentEmployees.reduce((sum, e) => sum + (e.tds || 0), 0);
    const totalPf = currentEmployees.reduce((sum, e) => sum + (e.pf || 0), 0);
    const totalNet = currentEmployees.reduce((sum, e) => sum + (e.netPayable || 0), 0);

    const disbursed = currentEmployees.filter(e => e.status === 'PAID');
    const delayed = currentEmployees.filter(e => e.status === 'DELAYED');
    const pending = currentEmployees.filter(e => e.status === 'PENDING');

    const totalDisbursedAmount = disbursed.reduce((sum, e) => sum + e.netPayable, 0);
    const totalDelayedAmount = delayed.reduce((sum, e) => sum + e.netPayable, 0);
    const totalPendingAmount = pending.reduce((sum, e) => sum + e.netPayable, 0);

    // Update KPI Tiles
    document.getElementById('statGrossSalary').textContent = `₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('statEmpCount').textContent = `${currentEmployees.length} Employees Ingested`;
    document.getElementById('statTdsWithheld').textContent = `₹${totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('statTotalDisbursed').textContent = `₹${totalDisbursedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('statDisbursedEmpCount').textContent = `${disbursed.length} of ${currentEmployees.length} Transferred`;
    document.getElementById('statDelayedAmount').textContent = `₹${totalDelayedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('statDelayedEmpCount').textContent = `${delayed.length} Employees Overdue`;
    document.getElementById('statPendingAmount').textContent = `₹${totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Settlement Trail
    document.getElementById('trailGrossSalary').textContent = `₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('trailDeductions').textContent = `₹${(totalTds + totalPf).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('trailTds').textContent = `₹${totalTds.toLocaleString('en-IN')}`;
    document.getElementById('trailPf').textContent = `₹${totalPf.toLocaleString('en-IN')}`;
    document.getElementById('trailNetPayable').textContent = `₹${totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById('chartEmpCount').textContent = `${currentEmployees.length} Employees`;

    // Update Charts
    if (salaryDonutChart) {
        salaryDonutChart.data.datasets[0].data = [disbursed.length, delayed.length, pending.length];
        salaryDonutChart.update();
    }

    if (salaryTierBarChart) {
        const tierHigh = currentEmployees.filter(e => e.salary >= 100000).length;
        const tierMid = currentEmployees.filter(e => e.salary >= 50000 && e.salary < 100000).length;
        const tierLow = currentEmployees.filter(e => e.salary < 50000).length;
        salaryTierBarChart.data.datasets[0].data = [tierHigh, tierMid, tierLow];
        salaryTierBarChart.update();
    }

    renderSalaryTable();
}

// =========================================================================
// 3. RENDER SALARY TABLE
// =========================================================================
function renderSalaryTable() {
    const tbody = document.getElementById('salaryTableBody');
    if (!tbody) return;

    if (currentEmployees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-5 py-8 text-center text-sand-200/50">No employee records in this file.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentEmployees.map(emp => {
        let statusBadge = '';
        let actionBtn = '';

        if (emp.status === 'PAID') {
            statusBadge = `<span class="badge-pill badge-reconciled"><i class="ph-bold ph-check-circle"></i> Transferred (IMPS)</span>`;
            actionBtn = `<span class="text-jade-400 font-mono text-[11px]">${emp.utr}</span>`;
        } else if (emp.status === 'DELAYED') {
            statusBadge = `<span class="badge-pill badge-delayed"><i class="ph-bold ph-warning"></i> Delayed (Overdue)</span>`;
            actionBtn = `
                <div class="flex items-center justify-end space-x-1.5">
                    <button onclick="disburseEmployeeSalary('${emp.id}')" class="px-2.5 py-1 bg-gradient-to-r from-sand-400 to-sand-300 hover:from-sand-300 hover:to-sand-200 text-[#131c17] rounded-lg font-bold text-[11px] shadow-sm">
                        Disburse
                    </button>
                    <button onclick="openSalaryNoticeModal()" class="px-2.5 py-1 bg-terracotta-500/15 text-terracotta-400 border border-terracotta-500/30 rounded-lg font-semibold text-[11px]">
                        Notice
                    </button>
                </div>
            `;
        } else {
            statusBadge = `<span class="badge-pill badge-fee-mismatch"><i class="ph-bold ph-hourglass"></i> Pending Clearance</span>`;
            actionBtn = `
                <button onclick="disburseEmployeeSalary('${emp.id}')" class="px-2.5 py-1 bg-sand-300/20 hover:bg-sand-300/30 text-sand-300 border border-sand-300/35 rounded-lg font-bold text-[11px]">
                    Pay Now
                </button>
            `;
        }

        return `
            <tr class="hover:bg-[#16221b] transition ${emp.status === 'DELAYED' ? 'bg-terracotta-500/[0.04]' : ''}">
                <td class="px-5 py-3.5">
                    <div class="font-bold text-sand-100">${emp.fullName}</div>
                    <div class="text-[11px] text-sand-200/60">${emp.city || 'India'} &middot; Joined: <span class="font-mono text-sand-300">${emp.joined || '2024'}</span></div>
                </td>
                <td class="px-4 py-3.5 font-mono text-xs text-sand-200/80">${emp.email || '--'}</td>
                <td class="px-4 py-3.5 font-mono font-bold text-sand-100">₹${Number(emp.salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3.5 font-mono text-xs text-sand-300">
                    TDS: ₹${Number(emp.tds).toFixed(2)} | PF: ₹${Number(emp.pf).toFixed(2)}
                </td>
                <td class="px-4 py-3.5 font-mono font-bold text-jade-300">₹${Number(emp.netPayable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td class="px-4 py-3.5">${statusBadge}</td>
                <td class="px-5 py-3.5 text-right">${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

window.disburseEmployeeSalary = function(empId) {
    const emp = currentEmployees.find(e => String(e.id) === String(empId));
    if (emp) {
        emp.status = 'PAID';
        emp.utr = `IMPS_SAL_${Date.now().toString().slice(-6)}`;
        if (currentBatch) {
            currentBatch.employees = currentEmployees;
            localStorage.setItem('autorecon_salary_' + batchId, JSON.stringify(currentBatch));
        }
        populateSalaryReport(currentBatch);
        alert(`Salary of ₹${Number(emp.netPayable).toLocaleString('en-IN')} disbursed to ${emp.fullName} via IMPS!`);
    }
};

window.disburseAllFileSalaries = function() {
    let count = 0;
    currentEmployees.forEach(emp => {
        if (emp.status !== 'PAID') {
            emp.status = 'PAID';
            emp.utr = `IMPS_SAL_${Math.floor(100000 + Math.random() * 900000)}`;
            count++;
        }
    });
    if (currentBatch) {
        currentBatch.employees = currentEmployees;
        localStorage.setItem('autorecon_salary_' + batchId, JSON.stringify(currentBatch));
    }
    populateSalaryReport(currentBatch);
    alert(`Successfully disbursed all ${count} salaries via Instant Bank IMPS!`);
};

// =========================================================================
// 4. SALARY CHARTS INITIALIZATION
// =========================================================================
function initSalaryCharts() {
    const ctxDonut = document.getElementById('salaryDonutChart').getContext('2d');
    salaryDonutChart = new Chart(ctxDonut, {
        type: 'doughnut',
        data: {
            labels: ['Disbursed on Time (Bank IMPS)', 'Delayed Salaries (SLA Breach)', 'Pending Bank Clearance'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#2ec4b6', '#e76f51', '#e5a95d'],
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
            cutout: '70%'
        }
    });

    const ctxBar = document.getElementById('salaryTierBarChart').getContext('2d');
    salaryTierBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Executive (>₹1,00,000)', 'Mid-Tier (₹50k - ₹1L)', 'Entry-Level (<₹50,000)'],
            datasets: [{
                label: 'Employees',
                data: [0, 0, 0],
                backgroundColor: ['#38bdf8', '#e5a95d', '#81b29a'],
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

function setupSalaryEventListeners() {
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('chatInput');
            const query = input.value.trim();
            if (query) {
                sendSalaryChatMessage(query);
                input.value = '';
            }
        });
    }

    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const query = chip.getAttribute('data-query');
            sendSalaryChatMessage(query);
        });
    });
}

window.openSalaryNoticeModal = function() {
    document.getElementById('salaryNoticeModal').classList.remove('hidden');
};

window.copySalaryNotice = function() {
    const text = document.getElementById('salaryNoticeContent').textContent;
    navigator.clipboard.writeText(text);
    alert('AI Salary Delay Notification copied to clipboard!');
};

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

async function sendSalaryChatMessage(query) {
    const container = document.getElementById('chatMessages');
    const userMsg = document.createElement('div');
    userMsg.className = 'bg-sand-300 text-[#131c17] rounded-2xl p-3 text-xs font-semibold self-end ml-auto max-w-[85%] shadow-sm';
    userMsg.textContent = query;
    container.appendChild(userMsg);

    const totalGross = currentEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
    const totalTds = currentEmployees.reduce((sum, e) => sum + (e.tds || 0), 0);

    let reply = '';
    const q = query.toLowerCase();

    if (q.includes('tds') || q.includes('tax')) {
        reply = `For this uploaded salary roster of **${currentEmployees.length} employees**, total **TDS to be deposited under Section 192** is **₹${totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**. You must deposit this via Challan ITNS 281 by the 7th of next month.`;
    } else if (q.includes('top') || q.includes('highest') || q.includes('earner')) {
        const sorted = [...currentEmployees].sort((a, b) => b.salary - a.salary).slice(0, 3);
        reply = `Here are the top earners in this file:\n` + sorted.map((e, idx) => `${idx + 1}. **${e.fullName}**: ₹${Number(e.salary).toLocaleString('en-IN')} (${e.city})`).join('\n');
    } else if (q.includes('delay') || q.includes('notice') || q.includes('email')) {
        reply = `I have drafted a salary delay notification for the employees in this roster. Click the **AI Delay Notice** button at the top to copy and send!`;
    } else {
        reply = `Namaste! 🙏 I am analyzing this salary file with **${currentEmployees.length} employees** totaling **₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Gross CTC**. Total Net Payout is **₹${(totalGross - totalTds).toLocaleString('en-IN')}**. Let me know if you want to disburse payouts or calculate tax deductions!`;
    }

    const aiMsg = document.createElement('div');
    aiMsg.className = 'bg-[#131c17] border border-[#22332a] rounded-2xl p-3.5 text-xs text-sand-200 leading-relaxed shadow-sm whitespace-pre-wrap';
    aiMsg.innerHTML = reply.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    container.appendChild(aiMsg);
    container.scrollTop = container.scrollHeight;
}
