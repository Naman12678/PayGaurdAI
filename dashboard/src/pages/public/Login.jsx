import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import GateAnimation from '../../components/GateAnimation.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/app/audit';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section grid lg:grid-cols-2 gap-16 items-center !py-20">
      <div className="max-w-sm mx-auto w-full">
        <p className="eyebrow mb-2">Sign in</p>
        <h1 className="text-3xl font-display font-semibold text-text mb-2">Welcome back</h1>
        <p className="text-text-muted text-sm mb-8">
          Sign in to view your audit trail, edit policy, and try the checkout demo.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs text-text-muted mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="you@merchant.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs text-text-muted mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-block bg-block-dim/30 border border-block/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-text-faint mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-signal-bright hover:underline">
            Get started
          </Link>
        </p>
      </div>

      <div className="hidden lg:flex justify-center">
        <GateAnimation />
      </div>
    </div>
  );
}
