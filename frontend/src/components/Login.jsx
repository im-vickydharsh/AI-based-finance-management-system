import React, { useState } from 'react';
import axios from 'axios';
import { 
  Sparkles, Mail, Lock, User, Eye, EyeOff, 
  ArrowRight, ShieldCheck, Zap, Bot, CheckCircle2, AlertCircle 
} from 'lucide-react';

const AUTH_API = 'http://localhost:8081/api/auth';

// Built-in fallback demo accounts for offline/client mode
const LOCAL_USERS_KEY = 'finai_registered_users';
const DEFAULT_DEMO_USER = {
  id: 1,
  name: 'Alex Morgan',
  email: 'alex@finai.io',
  password: 'password123'
};

const Login = ({ onLoginSuccess, isBackendConnected }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Helper to get local stored users in client mode
  const getLocalUsers = () => {
    try {
      const stored = localStorage.getItem(LOCAL_USERS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Could not read local users", e);
    }
    return [DEFAULT_DEMO_USER];
  };

  // Helper to save a user locally
  const saveLocalUser = (newUser) => {
    const users = getLocalUsers();
    users.push(newUser);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Form validation
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (isSignUp) {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password should be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isBackendConnected) {
        // Use Spring Boot backend endpoint
        const endpoint = isSignUp ? `${AUTH_API}/register` : `${AUTH_API}/login`;
        const payload = isSignUp 
          ? { name: name.trim(), email: email.trim().toLowerCase(), password } 
          : { email: email.trim().toLowerCase(), password };

        const response = await axios.post(endpoint, payload);
        const userData = response.data;

        if (rememberMe) {
          localStorage.setItem('finai_user', JSON.stringify(userData));
        } else {
          sessionStorage.setItem('finai_user', JSON.stringify(userData));
        }

        setSuccessMsg(isSignUp ? 'Account created successfully! Logging you in...' : 'Login successful! Welcome back.');
        setTimeout(() => {
          onLoginSuccess(userData);
        }, 500);

      } else {
        // Resilient Offline/Local Mode
        const localUsers = getLocalUsers();
        const normalizedEmail = email.trim().toLowerCase();

        if (isSignUp) {
          const exists = localUsers.some(u => u.email.toLowerCase() === normalizedEmail);
          if (exists) {
            setErrorMsg('An account with this email already exists.');
            setLoading(false);
            return;
          }

          const newUser = {
            id: Date.now(),
            name: name.trim(),
            email: normalizedEmail,
            password
          };
          saveLocalUser(newUser);

          const userProfile = { id: newUser.id, name: newUser.name, email: newUser.email };
          if (rememberMe) {
            localStorage.setItem('finai_user', JSON.stringify(userProfile));
          } else {
            sessionStorage.setItem('finai_user', JSON.stringify(userProfile));
          }

          setSuccessMsg('Account created successfully! Logging you in...');
          setTimeout(() => {
            onLoginSuccess(userProfile);
          }, 500);

        } else {
          // Local Login verification
          const matched = localUsers.find(
            u => u.email.toLowerCase() === normalizedEmail && u.password === password
          );

          if (!matched) {
            setErrorMsg('Invalid email or password. Use the Quick Demo button below or create an account.');
            setLoading(false);
            return;
          }

          const userProfile = { id: matched.id, name: matched.name, email: matched.email };
          if (rememberMe) {
            localStorage.setItem('finai_user', JSON.stringify(userProfile));
          } else {
            sessionStorage.setItem('finai_user', JSON.stringify(userProfile));
          }

          setSuccessMsg('Login successful! Welcome back.');
          setTimeout(() => {
            onLoginSuccess(userProfile);
          }, 500);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Demo Login as Alex Morgan
  const handleQuickDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      if (isBackendConnected) {
        // Try backend login with demo user
        try {
          const response = await axios.post(`${AUTH_API}/login`, {
            email: DEFAULT_DEMO_USER.email,
            password: DEFAULT_DEMO_USER.password
          });
          const userData = response.data;
          localStorage.setItem('finai_user', JSON.stringify(userData));
          onLoginSuccess(userData);
          return;
        } catch (e) {
          console.warn("Backend demo auth failed, continuing with local demo user:", e.message);
        }
      }

      // Offline / Fallback login
      const demoProfile = { 
        id: DEFAULT_DEMO_USER.id, 
        name: DEFAULT_DEMO_USER.name, 
        email: DEFAULT_DEMO_USER.email 
      };
      localStorage.setItem('finai_user', JSON.stringify(demoProfile));
      onLoginSuccess(demoProfile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Decorative Top Gradient Accent */}
        <div className="auth-card-banner" />

        {/* Brand Header */}
        <div className="auth-header">
          <div className="auth-logo-badge">
            <Sparkles size={28} />
          </div>
          <h2 className="auth-title">FinAI Intelligence</h2>
          <p className="auth-subtitle">AI-Powered Personal Finance Management System</p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${isSignUp ? 'active' : ''}`}
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
          >
            Create Account
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="auth-alert auth-alert-error">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success">
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form className="auth-form" onSubmit={handleAuthSubmit}>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="auth-name">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-leading-icon" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-leading-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-leading-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                required
              />
              <button
                type="button"
                className="input-trailing-action"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-leading-icon" />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="auth-extra-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me on this device</span>
            </label>
          </div>

          <button
            type="submit"
            className="btn-auth-submit"
            disabled={loading}
          >
            {loading ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{isSignUp ? 'Create My Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Login Option */}
        <div className="auth-divider">
          <span>Or explore instantly</span>
        </div>

        <button
          type="button"
          className="btn-quick-demo"
          onClick={handleQuickDemoLogin}
          disabled={loading}
        >
          <Zap size={16} className="zap-icon" />
          <span>One-Click Demo Login (Alex Morgan)</span>
        </button>

        {/* Feature Highlights Footer */}
        <div className="auth-footer-features">
          <div className="auth-feature-chip">
            <ShieldCheck size={14} />
            <span>Secure Access</span>
          </div>
          <div className="auth-feature-chip">
            <Bot size={14} />
            <span>AI Assistant</span>
          </div>
          <div className="auth-feature-chip">
            <Sparkles size={14} />
            <span>Live Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
