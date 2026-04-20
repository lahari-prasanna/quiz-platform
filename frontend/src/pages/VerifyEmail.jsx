import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get(`https://quiz-platform-backend-bgiv.onrender.com/api/auth/verify-email/${token}`)
      .then(res => { setStatus('success'); setMsg(res.data.msg); })
      .catch(err => { setStatus('error'); setMsg(err.response?.data?.msg || 'Verification failed'); });
  }, [token]);

  return (
    <div className="ve-page">
      <style>{css}</style>
      <div className="ve-card">
        <div className="ve-icon" style={{background: status==='loading'?'#eff6ff': status==='success'?'#ecfdf5':'#fef2f2'}}>
          {status === 'loading' && <div className="ve-spinner"/>}
          {status === 'success' && <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
          {status === 'error' && <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
        </div>
        <h2 className="ve-title" style={{color: status==='success'?'#059669': status==='error'?'#dc2626':'#0f172a'}}>
          {status==='loading'?'Verifying...': status==='success'?'Email Verified!':'Verification Failed'}
        </h2>
        <p className="ve-msg">{msg || 'Please wait while we verify your email...'}</p>
        {status !== 'loading' && (
          <Link to="/login" className="ve-btn">Go to Login</Link>
        )}
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .ve-page { min-height: 100vh; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; }
  .ve-card { background: white; border-radius: 20px; padding: 48px 36px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
  .ve-icon { width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
  .ve-spinner { width: 36px; height: 36px; border: 3px solid #bfdbfe; border-top-color: #2563eb; border-radius: 50%; animation: ve-spin 0.8s linear infinite; }
  @keyframes ve-spin { to { transform: rotate(360deg); } }
  .ve-title { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
  .ve-msg { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }
  .ve-btn { display: inline-flex; align-items: center; padding: 13px 32px; background: linear-gradient(135deg, #2563eb, #059669); color: white; border-radius: 10px; font-size: 15px; font-weight: 700; text-decoration: none; transition: all 0.2s; }
  .ve-btn:hover { opacity: 0.9; transform: translateY(-1px); }
`;
