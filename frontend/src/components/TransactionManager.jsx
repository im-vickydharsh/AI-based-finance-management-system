import React, { useState } from 'react';
import { 
  PlusCircle, Trash2, Search, Filter, Tag, Calendar, DollarSign, Sparkles, CheckCircle2 
} from 'lucide-react';
import { formatCurrency } from '../utils/aiEngine';

const QUICK_CATEGORIES = [
  { name: 'Food', type: 'expense', icon: '🍔' },
  { name: 'Rent', type: 'expense', icon: '🏠' },
  { name: 'Transport', type: 'expense', icon: '🚗' },
  { name: 'Shopping', type: 'expense', icon: '🛍️' },
  { name: 'Utilities', type: 'expense', icon: '💡' },
  { name: 'Entertainment', type: 'expense', icon: '🎬' },
  { name: 'Salary', type: 'income', icon: '💵' },
  { name: 'Freelance', type: 'income', icon: '💻' },
  { name: 'Healthcare', type: 'expense', icon: '💊' }
];

const TransactionManager = ({ transactions, onAdd, onDelete, onSeedData }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectQuickCategory = (cat) => {
    setFormData(prev => ({
      ...prev,
      category: cat.name,
      type: cat.type
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount) || Number(formData.amount) <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    setIsSubmitting(true);
    await onAdd({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData({
      amount: '',
      category: formData.category,
      description: '',
      type: formData.type,
      date: new Date().toISOString().split('T')[0]
    });
    setIsSubmitting(false);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesType = typeFilter === 'all' || t.type?.toLowerCase() === typeFilter;
    const matchesSearch = 
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <PlusCircle size={22} color="#4f46e5" /> Transaction Manager
          </h2>
          <p className="section-desc">Record, categorize, search, and manage your income and expenses.</p>
        </div>

        {onSeedData && (
          <button className="btn-sample" onClick={onSeedData}>
            <Sparkles size={16} /> Load Demo Dataset
          </button>
        )}
      </div>

      {/* New Transaction Form Card */}
      <div className="form-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: '#0f172a' }}>
          Add New Record
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Transaction Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="expense">Expense (-)</option>
                <option value="income">Income (+)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Food, Rent, Salary"
                required
              />
              {/* Quick Picks */}
              <div className="category-quick-picks">
                {QUICK_CATEGORIES.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    className="category-chip"
                    onClick={() => handleSelectQuickCategory(c)}
                  >
                    {c.icon} {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Description / Notes</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Dinner with team, Monthly paycheck"
                required
              />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              <PlusCircle size={18} /> {isSubmitting ? "Saving..." : "Add Transaction"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-search-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon-pos" />
          <input
            type="text"
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="type-filter-group">
          <button
            className={`type-filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All ({transactions.length})
          </button>
          <button
            className={`type-filter-btn ${typeFilter === 'income' ? 'active' : ''}`}
            onClick={() => setTypeFilter('income')}
          >
            Income ({transactions.filter(t => t.type === 'income').length})
          </button>
          <button
            className={`type-filter-btn ${typeFilter === 'expense' ? 'active' : ''}`}
            onClick={() => setTypeFilter('expense')}
          >
            Expenses ({transactions.filter(t => t.type === 'expense').length})
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <ul className="transaction-list">
          {filteredTransactions.slice().reverse().map((t) => {
            const isIncome = t.type?.toLowerCase() === 'income';
            return (
              <li key={t.id} className="transaction-item">
                <div className="tx-left">
                  <div className={`tx-icon-wrapper ${isIncome ? 'income' : 'expense'}`}>
                    {isIncome ? '💵' : '💳'}
                  </div>
                  <div className="tx-details">
                    <span className="tx-desc">{t.description}</span>
                    <div className="tx-meta">
                      <span><Calendar size={12} style={{ display: 'inline', marginRight: '3px' }} />{t.date}</span>
                      <span className="tx-category-badge">{t.category}</span>
                    </div>
                  </div>
                </div>

                <div className="tx-right">
                  <span className={`tx-amount ${isIncome ? 'income' : 'expense'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="delete-btn"
                    title="Delete record"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="empty-state">
          <Tag size={40} className="empty-state-icon" />
          <h3>No transactions match your query</h3>
          <p>Try clearing your search terms or record a new transaction above.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
