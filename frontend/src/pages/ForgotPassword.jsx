import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.msg || 'Something went wrong');
    }
    setLoading(false);
  };

  return (
    <div className="fp-page">
      <style>{css}</style>

      <div className="fp-left">
        <div className="fp-left-content">
          <div className="fp-brand-mark">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <h1 className="fp-brand-name">QuizAI</h1>
          <p className="fp-brand-tagline">AI-Powered Real-Time Quiz Platform</p>
          <div className="fp-features">
            {[
              'Secure password recovery',
              'Reset link valid for 30 minutes',
              'Check spam if email not received',
            ].map((f, i) => (
              <div key={i} className="fp-feature-item">
                <span className="fp-feature-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span className="fp-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="fp-left-footer">RGUKT RK Valley · CSE Department</div>
      </div>

      <div className="fp-right">
        <div className="fp-form-wrap">

          {!sent ? (
            <>
              <div className="fp-form-header">
                <div className="fp-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h2 className="fp-title">Forgot Password?</h2>
                <p className="fp-subtitle">Enter your email and we'll send you a reset link</p>
              </div>

              {error && (
                <div className="fp-error">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="fp-form">
                <div className="fp-field">
                  <label className="fp-label">Email address</label>
                  <div className="fp-input-wrap">
                    <span className="fp-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    </span>
                    <input className="fp-input" type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <button className={loading?'fp-btn-disabled':'fp-btn-primary'} type="submit" disabled={loading}>
                  {loading
                    ? <><span className="fp-spinner"/>Sending...</>
                    : <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>Send Reset Link</>
                  }
                </button>
              </form>

              <p className="fp-back-link">
                Remember your password? <Link to="/login" className="fp-link-a">Sign in</Link>
              </p>
            </>
          ) : (
            <div className="fp-success">
              <div className="fp-success-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h3 className="fp-success-title">Check your email!</h3>
              <p className="fp-success-text">
                We sent a password reset link to <strong>{email}</strong>. It expires in 30 minutes.
              </p>
              <div className="fp-success-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
                Don't see it? Check your spam folder.
              </div>
              <Link to="/login" className="fp-btn-primary" style={{textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .fp-page { display: flex; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; }

  .fp-left { width: 45%; background: linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 40%,#059669 100%); padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
  .fp-left-content {}
  .fp-brand-mark { width: 72px; height: 72px; background: rgba(255,255,255,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
  .fp-brand-name { font-size: 36px; font-weight: 800; color: white; margin-bottom: 8px; }
  .fp-brand-tagline { font-size: 15px; color: rgba(255,255,255,0.75); margin-bottom: 48px; }
  .fp-features { display: flex; flex-direction: column; gap: 16px; }
  .fp-feature-item { display: flex; align-items: center; gap: 14px; color: rgba(255,255,255,0.9); }
  .fp-feature-icon { width: 34px; height: 34px; background: rgba(255,255,255,0.15); border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .fp-feature-text { font-size: 14px; font-weight: 500; }
  .fp-left-footer { color: rgba(255,255,255,0.5); font-size: 13px; }

  .fp-right { flex: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 48px; }
  .fp-form-wrap { width: 100%; max-width: 420px; }
  .fp-form-header { text-align: center; margin-bottom: 32px; }
  .fp-icon-wrap { width: 68px; height: 68px; background: #eff6ff; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
  .fp-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .fp-subtitle { font-size: 14px; color: #64748b; }

  .fp-error { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 20px; }

  .fp-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
  .fp-field { display: flex; flex-direction: column; gap: 6px; }
  .fp-label { font-size: 14px; font-weight: 600; color: #374151; }
  .fp-input-wrap { position: relative; }
  .fp-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; }
  .fp-input { width: 100%; padding: 12px 14px 12px 42px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; color: #0f172a; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; background: white; }
  .fp-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

  .fp-btn-primary { width: 100%; padding: 13px; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .fp-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .fp-btn-disabled { width: 100%; padding: 13px; background: #94a3b8; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .fp-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: fp-spin 0.8s linear infinite; display: inline-block; }
  @keyframes fp-spin { to { transform: rotate(360deg); } }

  .fp-back-link { text-align: center; font-size: 14px; color: #64748b; }
  .fp-link-a { color: #2563eb; font-weight: 600; text-decoration: none; }
  .fp-link-a:hover { text-decoration: underline; }

  .fp-success { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .fp-success-icon { width: 80px; height: 80px; background: #ecfdf5; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
  .fp-success-title { font-size: 22px; font-weight: 800; color: #0f172a; }
  .fp-success-text { font-size: 14px; color: #64748b; line-height: 1.6; }
  .fp-success-note { display: flex; align-items: center; gap: 6px; background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; padding: 10px 16px; border-radius: 10px; font-size: 13px; font-weight: 500; width: 100%; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .fp-left { width: 40%; padding: 36px; }
    .fp-right { padding: 36px; }
    .fp-brand-name { font-size: 28px; }
  }
  @media (max-width: 768px) {
    .fp-page { flex-direction: column; }
    .fp-left { width: 100%; padding: 20px 24px; flex-direction: row; align-items: center; justify-content: flex-start; gap: 14px; }
    .fp-left-content { display: flex; align-items: center; gap: 14px; }
    .fp-brand-mark { width: 44px; height: 44px; margin-bottom: 0; flex-shrink: 0; }
    .fp-brand-name { font-size: 20px; margin-bottom: 2px; }
    .fp-brand-tagline { font-size: 12px; margin-bottom: 0; }
    .fp-features { display: none; }
    .fp-left-footer { display: none; }
    .fp-right { padding: 24px 20px; align-items: flex-start; }
    .fp-form-wrap { max-width: 100%; }
  }
  @media (max-width: 480px) {
    .fp-left { padding: 16px; }
    .fp-right { padding: 20px 16px; }
    .fp-title { font-size: 22px; }
    .fp-input { font-size: 14px; }
    .fp-btn-primary, .fp-btn-disabled { font-size: 14px; padding: 12px; }
  }
  @media (max-width: 360px) {
    .fp-brand-name { font-size: 17px; }
    .fp-title { font-size: 20px; }
  }
`;
