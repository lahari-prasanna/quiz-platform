
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function StudentHistory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentHistory().then(res => {
      setHistory(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const calcPct = (h) => h.maxScore > 0 ? (h.myScore / h.maxScore) * 100 : 0;

  const avgScore = history.length
    ? (history.reduce((a, h) => a + calcPct(h), 0) / history.length).toFixed(1) : 0;
  const bestScore = history.length
    ? Math.round(Math.max(...history.map(h => calcPct(h)))) : 0;
  const passCount = history.filter(h => calcPct(h) >= 40).length;

  const getGrade = (pct) => {
    if (pct >= 90) return { text: 'A+', bg: '#dcfce7', color: '#166534' };
    if (pct >= 80) return { text: 'A',  bg: '#dcfce7', color: '#166534' };
    if (pct >= 70) return { text: 'B',  bg: '#dbeafe', color: '#1e40af' };
    if (pct >= 60) return { text: 'C',  bg: '#fef3c7', color: '#92400e' };
    if (pct >= 40) return { text: 'D',  bg: '#fef3c7', color: '#b45309' };
    return           { text: 'F',  bg: '#fee2e2', color: '#991b1b' };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } } }
  };

  const lineData = {
    labels: history.map((_, i) => `Quiz ${i + 1}`),
    datasets: [{
      label: 'Score %',
      data: history.map(h => Math.round(calcPct(h))),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.1)',
      borderWidth: 2,
      pointBackgroundColor: '#2563eb',
      pointRadius: 5,
      tension: 0.4,
      fill: true,
    }]
  };

  const barData = {
    labels: history.map((_, i) => `Q${i + 1}`),
    datasets: [{
      label: 'Score %',
      data: history.map(h => Math.round(calcPct(h))),
      backgroundColor: history.map(h => {
        const pct = calcPct(h);
        return pct >= 70 ? 'rgba(5,150,105,0.8)' : pct >= 40 ? 'rgba(217,119,6,0.8)' : 'rgba(220,38,38,0.8)';
      }),
      borderRadius: 8,
    }]
  };

  return (
    <div className="sh-page">
      <style>{css}</style>

      <div className="sh-header">
        <div className="sh-header-left">
          <div className="sh-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span className="sh-logo-text">QuizAI</span>
          <span className="sh-page-tag">My History</span>
        </div>
        <div className="sh-header-right">
          <button className="sh-ghost-btn" onClick={() => navigate('/student')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="sh-btn-label">Dashboard</span>
          </button>
          <button className="sh-ghost-btn" onClick={logout}>Sign Out</button>
        </div>
      </div>

      <div className="sh-body">

        {loading && (
          <div className="sh-center">
            <div className="sh-spinner"/>
            <p className="sh-muted">Loading your history...</p>
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="sh-center">
            <div className="sh-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
            </div>
            <h3 className="sh-empty-title">No quiz history yet</h3>
            <p className="sh-muted">Join a session to see your results here</p>
            <button className="sh-primary-btn" onClick={() => navigate('/student')}>Join a Quiz</button>
          </div>
        )}

        {!loading && history.length > 0 && (
          <>
            {/* Stats */}
            <div className="sh-stats-row">
              {[
                { label:'Quizzes Taken', value: history.length, bg:'#eff6ff', border:'#bfdbfe',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
                { label:'Average Score', value: avgScore+'%', bg:'#f5f3ff', border:'#c4b5fd',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
                { label:'Best Score', value: bestScore+'%', bg:'#fef3c7', border:'#fcd34d',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg> },
                { label:'Quizzes Passed', value: passCount, bg:'#ecfdf5', border:'#86efac',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
              ].map((s,i) => (
                <div key={i} className="sh-stat-card" style={{background:s.bg, border:`1.5px solid ${s.border}`}}>
                  <div className="sh-stat-icon">{s.icon}</div>
                  <div className="sh-stat-val">{s.value}</div>
                  <div className="sh-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="sh-charts-row">
              <div className="sh-card">
                <div className="sh-card-head">
                  <div className="sh-card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div>
                    <h3 className="sh-card-title">Score Progress</h3>
                    <p className="sh-card-sub">Your performance over time (%)</p>
                  </div>
                </div>
                <div className="sh-chart-box">
                  <Line data={lineData} options={chartOptions}/>
                </div>
              </div>

              <div className="sh-card">
                <div className="sh-card-head">
                  <div className="sh-card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  </div>
                  <div>
                    <h3 className="sh-card-title">Score Breakdown</h3>
                    <p className="sh-card-sub">Green = Pass · Orange = Average · Red = Fail</p>
                  </div>
                </div>
                <div className="sh-chart-box">
                  <Bar data={barData} options={chartOptions}/>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="sh-card sh-table-card">
              <div className="sh-card-head">
                <div className="sh-card-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <h3 className="sh-card-title">Quiz History</h3>
                  <p className="sh-card-sub">{history.length} sessions completed</p>
                </div>
              </div>
              <div className="sh-table-wrap">
                <table className="sh-table">
                  <thead>
                    <tr>
                      {['#','Quiz Title','Score','Percentage','Grade','Date'].map(h=>(
                        <th key={h} className="sh-th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h,i) => {
                      const pct = Math.round(calcPct(h));
                      const grade = getGrade(pct);
                      return (
                        <tr key={i} style={{background: i%2===0?'white':'#fafafa'}}>
                          <td className="sh-td"><span className="sh-num">{i+1}</span></td>
                          <td className="sh-td"><span className="sh-quiz-name">{h.quizTitle||'Quiz Session'}</span></td>
                          <td className="sh-td"><strong style={{color:'#0f172a'}}>{h.myScore} / {h.maxScore}</strong></td>
                          <td className="sh-td">
                            <div className="sh-pct-wrap">
                              <div className="sh-pct-track">
                                <div className="sh-pct-fill" style={{width:`${pct}%`, background:pct>=70?'#059669':pct>=40?'#d97706':'#dc2626'}}/>
                              </div>
                              <span className="sh-pct-text">{pct}%</span>
                            </div>
                          </td>
                          <td className="sh-td">
                            <span className="sh-grade" style={{background:grade.bg, color:grade.color}}>{grade.text}</span>
                          </td>
                          <td className="sh-td">
                            <span className="sh-date">{new Date(h.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sh-page { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Header */
  .sh-header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); height: 60px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; }
  .sh-header-left { display: flex; align-items: center; gap: 10px; }
  .sh-logo { width: 34px; height: 34px; background: rgba(255,255,255,0.2); border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sh-logo-text { font-size: 17px; font-weight: 800; color: white; }
  .sh-page-tag { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
  .sh-header-right { display: flex; align-items: center; gap: 10px; }
  .sh-ghost-btn { padding: 7px 14px; background: transparent; color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 6px; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; }
  .sh-ghost-btn:hover { background: rgba(255,255,255,0.15); }

  /* Body */
  .sh-body { padding: 24px 28px; max-width: 1200px; margin: 0 auto; }

  /* Center states */
  .sh-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 14px; text-align: center; }
  .sh-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: sh-spin 0.8s linear infinite; }
  @keyframes sh-spin { to { transform: rotate(360deg); } }
  .sh-muted { color: #64748b; font-size: 14px; }
  .sh-empty-icon { width: 80px; height: 80px; background: #f1f5f9; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
  .sh-empty-title { font-size: 20px; font-weight: 700; color: #374151; }
  .sh-primary-btn { padding: 12px 28px; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }
  .sh-primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  /* Stats */
  .sh-stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
  .sh-stat-card { border-radius: 14px; padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; }
  .sh-stat-icon { margin-bottom: 2px; }
  .sh-stat-val { font-size: 30px; font-weight: 800; color: #0f172a; line-height: 1; }
  .sh-stat-label { font-size: 13px; color: #64748b; font-weight: 500; }

  /* Charts */
  .sh-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }

  /* Card */
  .sh-card { background: white; border-radius: 16px; padding: 22px; border: 1px solid #e2e8f0; }
  .sh-card-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
  .sh-card-icon { width: 36px; height: 36px; background: #f8fafc; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #e2e8f0; }
  .sh-card-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .sh-card-sub { font-size: 12px; color: #64748b; }

  /* Chart box — KEY FIX */
  .sh-chart-box { position: relative; width: 100%; height: 220px; }

  /* Table */
  .sh-table-card { margin-bottom: 0; }
  .sh-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .sh-table { width: 100%; border-collapse: collapse; min-width: 500px; }
  .sh-th { padding: 10px 14px; background: #f8fafc; font-size: 11px; font-weight: 700; color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  .sh-td { padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .sh-num { background: #f1f5f9; color: #64748b; font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
  .sh-quiz-name { font-weight: 600; color: #0f172a; }
  .sh-pct-wrap { display: flex; align-items: center; gap: 8px; }
  .sh-pct-track { width: 60px; height: 6px; background: #f1f5f9; border-radius: 999px; overflow: hidden; flex-shrink: 0; }
  .sh-pct-fill { height: 100%; border-radius: 999px; }
  .sh-pct-text { font-size: 12px; font-weight: 600; color: #374151; white-space: nowrap; }
  .sh-grade { font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .sh-date { color: #64748b; font-size: 13px; }

  /* ── RESPONSIVE ─────────────────────────────── */

/* Tablet */
@media (max-width: 900px) {
  .sh-stats-row { grid-template-columns: repeat(2,1fr); gap: 12px; }
  .sh-charts-row { grid-template-columns: 1fr; }
  .sh-chart-box { height: 200px; }
}

/* Mobile */
@media (max-width: 640px) {
  .sh-header { padding: 0 16px; height: auto; min-height: 56px; padding-top: 10px; padding-bottom: 10px; }
  .sh-page-tag { display: none; }
  .sh-btn-label { display: none; }
  .sh-body { padding: 14px; }
  .sh-stats-row { grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px; }
  .sh-stat-card { padding: 14px; }
  .sh-stat-val { font-size: 22px; }
  .sh-stat-label { font-size: 11px; }
  .sh-charts-row { grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px; }
  .sh-chart-box { height: 220px; }
  .sh-card { padding: 16px; }
  .sh-card-title { font-size: 13px; }
  .sh-pct-track { width: 40px; }
}

/* Small mobile */
@media (max-width: 400px) {
  .sh-logo-text { font-size: 15px; }
  .sh-stats-row { grid-template-columns: repeat(2,1fr); gap: 8px; }
  .sh-stat-val { font-size: 18px; }
  .sh-stat-label { font-size: 10px; }
  .sh-ghost-btn { padding: 6px 10px; font-size: 12px; }
  .sh-chart-box { height: 180px; }
}`