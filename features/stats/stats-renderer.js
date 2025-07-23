// features/stats/stats-renderer.js

import { app } from '../../core/state.js';
import { calculateBalance } from '../transactions/transaction-utils.js';

/**
 * Renders the Chart.js bar chart for monthly cash flow.
 */
function renderChart() {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const monthlyData = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        monthlyData[key] = { inflow: 0, outflow: 0 };
    }

    app.transactions.forEach(t => {
        const date = new Date(t.date);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyData[key]) {
            if (t.type === 'UOM') {
                monthlyData[key].inflow += t.amount / 100;
            } else {
                monthlyData[key].outflow += t.amount / 100;
            }
        }
    });

    const labels = Object.keys(monthlyData);
    const inflow = labels.map(k => monthlyData[k].inflow);
    const outflow = labels.map(k => monthlyData[k].outflow);

    if (app.chart) app.chart.destroy();

    app.chart = new Chart(ctx, {
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
}

/**
 * Renders the statistics view, including the cash flow chart.
 */
export function renderStats() {
    const iouTotal = app.transactions
        .filter(t => t.type === 'IOU')
        .reduce((sum, t) => sum + calculateBalance(t), 0);

    const uomTotal = app.transactions
        .filter(t => t.type === 'UOM')
        .reduce((sum, t) => sum + calculateBalance(t), 0);

    const netBalance = uomTotal - iouTotal;

    const overdueIOU = app.transactions.filter(t =>
        t.type === 'IOU' && t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'paid'
    ).length;

    const overdueUOM = app.transactions.filter(t =>
        t.type === 'UOM' && t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'paid'
    ).length;

    const main = document.getElementById('main');

    main.innerHTML = `
    <h2 class="text-xl font-bold mb-4">Statistics</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-value ${netBalance >= 0 ? 'text-green' : 'text-red'}">
          $${Math.abs(netBalance / 100).toFixed(2)}
        </div>
        <div class="stat-label">Net Balance</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-red">${(iouTotal / 100).toFixed(2)}</div>
        <div class="stat-label">Total I Owe</div>
      </div>
      <div class="stat-card">
        <div class="stat-value text-green">${(uomTotal / 100).toFixed(2)}</div>
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