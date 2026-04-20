import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { resendVerification } from '../services/api';

export default function VerifyEmailSent() {
  const location = useLocation();
  const email = location.state?.email || '';
  const [resendMsg, setResendMsg] = useState('');
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    if (!email) {
      setResendError('No email found. Please register again.');
      return;
    }
    try {
      await resendVerification(email);
      setResendMsg('Verification email resent! Check your inbox.');
      setResendError('');
    } catch (err) {
      setResendError(err.response?.data?.msg || 'Failed to resend');
      setResendMsg('');
    }
  };

  return (
    <div className="ves-page">
      <style>{fullCss}</style>
      <div className="ves-card">
        <div className="ves-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>
        <h2 className="ves-title">Verify your email address</h2>
        <p className="ves-message">
          We've sent a verification link to <strong>{email}</strong>.<br />
          Please click the link to activate your account.
        </p>
        <div className="ves-note">
          <span>✉️ Didn't receive the email?</span>
          <button className="ves-resend" onClick={handleResend}>
            Resend Verification Email
          </button>
          {resendMsg && <p className="ves-success-msg">{resendMsg}</p>}
          {resendError && <p className="ves-error-msg">{resendError}</p>}
        </div>
        <Link to="/login" className="ves-login-link">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}


const fullCss = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .ves-page { min-height: 100vh; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-family: 'Plus Jakarta Sans', sans-serif; padding: 20px; }
  .ves-card { background: white; border-radius: 20px; padding: 48px 36px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
  .ves-icon { width: 80px; height: 80px; background: #eff6ff; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
  .ves-title { font-size: 26px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
  .ves-message { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 28px; }
  .ves-note { background: #f8fafc; padding: 20px; border-radius: 12px; font-size: 14px; color: #64748b; margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
  .ves-input { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; transition: all 0.2s; }
  .ves-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .ves-resend { background: linear-gradient(135deg, #2563eb, #059669); color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .ves-resend:hover { opacity: 0.9; transform: translateY(-1px); }
  .ves-success-msg { color: #059669; font-size: 13px; margin-top: 4px; }
  .ves-error-msg { color: #dc2626; font-size: 13px; margin-top: 4px; }
  .ves-login-link { display: inline-block; color: #64748b; text-decoration: none; font-size: 14px; transition: color 0.2s; margin-top: 8px; }
  .ves-login-link:hover { color: #2563eb; }
`;
