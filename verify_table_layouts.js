const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    const viewports = [
        { name: 'Desktop (1440px)', width: 1440, height: 900 },
        { name: 'Tablet (768px)', width: 768, height: 1024 },
        { name: 'Mobile (375px)', width: 375, height: 812 }
    ];

    for (const vp of viewports) {
        console.log(`\n========================================`);
        console.log(`TESTING VIEWPORT: ${vp.name}`);
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.goto('https://razorpay-autorecon.vercel.app/', { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 1500));

        const audit = await page.evaluate(() => {
            const tables = ['ordersTableBody', 'payrollTableBody', 'vendorsTableBody', 'cashFlowTableBody'];
            const res = {};

            tables.forEach(id => {
                const tbody = document.getElementById(id);
                if (!tbody) {
                    res[id] = { error: 'tbody not found' };
                    return;
                }
                const table = tbody.closest('table');
                const thead = table ? table.querySelector('thead') : null;
                const ths = thead ? Array.from(thead.querySelectorAll('th')) : [];
                const firstRow = tbody.querySelector('tr');
                const tds = firstRow ? Array.from(firstRow.querySelectorAll('td')) : [];

                const colAlignments = ths.map((th, i) => {
                    const td = tds[i];
                    return {
                        col: i + 1,
                        headerText: th.innerText.trim(),
                        headerAlign: window.getComputedStyle(th).textAlign,
                        cellAlign: td ? window.getComputedStyle(td).textAlign : 'N/A'
                    };
                });

                res[id] = {
                    headerColCount: ths.length,
                    bodyColCount: tds.length,
                    matchedColCount: ths.length === tds.length,
                    tableScrollWidth: table ? table.scrollWidth : 0,
                    tableContainerWidth: table && table.parentElement ? table.parentElement.clientWidth : 0,
                    alignments: colAlignments
                };
            });

            return {
                tables: res,
                pageWidth: document.documentElement.scrollWidth,
                viewportWidth: window.innerWidth,
                hasPageOverflow: document.documentElement.scrollWidth > window.innerWidth
            };
        });

        console.log('Page Overflow Check:', audit.hasPageOverflow ? '❌ HORIZONTAL OVERFLOW DETECTED' : '✅ PERFECT NO PAGE OVERFLOW');
        Object.keys(audit.tables).forEach(tId => {
            const t = audit.tables[tId];
            console.log(`\n  Table ${tId}:`);
            console.log(`    Header Cols: ${t.headerColCount} | Body Cols: ${t.bodyColCount} | Matched: ${t.matchedColCount ? '✅ YES' : '❌ NO'}`);
            console.log(`    Table Width: ${t.tableScrollWidth}px | Container Width: ${t.tableContainerWidth}px`);
        });
    }

    await browser.close();
})().catch(err => {
    console.error('TABLE VERIFICATION ERROR:', err);
    process.exit(1);
});
