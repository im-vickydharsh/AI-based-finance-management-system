import React from 'react';
import { 
  Wallet, TrendingUp, TrendingDown, PiggyBank, 
  ArrowUpRight, ArrowDownRight, Award, PlusCircle, Sparkles, Clock
} from 'lucide-react';
import { formatCurrency } from '../utils/aiEngine';

const CATEGORY_ICONS = {
  food: '🍔',
  dining: '🍕',
  groceries: '🛒',
  transport: '🚗',
  fuel: '⛽',
  housing: '🏠',
  rent: '🏢',
  utilities: '💡',
  entertainment: '🎬',
  shopping: '🛍️',
  health: '💊',
  salary: '💵',
  freelance: '💻',
  investment: '📈',
  other: '🏷️'
};

const getCategoryIcon = (category = '') => {
  const cat = category.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (cat.includes(key)) return icon;
  }
  return '🏷️';
};

const Dashboard = ({ transactions, onNavigate, onSeedData }) => {
  // Financial Indicators Calculation (Eqs. 1, 2, 3, 4 from research paper)
  const incomeTx = transactions.filter(t => t.type?.toLowerCase() === "income");
  const expenseTx = transactions.filter(t => t.type?.toLowerCase() === "expense");

  const totalIncome = incomeTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((currentBalance / totalIncome) * 100) : 0;

  // Category aggregation (Eqs. 5 & 6)
  const categoryMap = {};
  expenseTx.forEach(t => {
    const cat = (t.category || "Other").trim();
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount || 0);
  });

  const rankedCategories = Object.entries(categoryMap)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  // Compute Health Score
  let healthScore = 50;
  if (totalIncome > 0) {
    if (savingsRate >= 50) healthScore = 95;
    else if (savingsRate >= 30) healthScore = 85;
    else if (savingsRate >= 20) healthScore = 75;
    else if (savingsRate >= 10) healthScore = 65;
    else if (savingsRate > 0) healthScore = 55;
    else healthScore = 25;
  }

  const topCategory = rankedCategories[0];

  return (
    <div>
      {/* Financial Health Banner */}
      <div className="health-banner">
        <div className="health-banner-info">
          <div className="health-score-circle">
            <span>{transactions.length ? healthScore : '--'}</span>
            <span className="health-score-label">SCORE</span>
          </div>
          <div className="health-banner-text">
            <h4>
              {transactions.length === 0
                ? "Welcome to your AI Personal Finance Hub"
                : healthScore >= 75
                ? "Excellent Financial Stability! 🌟"
                : healthScore >= 50
                ? "Moderate Financial Health ⚖️"
                : "Budget Alert: Deficit Warning ⚠️"}
            </h4>
            <p>
              {transactions.length === 0
                ? "Start recording transactions or load realistic sample data to see live analytics and conversational insights."
                : topCategory
                ? `You've retained ${savingsRate.toFixed(1)}% of your income. Your largest expense is ${topCategory.name} (${formatCurrency(topCategory.amount)}).`
                : `Total income is ${formatCurrency(totalIncome)} with zero expenses logged.`}
            </p>
          </div>
        </div>

        {transactions.length === 0 && onSeedData && (
          <button className="btn-sample" onClick={onSeedData}>
            <Sparkles size={16} /> Load Demo Data
          </button>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="stat-cards-grid">
        {/* Balance Card */}
        <div className="stat-card balance">
          <div className="stat-card-header">
            <span className="stat-card-title">Net Balance</span>
            <div className="stat-card-icon">
              <Wallet size={20} />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(currentBalance)}</div>
          <div className="stat-card-subtext">
            <span className={`badge-pill ${currentBalance >= 0 ? 'success' : 'danger'}`}>
              {currentBalance >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {currentBalance >= 0 ? 'Surplus' : 'Deficit'}
            </span>
            <span>Available cash</span>
          </div>
        </div>

        {/* Income Card */}
        <div className="stat-card income">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Income</span>
            <div className="stat-card-icon">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(totalIncome)}</div>
          <div className="stat-card-subtext">
            <span className="badge-pill success">
              +{incomeTx.length} sources
            </span>
            <span>Inflows received</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="stat-card expense">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Expenses</span>
            <div className="stat-card-icon">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className="stat-card-value">{formatCurrency(totalExpense)}</div>
          <div className="stat-card-subtext">
            <span className="badge-pill danger">
              -{expenseTx.length} items
            </span>
            <span>Outflows spent</span>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="stat-card savings">
          <div className="stat-card-header">
            <span className="stat-card-title">Savings Rate</span>
            <div className="stat-card-icon">
              <PiggyBank size={20} />
            </div>
          </div>
          <div className="stat-card-value">{savingsRate.toFixed(1)}%</div>
          <div className="stat-card-subtext">
            <span className={`badge-pill ${savingsRate >= 20 ? 'success' : 'warning'}`}>
              Benchmark: 20%
            </span>
            <span>50/30/20 target</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Categories & Recent Transactions */}
      <div className="dashboard-grid">
        {/* Left: Top Spending Categories */}
        <div className="card-panel">
          <div className="card-panel-title">
            <span>Top Spending Categories</span>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('analytics')}
                style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                View Analytics &rarr;
              </button>
            )}
          </div>

          {rankedCategories.length > 0 ? (
            <div className="category-progress-list">
              {rankedCategories.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="cat-progress-item">
                  <div className="cat-progress-header">
                    <span>{getCategoryIcon(cat.name)} {cat.name}</span>
                    <span style={{ color: '#0f172a' }}>{formatCurrency(cat.amount)} ({cat.percentage}%)</span>
                  </div>
                  <div className="cat-progress-bar-bg">
                    <div 
                      className="cat-progress-bar-fill" 
                      style={{ width: `${Math.min(100, Math.max(5, Number(cat.percentage)))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Clock size={36} className="empty-state-icon" />
              <p>No expenses recorded yet.</p>
            </div>
          )}
        </div>

        {/* Right: Recent Transactions */}
        <div className="card-panel">
          <div className="card-panel-title">
            <span>Recent Transactions</span>
            {onNavigate && (
              <button 
                onClick={() => onNavigate('transactions')}
                style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Manage All &rarr;
              </button>
            )}
          </div>

          {transactions.length > 0 ? (
            <ul className="transaction-list">
              {transactions.slice(-5).reverse().map((t, idx) => {
                const isIncome = t.type?.toLowerCase() === 'income';
                return (
                  <li key={t.id || idx} className="transaction-item">
                    <div className="tx-left">
                      <div className={`tx-icon-wrapper ${isIncome ? 'income' : 'expense'}`}>
                        {getCategoryIcon(t.category)}
                      </div>
                      <div className="tx-details">
                        <span className="tx-desc">{t.description || 'Transaction'}</span>
                        <div className="tx-meta">
                          <span>{t.date}</span>
                          <span className="tx-category-badge">{t.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="tx-right">
                      <span className={`tx-amount ${isIncome ? 'income' : 'expense'}`}>
                        {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">
              <Clock size={36} className="empty-state-icon" />
              <p>No transactions available.</p>
              {onSeedData && (
                <button className="btn-sample" onClick={onSeedData}>
                  Load Sample Data
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
