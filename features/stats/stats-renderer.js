// features/stats/stats-renderer.js

import { getState, setState } from '../../core/state.js';
import { calculateBalance } from '../transactions/transaction-utils.js';
import { formatCurrency } from '../../ui/currency.js';

/**
 * Renders the Chart.js bar chart for monthly cash flow.
 */
function renderChart() {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const monthlyData = {};
    const now = new Date();
    const { transactions, chart } = getState();

    // Use a consistent YYYY-MM key to avoid timezone issues
    for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
        const key = `${year}-${month}`;
        monthlyData[key] = { inflow: 0, outflow: 0 };
    }

    transactions.forEach(t => {
        // Add validation for the transaction date
        if (!t.date || isNaN(new Date(t.date))) {
            console.warn(`Invalid date found for transaction ID: ${t.id}. Skipping.`);
            return; // Skip this transaction
        }
        
        const date = new Date(t.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;

        if (monthlyData[key]) {
            if (t.type === 'UOM') {
                monthlyData[key].inflow += t.amount / 100;
            } else {
                monthlyData[key].outflow += t.amount / 100;
            }
        }
    });

    // Format labels for readability (e.g., "Jul '25")
    const labels = Object.keys(monthlyData).map(key => {
        const [year, month] = key.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    
    const inflow = Object.values(monthlyData).map(d => d.inflow);
    const outflow = Object.values(monthlyData).map(d => d.outflow);

    if (chart) chart.destroy();

    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Money In', data: inflow, backgroundColor: '#10b981' },
                { label: 'Money Out', data: outflow, backgroundColor: '#ef4444' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { callback: value => '$' + value } } }
        }
    });

    setState({ chart: newChart });
}

/**
 * Renders the statistics view, including the cash flow chart.
 */
export function renderStats() {
    const { transactions } = getState();
    const iouTotal = transactions
        .filter(t => t.type === 'IOU')
        .reduce((sum, t) => sum + calculateBalance(t), 0);

    const uomTotal = transactions
        .filter(t => t.type === 'UOM')
        .reduce((sum, t) => sum + calculateBalance(t), 0);

    const netBalance = uomTotal - iouTotal;

    const overdueIOU = transactions.filter(t =>
        t.type === 'IOU' && t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'paid'
    ).length;

    const overdueUOM = transactions.filter(t =>
        t.type === 'UOM' && t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'paid'
    ).length;

    const main = document.getElementById('main');
    if (!main) {
        console.error('Fatal Error: The "main" element was not found in the DOM.');
        return;
    }

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Statistics</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value ${netBalance >= 0 ? 'text-green' : 'text-red'}">
          ${formatCurrency(netBalance)}
        </div>
        <div class="stat-label">Net Balance</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">${formatCurrency(iouTotal)}</div>
        <div class="stat-label">Total I Owe</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">${formatCurrency(uomTotal)}</div>
        <div class="stat-label">Total Owed to Me</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${overdueIOU + overdueUOM}</div>
        <div class="stat-label">Overdue Items</div>
      </div>
    </div>
    <div class="card">
      <h3 class="font-bold mb-4">Monthly Cash Flow</h3>
      <div style="position: relative; height: 300px;">
        <canvas id="chartCanvas"></canvas>
      </div>
    </div>
  `;
    renderChart();
}