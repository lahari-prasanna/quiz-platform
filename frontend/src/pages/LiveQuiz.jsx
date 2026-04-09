
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const socket = io('http://localhost:5000', { autoConnect: false });

export default function LiveQuiz() {
  const { sessionCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const joined = useRef(false);
  const timerRef = useRef(null);
  const lastWarnTime = useRef(0);
  const questionRef = useRef(null);
  const answeredRef = useRef(false);
  const endedRef = useRef(false);

  const [question, setQuestion] = useState(null);
  const [leaderboard, setLeaderboard] = useState({});
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState('');
  const [correct, setCorrect] = useState('');
  const [qIndex, setQIndex] = useState(0);
  const [ended, setEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const [flagged, setFlagged] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [showReturnToFS, setShowReturnToFS] = useState(false);

  useEffect(() => { questionRef.current = question; }, [question]);
  useEffect(() => { answeredRef.current = answered; }, [answered]);
  useEffect(() => { endedRef.current = ended; }, [ended]);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.on('connect', () => {
      if (!joined.current) {
        socket.emit('join_session', { sessionCode, userId: user.id, name: user.name });
        joined.current = true;
      }
    });
    if (socket.connected && !joined.current) {
      socket.emit('join_session', { sessionCode, userId: user.id, name: user.name });
      joined.current = true;
    }
    socket.on('receive_question', ({ question, index }) => {
      setQuestion(question); setQIndex(index);
      setAnswered(false); setSelected(''); setCorrect('');
      setTimeLeft(30); setTimerActive(true);
    });
    socket.on('leaderboard_update', (data) => setLeaderboard(data));
    socket.on('session_ended', () => { setEnded(true); endedRef.current = true; });
    socket.on('flagged_cheating', () => setFlagged(true));
    return () => {
      socket.off('receive_question'); socket.off('leaderboard_update');
      socket.off('session_ended'); socket.off('connect'); socket.off('flagged_cheating');
    };
  }, [sessionCode]);

  const triggerWarning = (msg) => {
    const now = Date.now();
    if (now - lastWarnTime.current < 3000) return;
    lastWarnTime.current = now;
    setWarningMsg(msg); setWarningCount(prev => prev + 1);
    setShowWarning(true); setTimeout(() => setShowWarning(false), 3000);
    socket.emit('tab_switch_warning', { sessionCode, userId: user.id });
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && questionRef.current && !answeredRef.current && !endedRef.current)
        triggerWarning('Tab switch detected');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const handleFSChange = () => {
      const inFS = !!document.fullscreenElement;
      setIsFullscreen(inFS);
      if (!inFS && !showFullscreenPrompt && !endedRef.current) {
        setShowReturnToFS(true);
        if (questionRef.current && !answeredRef.current) triggerWarning('Fullscreen exit detected');
      } else if (inFS) setShowReturnToFS(false);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, [showFullscreenPrompt]);

  useEffect(() => {
    const block = (e) => e.preventDefault();
    document.addEventListener('contextmenu', block);
    return () => document.removeEventListener('contextmenu', block);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const blocked = (
        (e.ctrlKey && ['c','u','s','a','p'].includes(e.key.toLowerCase())) ||
        (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'
      );
      if (blocked) { e.preventDefault(); e.stopPropagation(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const enterFullscreen = () => {
    document.documentElement.requestFullscreen()
      .then(() => { setIsFullscreen(true); setShowFullscreenPrompt(false); setShowReturnToFS(false); })
      .catch(() => { setShowFullscreenPrompt(false); setShowReturnToFS(false); });
  };

  useEffect(() => {
    if (!timerActive || answered) return;
    if (timeLeft === 0) {
      setAnswered(true); setTimerActive(false); setCorrect(question?.answer || '');
      socket.emit('submit_answer', { sessionCode, userId: user.id, answer: 'TIMEOUT', correctAnswer: question?.answer });
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, timerActive, answered]);

  const submitAnswer = (answer) => {
    if (answered || flagged) return;
    clearTimeout(timerRef.current); setTimerActive(false);
    setSelected(answer); setCorrect(question.answer); setAnswered(true);
    socket.emit('submit_answer', { sessionCode, userId: user.id, answer, correctAnswer: question.answer });
  };

  const timerColor = timeLeft > 15 ? '#059669' : timeLeft > 5 ? '#d97706' : '#dc2626';
  const timerPct = (timeLeft / 30) * 100;
  const sortedBoard = Object.entries(leaderboard)
    .filter(([uid]) => uid !== 'teacher')
    .sort((a, b) => b[1].score - a[1].score);
  const optionLetters = ['A','B','C','D'];

  const getOptClass = (letter) => {
    if (!answered) return 'lq-opt';
    if (letter === correct) return 'lq-opt lq-opt-correct';
    if (letter === selected && selected !== correct) return 'lq-opt lq-opt-wrong';
    return 'lq-opt lq-opt-dim';
  };

  const getOptLetterStyle = (letter) => {
    if (!answered) return {};
    if (letter === correct) return { background:'#059669', color:'white' };
    if (letter === selected && selected !== correct) return { background:'#dc2626', color:'white' };
    return {};
  };

  return (
    <div className="lq-page" onCopy={e=>e.preventDefault()} onPaste={e=>e.preventDefault()} onCut={e=>e.preventDefault()}>
      <style>{css}</style>

      {/* Fullscreen Prompt */}
      {showFullscreenPrompt && (
        <div className="lq-overlay">
          <div className="lq-overlay-card">
            <div className="lq-overlay-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </div>
            <h2 className="lq-overlay-title">Fullscreen Required</h2>
            <p className="lq-overlay-text">This quiz must be taken in fullscreen mode. Exiting fullscreen will count as a warning. <strong>3 warnings = flagged!</strong></p>
            <button className="lq-overlay-btn" onClick={enterFullscreen}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
              Enter Fullscreen & Start Quiz
            </button>
          </div>
        </div>
      )}

      {/* Return to Fullscreen */}
      {showReturnToFS && !flagged && (
        <div className="lq-overlay lq-overlay-red">
          <div className="lq-overlay-card">
            <div className="lq-overlay-icon lq-overlay-icon-red">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 className="lq-overlay-title lq-text-red">Quiz Paused!</h2>
            <p className="lq-overlay-text">You exited fullscreen. Warning <strong>{warningCount}/3</strong> recorded.</p>
            <button className="lq-overlay-btn lq-overlay-btn-red" onClick={enterFullscreen}>Return to Fullscreen</button>
          </div>
        </div>
      )}

      {/* Warning Toast */}
      {showWarning && !flagged && (
        <div className="lq-toast">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div>
            <p className="lq-toast-title">Warning {warningCount}/3 — {warningMsg}</p>
            <p className="lq-toast-sub">3 warnings will get you flagged</p>
          </div>
        </div>
      )}

      {/* Flagged */}
      {flagged && (
        <div className="lq-overlay">
          <div className="lq-overlay-card">
            <div className="lq-overlay-icon lq-overlay-icon-red">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            </div>
            <h2 className="lq-overlay-title lq-text-red">You Have Been Flagged</h2>
            <p className="lq-overlay-text">You violated quiz rules 3 or more times. Your teacher has been notified.</p>
            <button className="lq-overlay-btn lq-overlay-btn-red" onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              socket.disconnect(); joined.current = false; navigate('/student');
            }}>Return to Dashboard</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="lq-header">
        <div className="lq-header-left">
          <div className="lq-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span className="lq-logo-text">QuizAI</span>
          <span className="lq-session-badge">{sessionCode}</span>
        </div>
        <div className="lq-header-right">
          <span className="lq-player-name">{user?.name}</span>
          {isFullscreen && <span className="lq-fs-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            <span className="lq-badge-label">Fullscreen</span>
          </span>}
          {warningCount > 0 && !flagged && (
            <span className="lq-warn-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
              {warningCount}/3
            </span>
          )}
        </div>
      </div>

      <div className="lq-body">
        {/* Question Area */}
        <div className="lq-question-area">

          {!question && !ended && (
            <div className="lq-waiting">
              <div className="lq-waiting-pulse">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3 className="lq-waiting-title">Waiting for teacher...</h3>
              <p className="lq-waiting-sub">The quiz will begin shortly</p>
            </div>
          )}

          {question && !ended && (
            <>
              {/* Timer */}
              <div className="lq-timer-card">
                <div className="lq-timer-top">
                  <span className="lq-q-counter">Question {qIndex + 1}</span>
                  <span className="lq-timer-num" style={{color: timerColor}}>{timeLeft}s</span>
                </div>
                <div className="lq-timer-track">
                  <div className="lq-timer-fill" style={{width:`${timerPct}%`, background: timerColor, transition:'width 1s linear, background 0.5s'}}/>
                </div>
              </div>

              {/* Feedback */}
              {answered && (
                <div className="lq-feedback" style={{
                  background: !selected?'#fef3c7': selected===correct?'#dcfce7':'#fee2e2',
                  borderColor: !selected?'#fcd34d': selected===correct?'#86efac':'#fca5a5',
                  color: !selected?'#92400e': selected===correct?'#166534':'#991b1b',
                }}>
                  {!selected
                    ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Time's up! Correct: {correct}</>
                    : selected===correct
                    ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Correct! +10 points</>
                    : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Wrong! Correct: {correct}</>
                  }
                </div>
              )}

              {/* Question */}
              <div className="lq-question-card">
                <p className="lq-question-text" onCopy={e=>e.preventDefault()}>{question.question}</p>
              </div>

              {/* Options */}
              <div className="lq-options-grid">
                {question.options.map((opt, i) => {
                  const letter = optionLetters[i];
                  const text = opt.replace(/^[ABCD]\)\s*/, '');
                  return (
                    <button key={i}
                      className={getOptClass(letter)}
                      onClick={() => submitAnswer(letter)}
                      disabled={answered || flagged}
                      onCopy={e=>e.preventDefault()}>
                      <span className="lq-opt-letter" style={getOptLetterStyle(letter)}>{letter}</span>
                      <span style={{userSelect:'none'}}>{text}</span>
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className="lq-next-hint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Waiting for next question...
                </div>
              )}
            </>
          )}

          {ended && (
            <div className="lq-end-state">
              <div className="lq-trophy">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
              </div>
              <h2 className="lq-end-title">Quiz Complete!</h2>
              <p className="lq-end-sub">Check the leaderboard for your final ranking</p>
              <button className="lq-end-btn" onClick={() => {
                if (document.fullscreenElement) document.exitFullscreen();
                socket.disconnect(); joined.current = false; navigate('/student');
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Back to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <div className="lq-sidebar">
          <div className="lq-sidebar-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            <h3 className="lq-sidebar-title">Leaderboard</h3>
          </div>
          {sortedBoard.length === 0 ? (
            <div className="lq-lb-empty">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p className="lq-lb-empty-text">Waiting for players</p>
            </div>
          ) : sortedBoard.map(([uid, data], i) => (
            <div key={uid} className="lq-lb-row" style={{
              background: uid===user.id?'linear-gradient(135deg,#eff6ff,#ecfdf5)':'white',
              border: uid===user.id?'1.5px solid #bfdbfe':'1.5px solid #f1f5f9',
            }}>
              <span className="lq-lb-rank" style={{
                background: i===0?'#fef3c7':i===1?'#f1f5f9':i===2?'#fef3c7':'#f8fafc',
                color: i===0?'#d97706':i===1?'#64748b':i===2?'#b45309':'#94a3b8'
              }}>{i===0?'1st':i===1?'2nd':i===2?'3rd':`${i+1}th`}</span>
              <div className="lq-lb-info">
                <p className="lq-lb-name">
                  {data.name}{uid===user.id?' (You)':''}
                  {data.flagged && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{marginLeft:'4px'}}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
                </p>
              </div>
              <span className="lq-lb-score">{data.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lq-page { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Header */
  .lq-header { background: linear-gradient(135deg,#1e3a8a,#1d4ed8); height: 60px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
  .lq-header-left { display: flex; align-items: center; gap: 10px; }
  .lq-logo { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .lq-logo-text { font-size: 16px; font-weight: 800; color: white; }
  .lq-session-badge { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 1px; }
  .lq-header-right { display: flex; align-items: center; gap: 8px; }
  .lq-player-name { color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lq-fs-badge { background: rgba(5,150,105,0.3); color: #6ee7b7; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; }
  .lq-warn-badge { background: rgba(220,38,38,0.3); color: #fca5a5; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; display: flex; align-items: center; gap: 4px; }

  /* Body */
  .lq-body { display: grid; grid-template-columns: 1fr 260px; gap: 20px; padding: 20px 24px; max-width: 1100px; margin: 0 auto; }
  .lq-question-area { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

  /* Waiting */
  .lq-waiting { background: white; border-radius: 16px; padding: 60px 32px; text-align: center; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .lq-waiting-pulse { width: 72px; height: 72px; background: #eff6ff; border-radius: 18px; display: flex; align-items: center; justify-content: center; animation: lq-pulse 2s ease-in-out infinite; }
  .lq-waiting-title { font-size: 20px; font-weight: 700; color: #0f172a; }
  .lq-waiting-sub { font-size: 14px; color: #64748b; }

  /* Timer */
  .lq-timer-card { background: white; border-radius: 12px; padding: 14px 18px; border: 1px solid #e2e8f0; }
  .lq-timer-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .lq-q-counter { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .lq-timer-num { font-size: 22px; font-weight: 800; }
  .lq-timer-track { height: 8px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
  .lq-timer-fill { height: 100%; border-radius: 999px; }

  /* Feedback */
  .lq-feedback { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: 12px; border: 1px solid; font-size: 14px; font-weight: 600; }

  /* Question card */
  .lq-question-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
  .lq-question-text { font-size: 18px; font-weight: 600; color: #0f172a; line-height: 1.5; user-select: none; }

  /* Options */
  .lq-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .lq-opt { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; text-align: left; font-size: 14px; font-weight: 500; color: #374151; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; }
  .lq-opt:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37,99,235,0.15); border-color: #2563eb; }
  .lq-opt-correct { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #dcfce7; border: 1.5px solid #86efac; border-radius: 12px; cursor: default; text-align: left; font-size: 14px; font-weight: 600; color: #166534; font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; }
  .lq-opt-wrong { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #fee2e2; border: 1.5px solid #fca5a5; border-radius: 12px; cursor: default; text-align: left; font-size: 14px; font-weight: 500; color: #991b1b; font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; }
  .lq-opt-dim { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #f8fafc; border: 1.5px solid #f1f5f9; border-radius: 12px; cursor: default; text-align: left; font-size: 14px; font-weight: 500; color: #94a3b8; opacity: 0.6; font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; }
  .lq-opt-letter { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; background: #e2e8f0; color: #64748b; }

  .lq-next-hint { display: flex; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; font-size: 13px; padding: 6px; }

  /* End state */
  .lq-end-state { background: white; border-radius: 16px; padding: 52px 32px; text-align: center; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 14px; }
  .lq-trophy { width: 90px; height: 90px; background: #fef3c7; border-radius: 22px; display: flex; align-items: center; justify-content: center; }
  .lq-end-title { font-size: 26px; font-weight: 800; color: #0f172a; }
  .lq-end-sub { font-size: 14px; color: #64748b; }
  .lq-end-btn { padding: 13px 28px; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; margin-top: 4px; }
  .lq-end-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  /* Sidebar */
  .lq-sidebar { background: white; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; height: fit-content; position: sticky; top: 20px; }
  .lq-sidebar-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
  .lq-sidebar-title { font-size: 14px; font-weight: 700; color: #0f172a; }
  .lq-lb-empty { display: flex; flex-direction: column; align-items: center; padding: 24px 0; gap: 8px; }
  .lq-lb-empty-text { font-size: 13px; color: #94a3b8; }
  .lq-lb-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; margin-bottom: 8px; }
  .lq-lb-rank { font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 6px; white-space: nowrap; }
  .lq-lb-info { flex: 1; min-width: 0; }
  .lq-lb-name { font-size: 13px; font-weight: 600; color: #0f172a; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lq-lb-score { font-size: 16px; font-weight: 800; color: #2563eb; flex-shrink: 0; }

  /* Overlay */
  .lq-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.88); display: flex; align-items: center; justify-content: center; z-index: 3000; backdrop-filter: blur(8px); padding: 20px; }
  .lq-overlay-red { background: rgba(185,28,28,0.95); }
  .lq-overlay-card { background: white; border-radius: 20px; padding: 40px 32px; max-width: 440px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.3); }
  .lq-overlay-icon { width: 68px; height: 68px; background: #eff6ff; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
  .lq-overlay-icon-red { background: #fef2f2; }
  .lq-overlay-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
  .lq-text-red { color: #dc2626 !important; }
  .lq-overlay-text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
  .lq-overlay-btn { width: 100%; padding: 13px; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .lq-overlay-btn:hover { opacity: 0.9; }
  .lq-overlay-btn-red { background: #dc2626; }

  /* Toast */
  .lq-toast { position: fixed; top: 20px; right: 20px; background: #dc2626; color: white; padding: 14px 16px; border-radius: 12px; z-index: 1000; display: flex; gap: 12px; align-items: flex-start; max-width: 280px; box-shadow: 0 8px 24px rgba(220,38,38,0.4); }
  .lq-toast-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .lq-toast-sub { font-size: 12px; opacity: 0.85; }

  @keyframes lq-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.8} }

  /* ── RESPONSIVE ─────────────────────────────── */

  @media (max-width: 900px) {
    .lq-body { grid-template-columns: 1fr; }
    .lq-sidebar { position: static; }
    .lq-options-grid { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 640px) {
    .lq-header { padding: 0 14px; height: auto; min-height: 56px; padding-top: 8px; padding-bottom: 8px; }
    .lq-badge-label { display: none; }
    .lq-body { padding: 12px; gap: 12px; }
    .lq-question-text { font-size: 15px; }
    .lq-options-grid { grid-template-columns: 1fr; gap: 10px; }
    .lq-opt, .lq-opt-correct, .lq-opt-wrong, .lq-opt-dim { padding: 12px 14px; font-size: 13px; }
    .lq-waiting { padding: 40px 20px; }
    .lq-end-state { padding: 36px 20px; }
    .lq-end-title { font-size: 22px; }
    .lq-overlay-card { padding: 28px 20px; }
    .lq-overlay-title { font-size: 18px; }
    .lq-toast { max-width: 240px; top: 12px; right: 12px; }
    .lq-question-card { padding: 18px; }
    .lq-timer-card { padding: 12px 14px; }
  }

  @media (max-width: 400px) {
    .lq-logo-text { font-size: 14px; }
    .lq-session-badge { display: none; }
    .lq-question-text { font-size: 14px; }
    .lq-timer-num { font-size: 18px; }
    .lq-body { padding: 10px; }
  }
`;
