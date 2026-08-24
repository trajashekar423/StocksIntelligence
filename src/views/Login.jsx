'use client';

import { useState } from 'react';
import useAuth from '../hooks/useAuth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getBackendMessage(err) {
  const data = err?.response?.data;

  if (typeof data === 'string') return data;
  if (typeof data?.message === 'string') return data.message;
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.error === 'string') return data.error;

  return '';
}

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
      <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 1 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
    </svg>
  );
}

function LoginForm({ onForgotPassword }) {
  const { login } = useAuth();
  const [form, setForm]             = useState({ email: '', password: '' });
  const [errors, setErrors]         = useState({});
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);

  const validate = () => {
    const e = {};
    if (!emailRegex.test(form.email))  e.email    = 'Enter a valid email address.';
    if (form.password.length < 6)      e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoginError('');
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      const status = err.response?.status;
      const backendMessage = getBackendMessage(err);

      if (err.isAuthError || status === 401 || status === 400) {
        setLoginError(backendMessage || err.message || 'Invalid email or password. Please try again.');
      } else if (!err.response) {
        setLoginError('Network error. Please check your connection.');
      } else {
        setLoginError(backendMessage || 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  return (
    <>
      <div className="text-center mb-5">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{
            width: 56,
            height: 56,
            background: 'linear-gradient(135deg, #ff6a3d, #ff7a3d)',
          }}
        >
          <span className="fw-bold text-white fs-5">R</span>
        </div>
        <h4 className="fw-bold mb-2" style={{ color: '#111827' }}>Welcome back</h4>
        <p className="text-muted mb-0">Sign in to your merchant account</p>
      </div>

      {loginError && (
        <div className="login-error-message" role="alert">{loginError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="form-label small fw-semibold text-secondary mb-2">Email address</label>
          <input
            type="email"
            name="email"
            className={`form-control rounded-3 ${errors.email ? 'is-invalid' : ''}`}
            style={{
              minHeight: 46,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              padding: '0.65rem 0.95rem',
              boxShadow: 'none',
            }}
            placeholder="owner@business.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.email && <div className="invalid-feedback">{errors.email}</div>}
        </div>

        <div className="mb-2">
          <label className="form-label small fw-semibold text-secondary mb-2">Password</label>
          <div className="input-group">
            <input
              type={showPass ? 'text' : 'password'}
              name="password"
              className={`form-control rounded-start-3 ${errors.password ? 'is-invalid' : ''}`}
              style={{
                minHeight: 46,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRight: 'none',
                padding: '0.65rem 0.95rem',
                boxShadow: 'none',
              }}
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="btn btn-light border-start-0 rounded-end-3"
              style={{
                minHeight: 46,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                color: '#6b7280',
              }}
              onClick={() => setShowPass((s) => !s)}
              tabIndex={-1}
              aria-label="Toggle password"
            >
              <EyeIcon open={showPass} />
            </button>
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>
        </div>

        <div className="text-end mb-4">
          <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none"
            style={{ color: '#ff6a3d', fontSize: '0.85rem', fontWeight: 600 }}
            onClick={onForgotPassword}>
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="btn w-100 fw-semibold text-white rounded-pill py-2"
          style={{
            minHeight: 48,
            background: 'linear-gradient(to right, #ff6a3d, #ff7a3d)',
            border: 'none',
            boxShadow: '0 10px 20px rgba(255, 106, 61, 0.24)',
            fontSize: '0.98rem',
          }}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Signing in...</>
            : <>Sign in {'\u2192'}</>
          }
        </button>
      </form>
    </>
  );
}

function ForgotPasswordForm({ onBack }) {
  const [email, setEmail]   = useState('');
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!emailRegex.test(email)) return setError('Enter a valid email address.');
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1000);
  };

  return (
    <>
      <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none mb-4 d-flex align-items-center gap-1"
        style={{ color: '#6b7280' }} onClick={onBack}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
        </svg>
        Back to sign in
      </button>

      <div className="text-left mb-4">
        <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
          style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
          <span className="fw-bold text-white fs-5">R</span>
        </div>
        <h4 className="fw-bold mb-1" style={{ color: '#111827' }}>Reset password</h4>
        <p className="text-muted small">We'll send a reset link to your email</p>
      </div>

      {sent ? (
        <div className="alert alert-success small">
          âœ“ Reset link sent! Check your inbox at <strong>{email}</strong>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="form-label small fw-semibold text-secondary">Email address</label>
            <input
              type="email"
              className={`form-control rounded-3 ${error ? 'is-invalid' : ''}`}
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb', padding: '0.6rem 0.9rem' }}
              placeholder="owner@business.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
            />
            {error && <div className="invalid-feedback">{error}</div>}
          </div>
          <button type="submit"
            className="btn w-100 fw-semibold text-white rounded-pill py-2"
            style={{ background: 'linear-gradient(to right, #f97316, #ea580c)', border: 'none' }}
            disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Sending...</>
              : 'Send Reset Link'
            }
          </button>
        </form>
      )}
    </>
  );
}

export default function Login() {
  const [view, setView] = useState('login');

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>

      {/* â”€â”€ LEFT PANEL â”€â”€ */}
      <div className="d-none d-lg-flex flex-column justify-content-between p-5 text-white"
        style={{ background: 'linear-gradient(160deg, rgb(31, 20, 16) 0%, rgb(45, 26, 16) 50%, rgb(31, 20, 16) 100%)' }}>

        {/* Brand */}
        <div>
          <div className="d-flex align-items-center gap-2 mb-5">
            <div className="d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, rgb(255, 107, 74), rgb(244, 183, 61))',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                fontSize: 20,
                color: 'rgb(31, 20, 16)',
                transform: 'rotate(-5deg)',
              }}>
              <span className="fw-bold">R</span>
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: '1rem', letterSpacing: '0.02em' }}>RaNevra Rewards</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>Merchant Portal</div>
            </div>
          </div>

          <h2 className="fw-bold lh-sm mb-3" style={{ fontSize: '2.2rem' }}>
            Grow loyalty,<br />not just sales.
          </h2>
          <p style={{ opacity: 0.75, fontSize: '0.95rem', maxWidth: 320 }}>
            Manage your rewards program, track customer engagement, and drive repeat business â€” all in one place.
          </p>
        </div>

        {/* Features */}
        <div className="d-flex flex-column gap-3">
          {[
            { icon: 'âš¡', label: 'Real-time points tracking' },
            { icon: 'ðŸŽ', label: 'Flexible rewards catalog' },
            { icon: 'ðŸ“Š', label: 'Rich analytics & insights' },
          ].map(({ icon, label }) => (
            <div key={label} className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)' }}>
                <span style={{ fontSize: '1rem' }}>{icon}</span>
              </div>
              <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p style={{ fontSize: '0.75rem', opacity: 0.45 }}>Â© {new Date().getFullYear()} RaNevra. All rights reserved.</p>
      </div>

      {/* â”€â”€ RIGHT PANEL â”€â”€ */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center p-4"
        style={{ background: '#f9fafb' }}>
        <div className="w-100" style={{ maxWidth: 420 }}>
          <div className="bg-white rounded-4 shadow-sm p-4 p-md-5">
            {view === 'login'
              ? <LoginForm onForgotPassword={() => setView('forgot')} />
              : <ForgotPasswordForm onBack={() => setView('login')} />
            }
          </div>
        </div>
      </div>

    </div>
  );
}
