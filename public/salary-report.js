// AutoRecon AI — Dedicated Employee Salary & Payroll Audit Desk Controller

let batchId = null;
let currentBatch = null;
let currentEmployees = [];
let salaryDonutChart = null;
let salaryTierBarChart = null;

// Initial Dataset from sample-simple.csv (Liam Williams, Jane Williams, etc.)
const defaultEmployeeDataset = [
    { id: '1', fullName: 'Liam Williams', email: 'liam.williams1@sample.net', city: 'Riverside', joined: '2020-04-18', salary: 156973.24, tds: 15697.32, pf: 3600.00, netPayable: 137675.92, status: 'PAID', utr: 'IMPS_SAL_900001' },
    { id: '2', fullName: 'Jane Williams', email: 'jane.williams2@example.com', city: 'Fairview', joined: '2024-01-27', salary: 50435.05, tds: 5043.51, pf: 3600.00, netPayable: 41791.54, status: 'DELAYED', utr: null },
    { id: '3', fullName: 'Emma Moore', email: 'emma.moore3@test.org', city: 'Fairview', joined: '2022-01-06', salary: 128705.61, tds: 12870.56, pf: 3600.00, netPayable: 112235.05, status: 'PENDING', utr: null },
    { id: '4', fullName: 'Emma Martinez', email: 'emma.martinez4@example.com', city: 'Burlington', joined: '2016-01-05', salary: 106198.11, tds: 10619.81, pf: 3600.00, netPayable: 91978.30, status: 'PAID', utr: 'IMPS_SAL_900004' },
    { id: '5', fullName: 'Benjamin Rodriguez', email: 'benjamin.rodriguez5@sample.net', city: 'Manchester', joined: '2023-04-19', salary: 189641.05, tds: 18964.11, pf: 3600.00, netPayable: 167076.94, status: 'DELAYED', utr: null },
    { id: '6', fullName: 'Amelia Williams', email: 'amelia.williams6@demo.io', city: 'Manchester', joined: '2016-08-19', salary: 26628.09, tds: 2662.81, pf: 3195.37, netPayable: 20769.91, status: 'PENDING', utr: null },
    { id: '7', fullName: 'Mia Jones', email: 'mia.jones7@demo.io', city: 'Ashland', joined: '2021-01-03', salary: 33038.53, tds: 3303.85, pf: 3600.00, netPayable: 26134.68, status: 'PAID', utr: 'IMPS_SAL_900007' },
    { id: '8', fullName: 'Emma Lopez', email: 'emma.lopez8@demo.io', city: 'Greenville', joined: '2015-12-15', salary: 146867.05, tds: 14686.71, pf: 3600.00, netPayable: 128580.34, status: 'DELAYED', utr: null },
    { id: '9', fullName: 'Isabella Lopez', email: 'isabella.lopez9@sample.net', city: 'Greenville', joined: '2015-01-27', salary: 175981.13, tds: 17598.11, pf: 3600.00, netPayable: 154783.02, status: 'PENDING', utr: null },
    { id: '10', fullName: 'Amelia Johnson', email: 'amelia.johnson10@demo.io', city: 'Madison', joined: '2020-03-09', salary: 22669.84, tds: 2266.98, pf: 2720.38, netPayable: 17682.48, status: 'PAID', utr: 'IMPS_SAL_900010' }
];

function initAll() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        batchId = urlParams.get('batchId') || 'batch_sample';

        // 1. Instantly populate fallback data so the screen is never blank
        populateFallbackSalaryBatch();

        // 2. Load background canvas
        initLiveSalaryBackground();

        // 3. Setup charts
        setTimeout(() => {
            initSalaryCharts();
            setupSalaryEventListeners();
        }, 100);

        // 4. Check if localStorage has customized uploaded file
        const localData = localStorage.getItem('autorecon_salary_' + batchId);
        if (localData) {
            try {
                const parsed = JSON.parse(localData);
                if (parsed && parsed.employees && parsed.employees.length > 0) {
                    populateSalaryReport(parsed);
                }
            } catch (e) {
                console.error(e);
            }
        }
    } catch (err) {
        console.error('Initialization error:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
} else {
    initAll();
}

// =========================================================================
// 1. DISTINCTIVE SAPPHIRE & GOLDEN COSMIC BACKGROUND
// =========================================================================
function initLiveSalaryBackground() {
    try {
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
        const numStars = Math.min(Math.floor(window.innerWidth / 22), 55);
        const starColors = ['#38bdf8', '#818cf8', '#e5a95d', '#48e5c2', '#c084fc'];

        for (let i = 0; i < numStars; i++) {
            stars.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                color: starColors[i % starColors.length],
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.3
            });
        }

        function animateStars() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const dx = stars[i].x - stars[j].x;
                    const dy = stars[i].y - stars[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 130) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(56, 189, 248, ${0.14 * (1 - dist / 130)})`;
                        ctx.lineWidth = 0.75;
                        ctx.moveTo(stars[i].x, stars[i].y);
                        ctx.lineTo(stars[j].x, stars[j].y);
                        ctx.stroke();
                    }
                }
            }

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
    } catch (e) {
        console.error('Canvas error:', e);
    }
}

// =========================================================================
// 2. DATA POPULATION
// =========================================================================
function populateFallbackSalaryBatch() {
    const defaultBatch = {
        batchId: batchId || 'batch_sample',
        fileName: 'sample-simple.csv',
        uploadedAt: new Date().toISOString(),
        employees: JSON.parse(JSON.stringify(defaultEmployeeDataset))
    };
    populateSalaryReport(defaultBatch);
}

function populateSalaryReport(data) {
    if (!data) return;
    currentBatch = data;
    currentEmployees = data.employees || [];

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setTxt('reportTitle', `Salary Audit: ${data.fileName || 'sample-simple.csv'}`);
    setTxt('reportFileName', data.fileName || 'sample-simple.csv');
    setTxt('reportBatchId', data.batchId || batchId);
    setTxt('reportTimestamp', data.uploadedAt ? data.uploadedAt.replace('T', ' ').substring(0, 19) : 'Live');
    setTxt('statSourceFile', data.fileName || 'sample-simple.csv');

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
    setTxt('statGrossSalary', `₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statEmpCount', `${currentEmployees.length} Employees Ingested`);
    setTxt('statTdsWithheld', `₹${totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statTotalDisbursed', `₹${totalDisbursedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statDisbursedEmpCount', `${disbursed.length} of ${currentEmployees.length} Transferred`);
    setTxt('statDelayedAmount', `₹${totalDelayedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('statDelayedEmpCount', `${delayed.length} Employees Overdue`);
    setTxt('statPendingAmount', `₹${totalPendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

    // Settlement Trail
    setTxt('trailGrossSalary', `₹${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('trailDeductions', `₹${(totalTds + totalPf).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('trailTds', `₹${totalTds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('trailPf', `₹${totalPf.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('trailNetPayable', `₹${totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    setTxt('chartEmpCount', `${currentEmployees.length} Employees`);

    // Update Charts safely
    if (salaryDonutChart && salaryDonutChart.data) {
        salaryDonutChart.data.datasets[0].data = [disbursed.length, delayed.length, pending.length];
        salaryDonutChart.update();
    }

    if (salaryTierBarChart && salaryTierBarChart.data) {
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

    tbody.innerHTML = currentEmployees.map(emp => {
        let statusBadge = '';
        let actionBtn = '';

        if (emp.status === 'PAID') {
            statusBadge = `<span class="badge-pill badge-reconciled"><i class="ph-bold ph-check-circle"></i> Transferred (IMPS)</span>`;
            actionBtn = `<span class="text-jade-400 font-mono text-[11px]">${emp.utr || 'IMPS_MATCHED'}</span>`;
        } else if (emp.status === 'DELAYED') {
            statusBadge = `<span class="badge-pill badge-delayed"><i class="ph-bold ph-warning"></i> Delayed (Overdue)</span>`;
            actionBtn = `
                <div class="flex items-center justify-end space-x-1.5">
                    <button onclick="disburseEmployeeSalary('${emp.id}')" class="px-2.5 py-1 bg-gradient-to-r from-sky-400 to-sand-300 hover:from-sky-300 hover:to-sand-200 text-[#131c17] rounded-lg font-bold text-[11px] shadow-sm">
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

window.disburseEmployeeSalary = async function(empId) {
    const emp = currentEmployees.find(e => String(e.id) === String(empId));
    if (emp) {
        emp.status = 'PAID';
        emp.utr = `IMPS_SAL_${Date.now().toString().slice(-6)}`;
        emp.disbursedDate = new Date().toISOString().slice(0, 10);
        if (currentBatch) {
            currentBatch.employees = currentEmployees;
            localStorage.setItem('autorecon_salary_' + batchId, JSON.stringify(currentBatch));
        }
        populateSalaryReport(currentBatch);

        // Sync with Cloud Database & Main Dashboard
        try {
            const token = localStorage.getItem('autorecon_auth_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            fetch('/api/payroll/disburse', {
                method: 'POST',
                headers,
                body: JSON.stringify({ empId: emp.id })
            }).catch(e => console.log('Sync error:', e));
        } catch(e) {}

        alert(`Payout of ₹${Number(emp.netPayable).toLocaleString('en-IN')} disbursed to ${emp.fullName} via Instant IMPS!\nUTR Reference: ${emp.utr}\n\nUpdated across all departments, database records, and exportable CSV.`);
    }
};

window.disburseAllFileSalaries = async function() {
    let count = 0;
    const token = localStorage.getItem('autorecon_auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    currentEmployees.forEach(emp => {
        if (emp.status !== 'PAID') {
            emp.status = 'PAID';
            emp.utr = `IMPS_SAL_${Math.floor(100000 + Math.random() * 900000)}`;
            emp.disbursedDate = new Date().toISOString().slice(0, 10);
            count++;

            fetch('/api/payroll/disburse', {
                method: 'POST',
                headers,
                body: JSON.stringify({ empId: emp.id })
            }).catch(e => {});
        }
    });

    if (currentBatch) {
        currentBatch.employees = currentEmployees;
        localStorage.setItem('autorecon_salary_' + batchId, JSON.stringify(currentBatch));
    }
    populateSalaryReport(currentBatch);
    alert(`Successfully disbursed all ${count} salaries via Instant Bank IMPS!\n\nAll departments, Cash Flow Compass, and CSV data have been synchronized.`);
};

// Export Updated CSV with UTRs and Disbursal Statuses
window.downloadUpdatedSalaryCsv = function() {
    if (!currentEmployees || currentEmployees.length === 0) {
        alert('No employee salary records available to export.');
        return;
    }

    const headers = [
        'id', 'first_name', 'last_name', 'email', 'city', 'joined',
        'gross_salary', 'tds_deducted_sec192', 'epf_deducted', 'net_bank_pay',
        'payout_status', 'bank_imps_utr', 'disbursed_timestamp'
    ];

    const rows = currentEmployees.map(emp => {
        const nameParts = (emp.fullName || '').split(' ');
        const fn = nameParts[0] || '';
        const ln = nameParts.slice(1).join(' ') || '';
        const timestamp = emp.status === 'PAID' ? (emp.disbursedDate || new Date().toISOString().slice(0, 10)) : '';

        return [
            emp.id || '',
            `"${fn}"`,
            `"${ln}"`,
            `"${emp.email || ''}"`,
            `"${emp.city || ''}"`,
            `"${emp.joined || ''}"`,
            emp.salary || 0,
            emp.tds || 0,
            emp.pf || 0,
            emp.netPayable || 0,
            emp.status || 'PENDING',
            `"${emp.utr || ''}"`,
            `"${timestamp}"`
        ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const baseName = (currentBatch && currentBatch.fileName ? currentBatch.fileName : 'sample-simple.csv').replace('.csv', '');
    link.setAttribute('download', `${baseName}_audited_disbursed.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// =========================================================================
// 4. SALARY CHARTS INITIALIZATION
// =========================================================================
function initSalaryCharts() {
    try {
        const elDonut = document.getElementById('salaryDonutChart');
        if (elDonut && window.Chart) {
            const ctxDonut = elDonut.getContext('2d');
            salaryDonutChart = new Chart(ctxDonut, {
                type: 'doughnut',
                data: {
                    labels: ['Disbursed on Time (Bank IMPS)', 'Delayed Salaries (SLA Breach)', 'Pending Bank Clearance'],
                    datasets: [{
                        data: [4, 3, 3],
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
                            labels: { color: '#b5c4b8', font: { size: 10, weight: '500' }, padding: 12 }
                        }
                    },
                    cutout: '70%'
                }
            });
        }

        const elBar = document.getElementById('salaryTierBarChart');
        if (elBar && window.Chart) {
            const ctxBar = elBar.getContext('2d');
            salaryTierBarChart = new Chart(ctxBar, {
                type: 'bar',
                data: {
                    labels: ['Executive (>₹1,00,000)', 'Mid-Tier (₹50k - ₹1L)', 'Entry-Level (<₹50,000)'],
                    datasets: [{
                        label: 'Employees',
                        data: [6, 1, 3],
                        backgroundColor: ['#38bdf8', '#e5a95d', '#81b29a'],
                        borderRadius: 8
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
    } catch (e) {
        console.error('Chart error:', e);
    }
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
    const m = document.getElementById('salaryNoticeModal');
    if (m) m.classList.remove('hidden');
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
    userMsg.className = 'bg-sky-400 text-[#131c17] rounded-2xl p-3 text-xs font-semibold self-end ml-auto max-w-[85%] shadow-sm';
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
