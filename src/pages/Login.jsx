import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_EMAIL    = 'owner@business.com';
const VALID_PASSWORD = 'owner123';

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" viewBox="0 0 16 16">
      <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7 7 0 0 0-2.79.588l.77.771A6 6 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755q-.247.248-.517.486z" />
      <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829" />
      <path d="M3.35 5.47q-.27.24-.518.487A13 13 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7 7 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" viewBox="0 0 16 16">
      <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z" />
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0" />
    </svg>
  );
}

function LoginForm({ onForgotPassword }) {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [errors, setErrors]   = useState({});
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!emailRegex.test(form.email))   e.email    = 'Enter a valid email address.';
    if (form.password.length < 6)       e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoginError('');
    setLoading(true);

    // Simulate a brief loading state then check hardcoded credentials
    setTimeout(() => {
      if (form.email === VALID_EMAIL && form.password === VALID_PASSWORD) {
        localStorage.setItem('authToken', 'demo-token');
        navigate('/dashboard');
      } else {
        setLoginError('Invalid email or password. Please try again.');
        setLoading(false);
      }
    }, 800);
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  return (
    <>
      <div className="rn-card-header">
        <div className="rn-logo-badge">
          <span className="rn-logo-r">R</span>
        </div>
        <p className="rn-heading">Sign in</p>
        <p className="rn-subheading">Merchant Portal</p>
      </div>

      {loginError && <div className="rn-alert mb-3">{loginError}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="rn-label">Email address</label>
          <input
            type="email"
            name="email"
            className={`form-control rn-input ${errors.email ? 'is-invalid' : ''}`}
            placeholder="owner@business.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
        </div>

        <div className="mb-2">
          <label className="rn-label">Password</label>
          <div className="input-group">
            <input
              type={showPass ? 'text' : 'password'}
              name="password"
              className={`form-control rn-input ${errors.password ? 'is-invalid' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="rn-eye-btn"
              onClick={() => setShowPass((s) => !s)}
              tabIndex={-1}
              aria-label="Toggle password"
            >
              <EyeIcon open={showPass} />
            </button>
          </div>
          {errors.password && <div className="invalid-feedback d-block">{errors.password}</div>}
        </div>

        <div className="text-end mb-4 mt-2">
          <button
            type="button"
            className="rn-link"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" className="btn rn-btn-signin w-100" disabled={loading}>
          {loading
            ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Signing in...</>
            : 'Sign In'
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
      <button type="button" className="rn-back-link mb-4" onClick={onBack}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8" />
        </svg>
        Back to sign in
      </button>

      <div className="mb-4">
        <p className="rn-heading">Reset password</p>
        <p className="rn-subheading mt-1" style={{textAlign:'center'}}>We'll send a reset link to your email</p>
      </div>

      {sent ? (
        <div className="rn-success-alert">
          ✓ Reset link sent! Check your inbox at <strong>{email}</strong>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label className="rn-label">Email address</label>
            <input
              type="email"
              className={`form-control rn-input ${error ? 'is-invalid' : ''}`}
              placeholder="owner@business.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              autoComplete="email"
              autoFocus
            />
            {error && <div className="invalid-feedback d-block">{error}</div>}
          </div>
          <button type="submit" className="btn rn-btn-signin w-100" disabled={loading}>
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
    <div className="rn-page">
      <div className="rn-glow" />
      <div className="rn-card">
        {view === 'login'
          ? <LoginForm onForgotPassword={() => setView('forgot')} />
          : <ForgotPasswordForm onBack={() => setView('login')} />
        }
      </div>
    </div>
  );
}
