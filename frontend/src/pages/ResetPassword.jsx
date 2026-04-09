import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true); setError('');
    try {
      await resetPassword(token, { password: form.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) { setError(err.response?.data?.msg || 'Reset failed'); }
    setLoading(false);
  };

  return (
    <div className="rp-page">
      <style>{css}</style>

      <div className="rp-left">
        <div className="rp-left-content">
          <div className="rp-brand-mark">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <h1 className="rp-brand-name">QuizAI</h1>
          <p className="rp-brand-tagline">AI-Powered Real-Time Quiz Platform</p>
          <div className="rp-features">
            {[
              'Choose a strong password',
              'At least 6 characters required',
              'You will be redirected after reset',
            ].map((f, i) => (
              <div key={i} className="rp-feature-item">
                <span className="rp-feature-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span className="rp-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rp-left-footer">RGUKT RK Valley · CSE Department</div>
      </div>

      <div className="rp-right">
        <div className="rp-form-wrap">

          {!success ? (
            <>
              <div className="rp-form-header">
                <div className="rp-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h2 className="rp-title">Set New Password</h2>
                <p className="rp-subtitle">Choose a strong password for your account</p>
              </div>

              {error && (
                <div className="rp-error">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="rp-form">
                <div className="rp-field">
                  <label className="rp-label">New Password</label>
                  <div className="rp-input-wrap">
                    <span className="rp-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input className="rp-input" type={showPass?'text':'password'}
                      placeholder="Min 6 characters"
                      value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                    <button type="button" className="rp-eye-btn" onClick={() => setShowPass(!showPass)}>
                      {showPass
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                <div className="rp-field">
                  <label className="rp-label">Confirm Password</label>
                  <div className="rp-input-wrap">
                    <span className="rp-input-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input className="rp-input" type={showConfirm?'text':'password'}
                      placeholder="Re-enter your password"
                      value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} required />
                    <button type="button" className="rp-eye-btn" onClick={() => setShowConfirm(!showConfirm)}>
                      {showConfirm
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Password strength indicator */}
                {form.password && (
                  <div className="rp-strength">
                    <div className="rp-strength-bars">
                      {[1,2,3,4].map(n => (
                        <div key={n} className="rp-strength-bar" style={{
                          background: form.password.length >= n*3
                            ? form.password.length >= 10 ? '#059669'
                            : form.password.length >= 7 ? '#d97706' : '#dc2626'
                            : '#e2e8f0'
                        }}/>
                      ))}
                    </div>
                    <span className="rp-strength-text" style={{
                      color: form.password.length >= 10 ? '#059669'
                        : form.password.length >= 7 ? '#d97706' : '#dc2626'
                    }}>
                      {form.password.length >= 10 ? 'Strong' : form.password.length >= 7 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                )}

                <button className={loading?'rp-btn-disabled':'rp-btn-primary'} type="submit" disabled={loading}>
                  {loading
                    ? <><span className="rp-spinner"/>Resetting...</>
                    : <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Reset Password</>
                  }
                </button>
              </form>

              <p className="rp-back-link">
                <Link to="/login" className="rp-link-a">← Back to Login</Link>
              </p>
            </>
          ) : (
            <div className="rp-success">
              <div className="rp-success-icon">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="rp-success-title">Password Reset!</h3>
              <p className="rp-success-text">Your password has been reset successfully. Redirecting to login in 3 seconds...</p>
              <div className="rp-redirect-bar">
                <div className="rp-redirect-fill"/>
              </div>
              <Link to="/login" className="rp-btn-primary" style={{textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                Go to Login Now
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

  .rp-page { display: flex; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; }

  .rp-left { width: 45%; background: linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 40%,#059669 100%); padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
  .rp-brand-mark { width: 72px; height: 72px; background: rgba(255,255,255,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
  .rp-brand-name { font-size: 36px; font-weight: 800; color: white; margin-bottom: 8px; }
  .rp-brand-tagline { font-size: 15px; color: rgba(255,255,255,0.75); margin-bottom: 48px; }
  .rp-features { display: flex; flex-direction: column; gap: 16px; }
  .rp-feature-item { display: flex; align-items: center; gap: 14px; color: rgba(255,255,255,0.9); }
  .rp-feature-icon { width: 34px; height: 34px; background: rgba(255,255,255,0.15); border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rp-feature-text { font-size: 14px; font-weight: 500; }
  .rp-left-footer { color: rgba(255,255,255,0.5); font-size: 13px; }

  .rp-right { flex: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 48px; }
  .rp-form-wrap { width: 100%; max-width: 420px; }
  .rp-form-header { text-align: center; margin-bottom: 32px; }
  .rp-icon-wrap { width: 68px; height: 68px; background: #eff6ff; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
  .rp-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .rp-subtitle { font-size: 14px; color: #64748b; }

  .rp-error { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 20px; }

  .rp-form { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
  .rp-field { display: flex; flex-direction: column; gap: 6px; }
  .rp-label { font-size: 14px; font-weight: 600; color: #374151; }
  .rp-input-wrap { position: relative; }
  .rp-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; }
  .rp-input { width: 100%; padding: 12px 42px 12px 42px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; color: #0f172a; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; background: white; }
  .rp-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .rp-eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; display: flex; align-items: center; }

  .rp-strength { display: flex; align-items: center; gap: 10px; }
  .rp-strength-bars { display: flex; gap: 4px; flex: 1; }
  .rp-strength-bar { height: 4px; flex: 1; border-radius: 999px; transition: background 0.3s; }
  .rp-strength-text { font-size: 12px; font-weight: 600; white-space: nowrap; }

  .rp-btn-primary { width: 100%; padding: 13px; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .rp-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .rp-btn-disabled { width: 100%; padding: 13px; background: #94a3b8; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .rp-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: rp-spin 0.8s linear infinite; display: inline-block; }
  @keyframes rp-spin { to { transform: rotate(360deg); } }

  .rp-back-link { text-align: center; font-size: 14px; }
  .rp-link-a { color: #2563eb; font-weight: 600; text-decoration: none; }
  .rp-link-a:hover { text-decoration: underline; }

  .rp-success { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .rp-success-icon { width: 80px; height: 80px; background: #ecfdf5; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
  .rp-success-title { font-size: 22px; font-weight: 800; color: #0f172a; }
  .rp-success-text { font-size: 14px; color: #64748b; line-height: 1.6; }
  .rp-redirect-bar { width: 100%; height: 4px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
  .rp-redirect-fill { height: 100%; background: linear-gradient(135deg,#2563eb,#059669); border-radius: 999px; animation: rp-progress 3s linear forwards; }
  @keyframes rp-progress { from { width: 0% } to { width: 100% } }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .rp-left { width: 40%; padding: 36px; }
    .rp-right { padding: 36px; }
    .rp-brand-name { font-size: 28px; }
  }
  @media (max-width: 768px) {
    .rp-page { flex-direction: column; }
    .rp-left { width: 100%; padding: 20px 24px; flex-direction: row; align-items: center; gap: 14px; }
    .rp-left-content { display: flex; align-items: center; gap: 14px; }
    .rp-brand-mark { width: 44px; height: 44px; margin-bottom: 0; flex-shrink: 0; }
    .rp-brand-name { font-size: 20px; margin-bottom: 2px; }
    .rp-brand-tagline { font-size: 12px; margin-bottom: 0; }
    .rp-features { display: none; }
    .rp-left-footer { display: none; }
    .rp-right { padding: 24px 20px; align-items: flex-start; }
    .rp-form-wrap { max-width: 100%; }
  }
  @media (max-width: 480px) {
    .rp-left { padding: 16px; }
    .rp-right { padding: 20px 16px; }
    .rp-title { font-size: 22px; }
    .rp-input { font-size: 14px; }
    .rp-btn-primary, .rp-btn-disabled { font-size: 14px; padding: 12px; }
  }
  @media (max-width: 360px) {
    .rp-brand-name { font-size: 17px; }
    .rp-title { font-size: 20px; }
  }
`;
