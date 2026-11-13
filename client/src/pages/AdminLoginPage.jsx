import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { adminApi } from '../services/api';
import Button from '../components/Button';
import './AdminDashboard.css';

export default function AdminLoginPage() {
  const { isAuthenticated, login, loading, checkAuth } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ username: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const [setupStatus] = await Promise.all([
          adminApi.getSetupStatus(),
          checkAuth(),
        ]);
        if (active) setSetupAvailable(setupStatus.setupAvailable);
      } catch (error) {
        if (active) {
          setStatus({
            type: 'error',
            message: error.response?.data?.message || 'Admin services are unavailable. Try again shortly.',
          });
        }
      } finally {
        if (active) setChecking(false);
      }
    };
    loadStatus();
    return () => { active = false; };
  }, [checkAuth]);

  if (checking || loading) {
    return <main className="admin-auth-shell"><p className="admin-loading">Checking admin access…</p></main>;
  }
  if (isAuthenticated) return <Navigate to="/admin" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: '', message: '' });
    const username = form.username.trim();
    if (!username || !form.password) {
      setStatus({ type: 'error', message: 'Enter your username and password.' });
      return;
    }

    try {
      await login(username, form.password);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.response?.data?.message || 'Unable to sign in. Check your credentials and try again.',
      });
    }
  };

  return (
    <main className="admin-auth-shell">
      <button type="button" className="admin-icon-button admin-auth-theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <section className="admin-auth-card">
        <div className="admin-auth-brand">
          <span className="admin-mark"><LockKeyhole size={20} /></span>
          <div>
            <p className="admin-eyebrow">Portfolio / Admin access</p>
            <h1>Welcome back.</h1>
          </div>
        </div>
        <p className="admin-auth-intro">Sign in to manage portfolio content and messages.</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Username</span>
            <input
              autoComplete="username"
              maxLength={50}
              name="username"
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              required
              value={form.username}
            />
          </label>
          <label className="admin-field">
            <span>Password</span>
            <span className="admin-password-field">
              <input
                autoComplete="current-password"
                maxLength={128}
                name="password"
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
          {status.message ? <p className={`admin-notice is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p> : null}
          <Button type="submit" className="admin-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {setupAvailable ? (
          <p className="admin-setup-prompt">
            First time here? <Link to="/admin/setup">Set up the initial admin account</Link>
          </p>
        ) : null}
        <Link to="/" className="admin-back-link">← Back to portfolio</Link>
      </section>
    </main>
  );
}
