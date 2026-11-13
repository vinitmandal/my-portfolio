import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, KeyRound, Moon, ShieldCheck, Sun } from 'lucide-react';
import { adminApi } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import './AdminDashboard.css';

export default function AdminSetupPage() {
  const { theme, toggleTheme } = useTheme();
  const [setupState, setSetupState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [form, setForm] = useState({
    setup_key: '',
    username: '',
    password: '',
    confirm_password: '',
  });
  const [notice, setNotice] = useState({ type: '', message: '' });

  useEffect(() => {
    let active = true;
    adminApi.getSetupStatus()
      .then((status) => {
        if (active) setSetupState(status);
      })
      .catch((error) => {
        if (active) {
          setSetupState({ failed: true });
          setNotice({
            type: 'error',
            message: error.response?.data?.message || 'Admin setup status could not be loaded.',
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [attempt]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice({ type: '', message: '' });
    if (form.username.trim().length < 3) {
      setNotice({ type: 'error', message: 'Username must be at least 3 characters.' });
      return;
    }
    if (form.password.length < 12) {
      setNotice({ type: 'error', message: 'Use a password with at least 12 characters.' });
      return;
    }
    if (form.password !== form.confirm_password) {
      setNotice({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setSaving(true);
    try {
      const result = await adminApi.createInitialAdmin({
        ...form,
        username: form.username.trim(),
      });
      setSetupState({ initialized: true, setupAvailable: false });
      setForm({ setup_key: '', username: '', password: '', confirm_password: '' });
      setNotice({ type: 'success', message: result.message });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error.response?.data?.message || 'The initial admin account could not be created.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="admin-auth-shell"><p className="admin-loading">Checking one-time setup…</p></main>;
  }

  return (
    <main className="admin-auth-shell">
      <button type="button" className="admin-icon-button admin-auth-theme-button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </button>
      <section className="admin-auth-card">
        <div className="admin-auth-brand">
          <span className="admin-mark"><ShieldCheck size={20} /></span>
          <div>
            <p className="admin-eyebrow">Portfolio / One-time setup</p>
            <h1>Create admin access.</h1>
          </div>
        </div>

        {setupState?.failed ? (
          <div className="admin-empty-state">
            <p className="admin-notice is-error" role="alert">{notice.message}</p>
            <button type="button" className="admin-button admin-button-primary" onClick={() => {
              setLoading(true);
              setAttempt((value) => value + 1);
            }}>Retry</button>
          </div>
        ) : setupState?.initialized ? (
          <div className="admin-empty-state">
            {notice.type === 'success' ? <p className="admin-notice is-success" role="status">{notice.message}</p> : null}
            <p>An admin account is already configured. This setup endpoint can only be used once.</p>
            <Link to="/admin/login" className="admin-button admin-button-primary">Go to sign in</Link>
          </div>
        ) : !setupState?.setupAvailable ? (
          <div className="admin-empty-state">
            <p>Initial setup is unavailable. Set a strong, temporary <code>ADMIN_SETUP_KEY</code> on the server, restart it, then return here. Remove the key after creating the account.</p>
            <Link to="/admin/login" className="admin-button admin-button-secondary">Back to sign in</Link>
          </div>
        ) : (
          <>
            <p className="admin-auth-intro">Create the first administrator. Use the private setup key configured on the server and choose a unique password of at least 12 characters.</p>
            <form className="admin-form" onSubmit={handleSubmit}>
              <label className="admin-field">
                <span>One-time setup key</span>
                <span className="admin-password-field">
                  <input
                    autoComplete="off"
                    maxLength={256}
                    onChange={(event) => setForm((current) => ({ ...current, setup_key: event.target.value }))}
                    required
                    type={showSecrets ? 'text' : 'password'}
                    value={form.setup_key}
                  />
                  <button type="button" className="admin-password-toggle" onClick={() => setShowSecrets((visible) => !visible)} aria-label={showSecrets ? 'Hide setup key' : 'Show setup key'}>
                    {showSecrets ? <EyeOff size={17} /> : <KeyRound size={17} />}
                  </button>
                </span>
              </label>
              <label className="admin-field">
                <span>Username</span>
                <input autoComplete="username" maxLength={50} minLength={3} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required value={form.username} />
              </label>
              <label className="admin-field">
                <span>Password</span>
                <input autoComplete="new-password" maxLength={128} minLength={12} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required type="password" value={form.password} />
              </label>
              <label className="admin-field">
                <span>Confirm password</span>
                <input autoComplete="new-password" maxLength={128} minLength={12} onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))} required type="password" value={form.confirm_password} />
              </label>
              {notice.message ? <p className={`admin-notice is-${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.message}</p> : null}
              <Button type="submit" className="admin-submit" disabled={saving}>
                {saving ? 'Creating account…' : 'Create initial admin'}
              </Button>
            </form>
          </>
        )}
        <Link to="/" className="admin-back-link">← Back to portfolio</Link>
      </section>
    </main>
  );
}
