
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, googleLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { signInWithGoogle } from '../services/firebase';

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await registerUser(form);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) { setError(err.response?.data?.msg || 'Registration failed'); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const result = await signInWithGoogle();
      if (!result) return;
      const { displayName, email, uid } = result.user;
      const res = await googleLogin({ name: displayName, email, googleId: uid, role: 'student' });
      if (!res.data.isNewUser) {
        login(res.data.token, res.data.user);
        navigate(res.data.user.role === 'teacher' ? '/teacher' : '/student');
      } else {
        setGoogleUser({ name: displayName, email, googleId: uid });
        setShowRoleModal(true);
      }
    } catch (err) { setError('Google login failed: ' + (err.message || 'Unknown error')); }
  };

  const handleRoleSelect = async (role) => {
    setShowRoleModal(false);
    try {
      const res = await googleLogin({ ...googleUser, role });
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'teacher' ? '/teacher' : '/student');
    } catch (err) { setError('Login failed: ' + (err.response?.data?.msg || err.message)); }
  };

  return (
    <div className="page">
      <style>{css}</style>

      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <h3 className="modal-title">Welcome, {googleUser?.name}!</h3>
            <p className="modal-sub">How are you joining the platform?</p>
            <div className="role-row">
              <button className="role-card" onClick={() => handleRoleSelect('student')}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" style={{marginBottom:'10px'}}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <div className="role-label">Student</div>
                <div className="role-desc">Join quiz sessions</div>
              </button>
              <button className="role-card" onClick={() => handleRoleSelect('teacher')}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5" style={{marginBottom:'10px'}}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                <div className="role-label">Teacher</div>
                <div className="role-desc">Create & manage quizzes</div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="left-panel">
        <div className="left-content">
          <div className="brand-mark">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <h1 className="brand-name">QuizAI</h1>
          <p className="brand-tagline">AI-Powered Real-Time Quiz Platform</p>
          <div className="feature-list">
            {[
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>, text: 'Generate quizzes from any PDF instantly' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, text: 'Real-time sessions with live leaderboard' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, text: 'Built-in anti-cheat protection' },
              { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, text: 'Detailed analytics & CSV export' },
            ].map((f, i) => (
              <div key={i} className="feature-item">
                <span className="feature-icon">{f.icon}</span>
                <span className="feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="left-footer">RGUKT RK Valley · CSE Department</div>
      </div>

      <div className="right-panel">
        <div className="form-wrap">
          <div className="form-header">
            <h2 className="form-title">Create your account</h2>
            <p className="form-subtitle">Join thousands of students and teachers</p>
          </div>

          {error && (
            <div className="error-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className="field-group">
              <label className="label">Full Name</label>
              <div className="input-wrap">
                <span className="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <input className="input-field" type="text" placeholder="Your full name"
                  value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
            </div>

            <div className="field-group">
              <label className="label">Email address</label>
              <div className="input-wrap">
                <span className="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                <input className="input-field" type="email" placeholder="you@example.com"
                  value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
            </div>

            <div className="field-group">
              <label className="label">Password</label>
              <div className="input-wrap">
                <span className="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input className="input-field" type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 characters" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} required />
                <button type="button" className="show-pass-btn" onClick={() => setShowPass(!showPass)}>
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div className="field-group">
              <label className="label">I am a</label>
              <div className="role-toggle">
                {['student','teacher'].map(r => (
                  <button key={r} type="button"
                    className={`role-option ${form.role === r ? 'selected' : ''}`}
                    onClick={() => setForm({...form, role: r})}>
                    {r === 'student'
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    }
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button className={loading ? 'btn-disabled' : 'btn-primary'} type="submit" disabled={loading}>
              {loading ? <><span className="spinner"/> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <div className="divider">
            <div className="div-line"/><span className="div-text">or continue with</span><div className="div-line"/>
          </div>

          <button className="google-btn" onClick={handleGoogle}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="register-link">
            Already have an account?{' '}
            <Link to="/login" className="register-link-a">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .page { display: flex; min-height: 100vh; font-family: 'Plus Jakarta Sans', sans-serif; }
  .left-panel { width: 45%; background: linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 40%, #059669 100%); padding: 48px; display: flex; flex-direction: column; justify-content: space-between; }
  .brand-mark { width: 72px; height: 72px; background: rgba(255,255,255,0.15); border-radius: 20px; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
  .brand-name { font-size: 36px; font-weight: 800; color: white; margin-bottom: 8px; }
  .brand-tagline { font-size: 15px; color: rgba(255,255,255,0.75); margin-bottom: 48px; }
  .feature-list { display: flex; flex-direction: column; gap: 18px; }
  .feature-item { display: flex; align-items: center; gap: 14px; color: rgba(255,255,255,0.9); }
  .feature-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .feature-text { font-size: 14px; font-weight: 500; }
  .left-footer { color: rgba(255,255,255,0.5); font-size: 13px; }

  .right-panel { flex: 1; display: flex; align-items: center; justify-content: center; background: #f8fafc; padding: 48px; overflow-y: auto; }
  .form-wrap { width: 100%; max-width: 420px; }
  .form-header { margin-bottom: 32px; }
  .form-title { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .form-subtitle { font-size: 15px; color: #64748b; }

  .form { display: flex; flex-direction: column; gap: 18px; margin-bottom: 24px; }
  .field-group { display: flex; flex-direction: column; gap: 6px; }
  .label { font-size: 14px; font-weight: 600; color: #374151; }
  .input-wrap { position: relative; }
  .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; }
  .input-field { width: 100%; padding: 12px 14px 12px 42px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; background: white; color: #0f172a; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .input-field:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .show-pass-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; display: flex; align-items: center; }

  .role-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .role-option { padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; font-weight: 600; color: #374151; background: white; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .role-option.selected { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
  .role-option:hover { border-color: #2563eb; }

  .btn-primary { width: 100%; padding: 13px; background: linear-gradient(135deg, #2563eb, #059669); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-disabled { width: 100%; padding: 13px; background: #94a3b8; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .google-btn { width: 100%; padding: 12px; background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-weight: 600; color: #374151; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .google-btn:hover { background: #f8faff; border-color: #2563eb; }

  .error-box { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 14px; margin-bottom: 20px; }
  .divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; }
  .div-line { flex: 1; height: 1px; background: #e2e8f0; }
  .div-text { font-size: 13px; color: #94a3b8; white-space: nowrap; font-weight: 500; }
  .register-link { text-align: center; margin-top: 24px; font-size: 14px; color: #64748b; }
  .register-link-a { color: #2563eb; text-decoration: none; font-weight: 600; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
  .modal { background: white; border-radius: 20px; padding: 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
  .modal-icon-wrap { width: 64px; height: 64px; background: #eff6ff; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
  .modal-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
  .modal-sub { color: #64748b; margin-bottom: 28px; font-size: 15px; }
  .role-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .role-card { padding: 24px 16px; border: 2px solid #e2e8f0; border-radius: 14px; background: white; cursor: pointer; text-align: center; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; }
  .role-card:hover { border-color: #2563eb; background: #eff6ff; transform: translateY(-2px); }
  .role-label { font-weight: 700; font-size: 16px; color: #0f172a; margin-bottom: 4px; }
  .role-desc { font-size: 13px; color: #64748b; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .left-panel { width: 40%; padding: 36px; }
    .brand-name { font-size: 28px; }
    .right-panel { padding: 36px; }
  }
  @media (max-width: 768px) {
    .page { flex-direction: column; }
    .left-panel { width: 100%; padding: 20px 24px; flex-direction: row; align-items: center; }
    .left-content { display: flex; align-items: center; gap: 14px; flex: 1; }
    .brand-mark { width: 44px; height: 44px; margin-bottom: 0; flex-shrink: 0; }
    .brand-name { font-size: 20px; margin-bottom: 2px; }
    .brand-tagline { font-size: 12px; margin-bottom: 0; }
    .feature-list { display: none; }
    .left-footer { display: none; }
    .right-panel { padding: 24px 20px; align-items: flex-start; }
    .form-wrap { max-width: 100%; }
    .form-title { font-size: 22px; }
  }
  @media (max-width: 480px) {
    .left-panel { padding: 16px; }
    .right-panel { padding: 20px 16px; }
    .form-title { font-size: 20px; }
    .input-field { font-size: 14px; }
    .btn-primary, .btn-disabled, .google-btn { font-size: 14px; padding: 12px; }
    .role-toggle { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 360px) {
    .brand-name { font-size: 16px; }
    .form-title { font-size: 18px; }
  }
`;
