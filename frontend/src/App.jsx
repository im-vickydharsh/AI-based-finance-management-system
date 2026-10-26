import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, ReceiptText, PieChart, Bot, Sparkles, LogOut, ShieldCheck 
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import TransactionManager from './components/TransactionManager';
import Analytics from './components/Analytics';
import AiInsights from './components/AiInsights';
import Login from './components/Login';
import './App.css';

const API_URL = 'http://localhost:8081/api/transactions';

const SAMPLE_DATA = [
  { description: 'Monthly Tech Salary', amount: 65000, category: 'Salary', type: 'income', date: '2026-10-01' },
  { description: 'Apartment Rent', amount: 18000, category: 'Housing', type: 'expense', date: '2026-10-02' },
  { description: 'Supermarket Groceries', amount: 4200, category: 'Food', type: 'expense', date: '2026-10-04' },
  { description: 'Freelance Design Project', amount: 15000, category: 'Freelance', type: 'income', date: '2026-10-08' },
  { description: 'Electricity & High-Speed Wifi', amount: 2400, category: 'Utilities', type: 'expense', date: '2026-10-12' },
  { description: 'Fuel & Metro Pass', amount: 3100, category: 'Transport', type: 'expense', date: '2026-10-15' },
  { description: 'Weekend Restaurant Dining', amount: 2850, category: 'Food', type: 'expense', date: '2026-10-18' },
  { description: 'Streaming Subscriptions', amount: 799, category: 'Entertainment', type: 'expense', date: '2026-10-20' },
  { description: 'Shopping & Clothes', amount: 3500, category: 'Shopping', type: 'expense', date: '2026-10-22' }
];

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('finai_user') || sessionStorage.getItem('finai_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(API_URL, { timeout: 3000 });
      setTransactions(response.data);
      setIsBackendConnected(true);
    } catch (error) {
      console.warn("Backend API not reachable at 8081, running in resilient client mode:", error.message);
      setIsBackendConnected(false);
      // Keep existing transactions or initialize with sample if completely empty
      setTransactions(prev => prev.length ? prev : SAMPLE_DATA.map((item, idx) => ({ ...item, id: idx + 1 })));
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction) => {
    if (isBackendConnected) {
      try {
        const response = await axios.post(API_URL, transaction);
        setTransactions(prev => [...prev, response.data]);
        return;
      } catch (error) {
        console.error("Error adding to backend:", error);
      }
    }
    // Fallback/Local state update
    const newTx = { ...transaction, id: Date.now() };
    setTransactions(prev => [...prev, newTx]);
  };

  const deleteTransaction = async (id) => {
    if (isBackendConnected) {
      try {
        await axios.delete(`${API_URL}/${id}`);
      } catch (error) {
        console.error("Error deleting on backend:", error);
      }
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const seedSampleData = async () => {
    if (isBackendConnected) {
      for (const item of SAMPLE_DATA) {
        try {
          await axios.post(API_URL, item);
        } catch (e) {
          console.error(e);
        }
      }
      fetchTransactions();
    } else {
      setTransactions(SAMPLE_DATA.map((item, idx) => ({ ...item, id: Date.now() + idx })));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('finai_user');
    sessionStorage.removeItem('finai_user');
    setCurrentUser(null);
  };

  // Helper to extract user initials for avatar
  const getUserInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  // If user is NOT logged in, show only Login view
  if (!currentUser) {
    return (
      <div className="app-container">
        <Login 
          onLoginSuccess={(user) => setCurrentUser(user)} 
          isBackendConnected={isBackendConnected} 
        />
      </div>
    );
  }

  // Home Page (Visible only when user is logged in)
  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-top">
          <div className="brand-wrapper">
            <div className="brand-icon">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="brand-title">FinAI Intelligence</h1>
              <p className="brand-subtitle">AI-Powered Personal Finance Management System</p>
            </div>
          </div>

          <div className="header-actions">
            {/* User Profile Widget */}
            <div className="user-profile-widget">
              <div className="user-avatar" title={currentUser.name}>
                {getUserInitials(currentUser.name)}
              </div>
              <div className="user-info-text">
                <span className="user-name">{currentUser.name || 'Alex Morgan'}</span>
                <span className="user-email">{currentUser.email || 'alex@finai.io'}</span>
              </div>
              <button 
                type="button" 
                className="btn-logout" 
                onClick={handleLogout}
                title="Log out of FinAI"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>

            <span className="status-badge">
              <span className="status-dot" style={{ background: isBackendConnected ? '#10b981' : '#f59e0b' }} />
              {isBackendConnected ? "Spring Boot Active" : "Local Engine Active"}
            </span>

            {transactions.length === 0 && (
              <button className="btn-sample" onClick={seedSampleData}>
                <Sparkles size={14} /> Populate Demo Data
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <ReceiptText size={18} />
            <span>Transactions ({transactions.length})</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <PieChart size={18} />
            <span>Analytics & Charts</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <Bot size={18} />
            <span>AI Insights Assistant</span>
          </button>
        </nav>
      </header>

      {/* Main Content View */}
      <main className="app-content">
        {activeTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            onNavigate={(tab) => setActiveTab(tab)}
            onSeedData={seedSampleData}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionManager
            transactions={transactions}
            onAdd={addTransaction}
            onDelete={deleteTransaction}
            onSeedData={seedSampleData}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics transactions={transactions} />
        )}

        {activeTab === 'ai' && (
          <AiInsights transactions={transactions} />
        )}
      </main>
    </div>
  );
}

export default App;
