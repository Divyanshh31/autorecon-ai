const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

function getContext(id) {
  const i = html.indexOf(id);
  if (i === -1) return 'NOT FOUND: ' + id;
  const start = html.lastIndexOf('<table', i);
  const end = html.indexOf('</table>', i) + 8;
  return html.slice(start, end);
}

console.log('=== TABLE 1 (ordersTableBody) ===\n', getContext('ordersTableBody'));
console.log('=== TABLE 2 (payrollTableBody) ===\n', getContext('payrollTableBody'));
console.log('=== TABLE 3 (vendorsTableBody) ===\n', getContext('vendorsTableBody'));
console.log('=== TABLE 4 (cashFlowTableBody) ===\n', getContext('cashFlowTableBody'));
