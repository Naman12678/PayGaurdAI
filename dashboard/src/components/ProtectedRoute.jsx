import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, verify } = useAuth();
  const [checked, setChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    verify().finally(() => setChecked(true));
    // Only re-verify on mount — coreApiClient already handles mid-session 401s.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-text-faint text-sm font-mono">Checking session…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
