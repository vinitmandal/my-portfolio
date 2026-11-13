import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    checkAuth()
      .then(() => {
        if (active) setError('');
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Could not verify the admin session. Check the API connection and retry.');
        }
      })
      .finally(() => {
        if (active) setChecked(true);
      });
    return () => { active = false; };
  }, [checkAuth]);

  const retryAccess = useCallback(async () => {
    setChecked(false);
    setError('');
    try {
      await checkAuth();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not verify the admin session. Check the API connection and retry.');
    } finally {
      setChecked(true);
    }
  }, [checkAuth]);

  if (loading || !checked) {
    return <div className="page-status">Checking admin access…</div>;
  }

  if (error) {
    return (
      <main className="page-status page-status-error" role="alert">
        <p>{error}</p>
        <button type="button" className="admin-button admin-button-primary" onClick={retryAccess}>Retry</button>
      </main>
    );
  }

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}
