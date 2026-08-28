import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import GateAnimation from '../../components/GateAnimation.jsx';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/app/audit', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="section grid lg:grid-cols-2 gap-16 items-center !py-20">
      <div className="max-w-sm mx-auto w-full order-2 lg:order-1">
        <p className="eyebrow mb-2">Create account</p>
        <h1 className="text-3xl font-display font-semibold text-text mb-2">Get started</h1>
        <p className="text-text-muted text-sm mb-8">
          Creates a merchant account scoped to its own catalog, policy, and audit trail — isolated
          from every other account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs text-text-muted mb-1.5">Name</label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              placeholder="Your store name"
            />
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="At least 8 characters"
            />
            {passwordTooShort && (
              <p className="text-xs text-retry mt-1">Needs at least 8 characters.</p>
            )}
          </div>

          {error && (
            <div className="text-sm text-block bg-block-dim/30 border border-block/40 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-text-faint mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-signal-bright hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <div className="hidden lg:flex justify-center order-1 lg:order-2">
        <GateAnimation />
      </div>
    </div>
  );
}
