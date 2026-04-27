import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://quiz-platform-backend-service.onrender.com';

export default function TeacherLiveSession() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const { sessionCode, questions, title } = state || {};
  const [currentQ, setCurrentQ] = useState(0);
  const [sent, setSent] = useState(false);
  const [leaderboard, setLeaderboard] = useState({});
  const [sessionEnded, setSessionEnded] = useState(false);
  const [cheatAlerts, setCheatAlerts] = useState([]);

  useEffect(() => {
    if (!sessionCode) return navigate('/teacher');

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('✅ Teacher connected:', socket.id);
      socket.emit('join_session', { sessionCode, userId: 'teacher', name: 'Teacher' });
    });

    socket.on('reconnect', () => {
      console.log('🔄 Teacher reconnected!');
      socket.emit('join_session', { sessionCode, userId: 'teacher', name: 'Teacher' });
    });

    socket.on('leaderboard_update', (data) => setLeaderboard(data));

    socket.on('cheat_warning', ({ name, warningCount, flagged }) => {
      const msg = flagged
        ? `${name} has been flagged for cheating!`
        : `${name} switched tabs (warning ${warningCount}/3)`;
      setCheatAlerts(prev => [{ id: Date.now(), msg, flagged }, ...prev].slice(0, 5));
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Teacher disconnected:', reason);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendQuestion = () => {
    if (currentQ >= questions.length) return;
    socketRef.current.emit('send_question', {
      sessionCode,
      question: questions[currentQ],
      index: currentQ
    });
    setSent(true);
  };

  const nextQuestion = () => { setCurrentQ(currentQ + 1); setSent(false); };

  const endSession = () => {
    socketRef.current.emit('end_session', { sessionCode });
    setSessionEnded(true);
  };

  const sortedBoard = Object.entries(leaderboard)
    .filter(([uid]) => uid !== 'teacher')
    .sort((a, b) => b[1].score - a[1].score);

  if (sessionEnded) {
    return (
      <div className="tls-page">
        <style>{css}</style>
        <div className="tls-header">
          <div className="tls-header-left">
            <div className="tls-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <span className="tls-logo-text">QuizAI</span>
            <span className="tls-session-badge">{sessionCode}</span>
          </div>
          <span className="tls-ended-tag">Session Ended</span>
        </div>

        <div className="tls-ended-wrap">
          <div className="tls-ended-card">
            <div className="tls-ended-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            </div>
            <h2 className="tls-ended-title">Final Results — {title}</h2>
            <p className="tls-ended-sub">{sortedBoard.length} student{sortedBoard.length!==1?'s':''} participated</p>

            <div className="tls-final-list">
              {sortedBoard.length === 0 && <p className="tls-no-students">No students participated</p>}
              {sortedBoard.map(([uid, data], i) => (
                <div key={uid} className="tls-final-row" style={{
                  background: i===0?'linear-gradient(135deg,#fef3c7,#fffbeb)':i===1?'linear-gradient(135deg,#f1f5f9,#f8fafc)':'white',
                  border: i===0?'1.5px solid #fcd34d':i===1?'1.5px solid #e2e8f0':'1.5px solid #f1f5f9'
                }}>
                  <div className="tls-final-rank" style={{
                    background: i===0?'#fef3c7':i===1?'#e2e8f0':i===2?'#fef3c7':'#f8fafc',
                    color: i===0?'#d97706':i===1?'#475569':i===2?'#b45309':'#94a3b8'
                  }}>{i===0?'1st':i===1?'2nd':i===2?'3rd':`#${i+1}`}</div>
                  <div className="tls-final-info">
                    <p className="tls-final-name">
                      {data.name}
                      {data.flagged && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{marginLeft:'6px'}}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
                      {data.warnings>0 && !data.flagged && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{marginLeft:'6px'}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>}
                    </p>
                    {data.flagged && <p className="tls-flagged-label">Flagged for cheating</p>}
                    {data.warnings>0 && !data.flagged && <p className="tls-warn-label">{data.warnings} warning{data.warnings>1?'s':''}</p>}
                  </div>
                  <div className="tls-final-score">
                    <span className="tls-final-score-num">{data.score}</span>
                    <span className="tls-final-score-label">pts</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="tls-ended-btns">
              <button className="tls-primary-btn" onClick={() => navigate('/teacher/analytics')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                View Analytics
              </button>
              <button className="tls-ghost-btn" onClick={() => navigate('/teacher')}>Back to Dashboard</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tls-page">
      <style>{css}</style>

      <div className="tls-header">
        <div className="tls-header-left">
          <div className="tls-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span className="tls-logo-text">QuizAI</span>
          <span className="tls-session-badge">{sessionCode}</span>
        </div>
        <div className="tls-header-right">
          <span className="tls-quiz-name">{title}</span>
          <span className="tls-progress-badge">Q{currentQ+1}/{questions?.length}</span>
          <span className="tls-student-count">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {sortedBoard.length}
          </span>
        </div>
      </div>

      <div className="tls-body">
        <div className="tls-left-col">
          <div className="tls-card">
            <div className="tls-card-top">
              <span className="tls-q-badge">Question {currentQ+1} of {questions?.length}</span>
              {sent && (
                <span className="tls-sent-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Sent
                </span>
              )}
            </div>

            <p className="tls-question-text">{questions?.[currentQ]?.question}</p>

            <div className="tls-options-grid">
              {questions?.[currentQ]?.options.map((opt, i) => {
                const isCorrect = opt[0] === questions[currentQ].answer;
                return (
                  <div key={i} className="tls-opt-row" style={{
                    background: isCorrect?'#dcfce7':'#f8fafc',
                    border: isCorrect?'1.5px solid #86efac':'1.5px solid #e2e8f0',
                  }}>
                    <span className="tls-opt-letter" style={{
                      background: isCorrect?'#059669':'#e2e8f0',
                      color: isCorrect?'white':'#64748b'
                    }}>{['A','B','C','D'][i]}</span>
                    <span style={{fontSize:'14px', color:isCorrect?'#166534':'#374151', fontWeight:isCorrect?'600':'400', flex:1}}>
                      {opt.replace(/^[ABCD]\)\s*/,'')}
                    </span>
                    {isCorrect && (
                      <span className="tls-correct-tag">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        Correct
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="tls-action-row">
              {!sent ? (
                <button className="tls-primary-btn" onClick={sendQuestion}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Send to Students
                </button>
              ) : currentQ+1 < questions?.length ? (
                <button className="tls-next-btn" onClick={nextQuestion}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  Next Question
                </button>
              ) : (
                <button className="tls-end-btn" onClick={endSession}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  End Session
                </button>
              )}
            </div>
          </div>

          {cheatAlerts.length > 0 && (
            <div className="tls-alerts-card">
              <div className="tls-alerts-header">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <h4 className="tls-alerts-title">Anti-Cheat Alerts</h4>
              </div>
              {cheatAlerts.map(a => (
                <div key={a.id} className="tls-alert-item" style={{
                  background: a.flagged?'#fef2f2':'#fffbeb',
                  borderLeft: `3px solid ${a.flagged?'#dc2626':'#d97706'}`
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={a.flagged?'#dc2626':'#d97706'} strokeWidth="2">
                    {a.flagged
                      ? <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>
                      : <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></>
                    }
                  </svg>
                  <span style={{fontSize:'13px', color:a.flagged?'#991b1b':'#92400e', fontWeight:'500'}}>{a.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tls-sidebar">
          <div className="tls-sidebar-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
            <h3 className="tls-sidebar-title">Live Leaderboard</h3>
            <span className="tls-lb-count">{sortedBoard.length}</span>
          </div>

          {sortedBoard.length === 0 ? (
            <div className="tls-lb-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <p className="tls-lb-empty-text">Waiting for students...</p>
            </div>
          ) : sortedBoard.map(([uid, data], i) => (
            <div key={uid} className="tls-lb-row" style={{
              background: data.flagged?'#fef2f2':i===0?'linear-gradient(135deg,#fef3c7,#fffbeb)':'white',
              border: data.flagged?'1.5px solid #fecaca':i===0?'1.5px solid #fcd34d':'1.5px solid #f1f5f9'
            }}>
              <span className="tls-lb-rank" style={{
                background: i===0?'#fef3c7':i===1?'#f1f5f9':i===2?'#fef3c7':'#f8fafc',
                color: i===0?'#d97706':i===1?'#475569':i===2?'#b45309':'#94a3b8'
              }}>{i===0?'1st':i===1?'2nd':i===2?'3rd':`#${i+1}`}</span>
              <div className="tls-lb-info">
                <p className="tls-lb-name">
                  {data.name}
                  {data.flagged && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" style={{marginLeft:'4px'}}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
                  {data.warnings>0 && !data.flagged && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" style={{marginLeft:'4px'}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>}
                </p>
                {data.warnings>0 && <p style={{fontSize:'11px', color:data.flagged?'#dc2626':'#d97706'}}>{data.warnings} warning{data.warnings>1?'s':''}</p>}
              </div>
              <span className="tls-lb-score">{data.score}</span>
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

  .tls-page { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }
  .tls-header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); height: 60px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; }
  .tls-header-left { display: flex; align-items: center; gap: 10px; }
  .tls-logo { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .tls-logo-text { font-size: 16px; font-weight: 800; color: white; }
  .tls-session-badge { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; letter-spacing: 1px; }
  .tls-header-right { display: flex; align-items: center; gap: 10px; }
  .tls-quiz-name { color: rgba(255,255,255,0.8); font-size: 13px; font-weight: 500; max-width: 160px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tls-progress-badge { background: rgba(255,255,255,0.15); color: white; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
  .tls-student-count { background: rgba(5,150,105,0.3); color: #6ee7b7; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 20px; display: flex; align-items: center; gap: 5px; }
  .tls-ended-tag { background: rgba(220,38,38,0.2); color: #fca5a5; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; }
  .tls-body { display: grid; grid-template-columns: 1fr 280px; gap: 20px; padding: 20px 24px; max-width: 1100px; margin: 0 auto; }
  .tls-left-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
  .tls-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; }
  .tls-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 8px; }
  .tls-q-badge { background: linear-gradient(135deg,#eff6ff,#ecfdf5); color: #1e40af; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; border: 1px solid #bfdbfe; }
  .tls-sent-badge { display: flex; align-items: center; gap: 6px; background: #dcfce7; color: #166534; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 20px; }
  .tls-question-text { font-size: 18px; font-weight: 700; color: #0f172a; line-height: 1.5; margin-bottom: 20px; }
  .tls-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
  .tls-opt-row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 10px; }
  .tls-opt-letter { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
  .tls-correct-tag { margin-left: auto; display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; color: #059669; white-space: nowrap; }
  .tls-action-row { display: flex; gap: 12px; }
  .tls-primary-btn { flex: 1; padding: 13px; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .tls-primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .tls-next-btn { flex: 1; padding: 13px; background: linear-gradient(135deg,#059669,#0d9488); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .tls-next-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .tls-end-btn { flex: 1; padding: 13px; background: linear-gradient(135deg,#dc2626,#b91c1c); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .tls-end-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .tls-alerts-card { background: white; border-radius: 16px; padding: 18px; border: 1px solid #fee2e2; }
  .tls-alerts-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .tls-alerts-title { font-size: 14px; font-weight: 700; color: #dc2626; }
  .tls-alert-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; margin-bottom: 8px; }
  .tls-sidebar { background: white; border-radius: 16px; padding: 18px; border: 1px solid #e2e8f0; height: fit-content; position: sticky; top: 20px; }
  .tls-sidebar-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9; }
  .tls-sidebar-title { font-size: 14px; font-weight: 700; color: #0f172a; flex: 1; }
  .tls-lb-count { background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
  .tls-lb-empty { display: flex; flex-direction: column; align-items: center; padding: 28px 0; gap: 8px; }
  .tls-lb-empty-text { font-size: 13px; color: #94a3b8; text-align: center; }
  .tls-lb-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; margin-bottom: 8px; }
  .tls-lb-rank { font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 6px; white-space: nowrap; }
  .tls-lb-info { flex: 1; min-width: 0; }
  .tls-lb-name { font-size: 13px; font-weight: 600; color: #0f172a; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tls-lb-score { font-size: 18px; font-weight: 800; color: #2563eb; flex-shrink: 0; }
  .tls-ended-wrap { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 60px); padding: 24px; }
  .tls-ended-card { background: white; border-radius: 20px; padding: 36px; max-width: 560px; width: 100%; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .tls-ended-icon { width: 60px; height: 60px; background: #fef3c7; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .tls-ended-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .tls-ended-sub { font-size: 14px; color: #64748b; margin-bottom: 22px; }
  .tls-final-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; max-height: 400px; overflow-y: auto; }
  .tls-no-students { text-align: center; color: #94a3b8; padding: 20px; }
  .tls-final-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 12px; }
  .tls-final-rank { font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; white-space: nowrap; }
  .tls-final-info { flex: 1; min-width: 0; }
  .tls-final-name { font-size: 14px; font-weight: 600; color: #0f172a; display: flex; align-items: center; }
  .tls-flagged-label { font-size: 12px; color: #dc2626; font-weight: 500; margin-top: 2px; }
  .tls-warn-label { font-size: 12px; color: #d97706; font-weight: 500; margin-top: 2px; }
  .tls-final-score { display: flex; align-items: baseline; gap: 3px; flex-shrink: 0; }
  .tls-final-score-num { font-size: 22px; font-weight: 800; color: #2563eb; }
  .tls-final-score-label { font-size: 12px; color: #94a3b8; }
  .tls-ended-btns { display: flex; gap: 12px; flex-wrap: wrap; }
  .tls-ghost-btn { flex: 1; padding: 13px; background: white; border: 1.5px solid #e2e8f0; color: #374151; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .tls-ghost-btn:hover { background: #f1f5f9; }

  @media (max-width: 900px) {
    .tls-body { grid-template-columns: 1fr; }
    .tls-sidebar { position: static; }
    .tls-options-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .tls-header { padding: 0 14px; height: auto; min-height: 56px; padding-top: 10px; padding-bottom: 10px; flex-wrap: wrap; gap: 8px; }
    .tls-quiz-name { display: none; }
    .tls-body { padding: 12px; gap: 14px; }
    .tls-card { padding: 16px; }
    .tls-question-text { font-size: 15px; }
    .tls-options-grid { grid-template-columns: 1fr; gap: 8px; }
    .tls-primary-btn, .tls-next-btn, .tls-end-btn { font-size: 14px; padding: 12px; }
    .tls-sidebar { padding: 14px; }
    .tls-ended-card { padding: 24px 18px; }
    .tls-ended-title { font-size: 17px; }
    .tls-ended-btns { flex-direction: column; }
    .tls-ghost-btn { flex: none; width: 100%; }
    .tls-primary-btn { flex: none; width: 100%; }
  }
  @media (max-width: 400px) {
    .tls-logo-text { font-size: 15px; }
    .tls-session-badge { display: none; }
    .tls-card { padding: 14px; }
    .tls-question-text { font-size: 14px; }
  }
`;
