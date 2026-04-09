
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter a session code'); return; }
    navigate(`/quiz/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="sd-page">
      <style>{css}</style>

      <div className="sd-header">
        <div className="sd-header-left">
          <div className="sd-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
          <span className="sd-logo-text">QuizAI</span>
          <span className="sd-role-tag">Student</span>
        </div>
        <div className="sd-header-right">
          <span className="sd-user-name">{user?.name}</span>
          <button className="sd-header-btn" onClick={() => navigate('/student/history')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
            <span className="sd-btn-label">My History</span>
          </button>
          <button className="sd-ghost-btn" onClick={logout}>Sign Out</button>
        </div>
      </div>

      <div className="sd-body">
        <div className="sd-welcome">
          <h2 className="sd-welcome-title">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="sd-welcome-sub">Enter a session code to join a live quiz</p>
        </div>

        <div className="sd-main-grid">
          <div className="sd-join-card">
            <div className="sd-join-top">
              <div className="sd-join-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              </div>
              <div>
                <h3 className="sd-join-title">Join a Quiz Session</h3>
                <p className="sd-join-sub">Get the code from your teacher</p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="sd-form">
              <input className="sd-code-input" type="text" placeholder="ABC123"
                value={code} maxLength={6}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} />
              {error && (
                <div className="sd-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
              <button className="sd-primary-btn" type="submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Join Session
              </button>
            </form>

            <div className="sd-steps-wrap">
              <p className="sd-steps-title">How it works</p>
              {[
                'Get the session code from your teacher',
                'Enter the code above and click Join',
                'Wait for the teacher to start the quiz',
                'Answer each question within 30 seconds',
                'Watch your rank on the live leaderboard',
              ].map((text, i) => (
                <div key={i} className="sd-step">
                  <span className="sd-step-num">{i+1}</span>
                  <span className="sd-step-text">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sd-info-col">
            {[
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>, title:'Real-Time Quiz', desc:'Answer questions live with your class. See your rank instantly.', bg:'#eff6ff', border:'#bfdbfe' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title:'30 Seconds Per Question', desc:'Each question has a 30-second timer. Answer quickly!', bg:'#ecfdf5', border:'#86efac' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, title:'Stay Honest', desc:'Tab switching and fullscreen exit are monitored. 3 warnings = flagged.', bg:'#f5f3ff', border:'#c4b5fd' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>, title:'Live Leaderboard', desc:'See where you stand among classmates in real time.', bg:'#fef3c7', border:'#fcd34d' },
            ].map((item, i) => (
              <div key={i} className="sd-info-card" style={{background:item.bg, border:`1px solid ${item.border}`}}>
                <div className="sd-info-icon">{item.icon}</div>
                <div>
                  <p className="sd-info-title">{item.title}</p>
                  <p className="sd-info-desc">{item.desc}</p>
                </div>
              </div>
            ))}

            <button className="sd-history-btn" onClick={() => navigate('/student/history')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
              View My Quiz History
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .sd-page { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }
  .sd-header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); height: 64px; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; }
  .sd-header-left { display: flex; align-items: center; gap: 12px; }
  .sd-logo { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .sd-logo-text { font-size: 18px; font-weight: 800; color: white; }
  .sd-role-tag { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
  .sd-header-right { display: flex; align-items: center; gap: 10px; }
  .sd-user-name { color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500; }
  .sd-header-btn { padding: 7px 14px; background: rgba(255,255,255,0.15); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .sd-header-btn:hover { background: rgba(255,255,255,0.25); }
  .sd-ghost-btn { padding: 7px 14px; background: transparent; color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .sd-ghost-btn:hover { background: rgba(255,255,255,0.15); }

  .sd-body { padding: 32px; max-width: 1000px; margin: 0 auto; }
  .sd-welcome { margin-bottom: 28px; }
  .sd-welcome-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .sd-welcome-sub { font-size: 15px; color: #64748b; }

  .sd-main-grid { display: grid; grid-template-columns: 420px 1fr; gap: 24px; }
  .sd-join-card { background: white; border-radius: 20px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(37,99,235,0.08); }
  .sd-join-top { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
  .sd-join-icon { width: 56px; height: 56px; background: #eff6ff; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sd-join-title { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .sd-join-sub { font-size: 13px; color: #64748b; }

  .sd-form { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
  .sd-code-input { width: 100%; padding: 18px 20px; border: 2px solid #e2e8f0; border-radius: 12px; font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: 8px; text-align: center; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; }
  .sd-code-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .sd-error { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 10px 14px; border-radius: 8px; font-size: 13px; }
  .sd-primary-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #2563eb, #059669); color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .sd-primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .sd-steps-wrap { border-top: 1px solid #f1f5f9; padding-top: 20px; }
  .sd-steps-title { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .sd-step { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f8fafc; }
  .sd-step-num { width: 24px; height: 24px; background: linear-gradient(135deg, #2563eb, #059669); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .sd-step-text { font-size: 13px; color: #64748b; }

  .sd-info-col { display: flex; flex-direction: column; gap: 14px; }
  .sd-info-card { display: flex; align-items: flex-start; gap: 14px; padding: 18px; border-radius: 14px; }
  .sd-info-icon { flex-shrink: 0; margin-top: 2px; }
  .sd-info-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .sd-info-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
  .sd-history-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; background: linear-gradient(135deg, #2563eb, #059669); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; margin-top: 4px; }
  .sd-history-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .sd-header { padding: 0 20px; }
    .sd-body { padding: 20px; }
    .sd-main-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 768px) {
    .sd-header { height: auto; padding: 12px 16px; }
    .sd-user-name { display: none; }
    .sd-body { padding: 16px; }
    .sd-welcome-title { font-size: 20px; }
    .sd-main-grid { grid-template-columns: 1fr; }
    .sd-join-card { padding: 24px 20px; }
    .sd-info-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .sd-history-btn { grid-column: 1 / -1; }
  }
  @media (max-width: 480px) {
    .sd-header { padding: 10px 14px; }
    .sd-role-tag { display: none; }
    .sd-btn-label { display: none; }
    .sd-header-btn { padding: 8px 10px; }
    .sd-body { padding: 12px; }
    .sd-welcome-title { font-size: 18px; }
    .sd-code-input { font-size: 22px; letter-spacing: 6px; padding: 14px; }
    .sd-info-col { grid-template-columns: 1fr; }
    .sd-join-card { padding: 20px 16px; }
  }
  @media (max-width: 360px) {
    .sd-logo-text { font-size: 16px; }
    .sd-code-input { font-size: 18px; letter-spacing: 4px; }
  }
`;
