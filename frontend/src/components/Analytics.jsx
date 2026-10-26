import React from 'react';
import { 
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { PieChart, TrendingDown, TrendingUp, Sparkles, AlertCircle, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../utils/aiEngine';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const PALETTE = [
  '#4f46e5', '#7c3aed', '#ec4899', '#f43f5e', '#f59e0b', 
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#64748b'
];

const Analytics = ({ transactions }) => {
  const incomeTx = transactions.filter(t => t.type?.toLowerCase() === 'income');
  const expenseTx = transactions.filter(t => t.type?.toLowerCase() === 'expense');

  const totalIncome = incomeTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((currentBalance / totalIncome) * 100) : 0;

  // Category aggregation
  const categoryMap = {};
  expenseTx.forEach(item => {
    const category = (item.category || "Other").trim();
    categoryMap[category] = (categoryMap[category] || 0) + Number(item.amount || 0);
  });

  const rankedCategories = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Doughnut Chart Data for Categories
  const doughnutData = {
    labels: rankedCategories.map(c => c.name),
    datasets: [
      {
        data: rankedCategories.map(c => c.amount),
        backgroundColor: PALETTE.slice(0, rankedCategories.length),
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 14,
          font: { family: 'inherit', size: 12 }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.raw || 0;
            const pct = totalExpense > 0 ? ((val / totalExpense) * 100).toFixed(1) : 0;
            return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
          }
        }
      }
    },
    cutout: '68%'
  };

  // Bar Chart Data for Cash Flow Overview
  const barData = {
    labels: ['Total Income', 'Total Expenses', 'Net Savings'],
    datasets: [
      {
        label: 'Amount (₹)',
        data: [totalIncome, totalExpense, Math.max(0, currentBalance)],
        backgroundColor: ['#10b981', '#f43f5e', '#4f46e5'],
        borderRadius: 8,
        borderSkipped: false
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`
        },
        grid: {
          color: '#f1f5f9'
        }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  const topCategory = rankedCategories[0];
  const avgExpense = expenseTx.length ? (totalExpense / expenseTx.length) : 0;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <PieChart size={22} color="#4f46e5" /> Visual Financial Analytics
          </h2>
          <p className="section-desc">Interactive graphical breakdown of income, category expenses, and savings.</p>
        </div>
      </div>

      {/* Analytics KPI Row */}
      <div className="stat-cards-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-card-title">Top Expense Driver</div>
          <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
            {topCategory ? topCategory.name : 'N/A'}
          </div>
          <div className="stat-card-subtext">
            <span>{topCategory ? `${formatCurrency(topCategory.amount)} (${topCategory.percentage}%)` : 'No expenses logged'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Average Expense</div>
          <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
            {formatCurrency(avgExpense)}
          </div>
          <div className="stat-card-subtext">
            <span>Across {expenseTx.length} expense transactions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-title">Expense-to-Income</div>
          <div className="stat-card-value" style={{ fontSize: '1.4rem' }}>
            {totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(1)}%` : '100%'}
          </div>
          <div className="stat-card-subtext">
            <span>Target: &le; 80%</span>
          </div>
        </div>
      </div>

      {rankedCategories.length > 0 ? (
        <>
          {/* Charts Grid */}
          <div className="analytics-grid">
            {/* Doughnut Chart */}
            <div className="chart-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: '#0f172a' }}>
                Expense Distribution by Category
              </h3>
              <div className="chart-wrapper">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>

            {/* Income vs Expenses Bar Chart */}
            <div className="chart-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: '#0f172a' }}>
                Cash Inflow vs Outflow Comparison
              </h3>
              <div className="chart-wrapper">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {/* Detailed Category Table */}
          <div className="card-panel">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: '#0f172a' }}>
              Category Spending Breakdown
            </h3>
            <div className="category-progress-list">
              {rankedCategories.map((c, idx) => (
                <div key={idx} className="cat-progress-item">
                  <div className="cat-progress-header">
                    <span><strong>{c.name}</strong></span>
                    <span>{formatCurrency(c.amount)} ({c.percentage}%)</span>
                  </div>
                  <div className="cat-progress-bar-bg">
                    <div 
                      className="cat-progress-bar-fill"
                      style={{ 
                        width: `${c.percentage}%`,
                        backgroundColor: PALETTE[idx % PALETTE.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <BarChart3 size={48} className="empty-state-icon" />
          <h3>No Expense Data for Analytics</h3>
          <p>Record some expense transactions to visualize your spending charts and patterns.</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;
