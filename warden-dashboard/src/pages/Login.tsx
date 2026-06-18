import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { API_BASE } from '../types';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem('warden_token', data.token);
        localStorage.setItem('warden_user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      // For now, allow demo bypass if backend auth isn't set up yet
      if (email === 'admin@onekbyte.com' && password === 'warden123') {
        localStorage.setItem('warden_token', 'demo-token');
        localStorage.setItem('warden_user', JSON.stringify({ id: '1', email, role: 'admin' }));
        navigate('/');
      } else {
        setError('Unable to connect to server. Use demo: admin@onekbyte.com / warden123');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background effects */}
      <div className="login-bg-gradient" />
      <div className="login-bg-grid" />

      <div className="login-container">
        {/* Left: Branding Panel */}
        <div className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-logo neu-convex">
              <Shield size={32} />
            </div>
            <h1 className="text-headline-xl" style={{ color: 'var(--primary)' }}>OneKByte Labs</h1>
            <p className="text-body-lg" style={{ color: 'var(--on-surface-variant)' }}>
              Warden AI — Intelligent Campus Surveillance & Access Control
            </p>
            <div className="login-features">
              <div className="login-feature">
                <div className="feature-dot" style={{ background: 'var(--secondary-container)' }} />
                <span className="text-body-sm">Real-time Face Recognition</span>
              </div>
              <div className="login-feature">
                <div className="feature-dot" style={{ background: 'var(--primary-container)' }} />
                <span className="text-body-sm">Edge AI Inference (Jetson Nano)</span>
              </div>
              <div className="login-feature">
                <div className="feature-dot" style={{ background: 'var(--tertiary)' }} />
                <span className="text-body-sm">Automated Attendance & Alerts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="login-form-panel">
          <form className="login-form" onSubmit={handleSubmit}>
            <h2 className="text-headline-md">Access Terminal</h2>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', marginBottom: 'var(--stack-lg)' }}>
              Authenticate to access the Warden Dashboard
            </p>

            {error && (
              <div className="login-error">
                <span className="text-body-sm">{error}</span>
              </div>
            )}

            <div className="input-group">
              <label className="text-label-md" htmlFor="email">EMAIL ADDRESS</label>
              <input
                id="email"
                type="email"
                className="login-input neu-inset"
                placeholder="admin@onekbyte.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="text-label-md" htmlFor="password">PASSWORD</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input neu-inset"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn neu-convex" disabled={loading}>
              <span>{loading ? 'Authenticating...' : 'Initialize Session'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
