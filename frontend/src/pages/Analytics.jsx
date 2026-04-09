
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeacherStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { exportToCSV } from '../utils/exportCSV';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Analytics() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exported, setExported] = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const res = await getTeacherStats();
      setSessions(res.data);
      if (res.data.length > 0) setSelected(res.data[0]);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleExport = () => {
    exportToCSV(selected);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const getBarData = (session) => {
    if (!session?.finalScores?.length) return null;
    return {
      labels: session.finalScores.map(s => s.name),
      datasets: [{
        label: 'Score',
        data: session.finalScores.map(s => s.score),
        backgroundColor: session.finalScores.map(s => s.flagged ? '#fca5a5' : 'rgba(37,99,235,0.8)'),
        borderColor: session.finalScores.map(s => s.flagged ? '#dc2626' : '#2563eb'),
        borderWidth: 2, borderRadius: 8,
      }]
    };
  };

  const getDoughnutData = (session) => {
    if (!session?.finalScores?.length) return null;
    const maxScore = (session.quiz?.questions?.length || 5) * 10;
    const avg = session.finalScores.reduce((a, b) => a + b.score, 0) / session.finalScores.length;
    return {
      labels: ['Average Score', 'Remaining'],
      datasets: [{ 
        data: [parseFloat(avg.toFixed(1)), parseFloat(Math.max(0, maxScore - avg).toFixed(1))], 
        backgroundColor: ['#2563eb', '#e2e8f0'], 
        borderWidth: 0 
      }]
    };
  };

  const getResult = (pct, flagged) => {
    if (flagged) return { text:'Flagged', bg:'#fef2f2', color:'#dc2626' };
    if (pct >= 70) return { text:'Pass', bg:'#dcfce7', color:'#166534' };
    if (pct >= 40) return { text:'Average', bg:'#fef3c7', color:'#92400e' };
    return { text:'Fail', bg:'#fee2e2', color:'#991b1b' };
  };

  const totalFlagged = sessions.reduce((a, s) => a + (s.finalScores?.filter(f => f.flagged)?.length || 0), 0);
  const totalStudents = sessions.reduce((a, s) => a + (s.finalScores?.length || 0), 0);

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } } }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  };

  return (
    <div className="an-page">
      <style>{css}</style>

      <div className="an-header">
        <div className="an-header-left">
          <div className="an-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span className="an-logo-text">QuizAI</span>
          <span className="an-page-tag">Analytics</span>
        </div>
        <div className="an-header-right">
          <button className="an-ghost-btn" onClick={() => navigate('/teacher')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="an-btn-label">Dashboard</span>
          </button>
          <button className="an-ghost-btn" onClick={logout}>Sign Out</button>
        </div>
      </div>

      <div className="an-body">

        {loading && (
          <div className="an-center">
            <div className="an-spinner"/>
            <p className="an-loading-text">Loading analytics...</p>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="an-center">
            <div className="an-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </div>
            <h3 className="an-empty-title">No sessions yet</h3>
            <p className="an-empty-sub">Run a quiz session to see analytics here</p>
            <button className="an-primary-btn" onClick={() => navigate('/teacher')}>Go to Dashboard</button>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <>
            {/* Stats Row */}
            <div className="an-stats-row">
              {[
                { label:'Total Sessions', value: sessions.length, color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
                { label:'Total Students', value: totalStudents, color:'#059669', bg:'#ecfdf5', border:'#86efac',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
                { label:'Completed', value: sessions.filter(s=>s.status==='ended').length, color:'#7c3aed', bg:'#f5f3ff', border:'#c4b5fd',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> },
                { label:'Flagged', value: totalFlagged, color:'#dc2626', bg:'#fef2f2', border:'#fecaca',
                  icon:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
              ].map((s,i) => (
                <div key={i} className="an-stat-card" style={{background:s.bg, border:`1.5px solid ${s.border}`}}>
                  <div className="an-stat-icon">{s.icon}</div>
                  <div className="an-stat-val" style={{color:s.color}}>{s.value}</div>
                  <div className="an-stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Main Layout */}
            <div className="an-main-grid">

              {/* Left — Session List */}
              <div className="an-card an-sessions-card">
                <div className="an-card-head">
                  <div className="an-card-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <div>
                    <h3 className="an-card-title">Sessions</h3>
                    <p className="an-card-sub">Select to view details</p>
                  </div>
                </div>
                <div className="an-session-list">
                  {sessions.map(s => (
                    <div key={s._id}
                      className={`an-session-item ${selected?._id===s._id ? 'active' : ''}`}
                      onClick={() => setSelected(s)}>
                      <div className="an-session-dot"/>
                      <div className="an-session-info">
                        <p className="an-session-title">{s.quiz?.title || 'Untitled'}</p>
                        <p className="an-session-meta">{s.sessionCode} · {s.finalScores?.length||0} students</p>
                        <p className="an-session-meta">{new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="an-session-badges">
                        <span className="an-status-badge" style={{
                          background: s.status==='ended'?'#dcfce7':'#fef3c7',
                          color: s.status==='ended'?'#166534':'#92400e'
                        }}>{s.status}</span>
                        {s.finalScores?.some(f=>f.flagged) && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Charts + Table */}
              <div className="an-right-col">

                {!selected && (
                  <div className="an-card an-hint-card">
                    <div className="an-hint-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                    </div>
                    <p className="an-hint-title">Select a session</p>
                    <p className="an-hint-sub">Click any session on the left to view its results</p>
                  </div>
                )}

                {selected && (
                  <>
                    {/* Charts */}
                    <div className="an-charts-row">
                      <div className="an-card an-chart-card">
                        <div className="an-card-head">
                          <div className="an-card-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                          </div>
                          <div>
                            <h3 className="an-card-title">Student Scores</h3>
                            <p className="an-card-sub">Red = flagged</p>
                          </div>
                        </div>
                        <div className="an-chart-box">
                          {getBarData(selected)
                            ? <Bar data={getBarData(selected)} options={barOptions}/>
                            : <div className="an-no-data">No data yet</div>}
                        </div>
                      </div>

                      <div className="an-card an-chart-card">
                        <div className="an-card-head">
                          <div className="an-card-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </div>
                          <div>
                            <h3 className="an-card-title">Average Score</h3>
                            <p className="an-card-sub">Out of {(selected.quiz?.questions?.length||5)*10} pts</p>
                          </div>
                        </div>
                        <div className="an-chart-box an-doughnut-box">
                          {getDoughnutData(selected) ? <>
                            <Doughnut data={getDoughnutData(selected)} options={doughnutOptions}/>
                            <p className="an-avg-text">
                              {(selected.finalScores.reduce((a,b)=>a+b.score,0)/selected.finalScores.length).toFixed(1)} / {(selected.quiz?.questions?.length||5)*10} pts avg
                            </p>
                          </> : <div className="an-no-data">No data yet</div>}
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    {selected?.finalScores?.length > 0 && (
                      <div className="an-card an-table-card">
                        <div className="an-table-top">
                          <div className="an-card-head" style={{marginBottom:0}}>
                            <div className="an-card-icon">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </div>
                            <div>
                              <h3 className="an-card-title">Detailed Results</h3>
                              <p className="an-card-sub">{selected.finalScores.length} students</p>
                            </div>
                          </div>
                          <button className={exported?'an-exported-btn':'an-export-btn'} onClick={handleExport}>
                            {exported
                              ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Downloaded!</>
                              : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export CSV</>
                            }
                          </button>
                        </div>
                        <div className="an-table-wrap">
                          <table className="an-table">
                            <thead>
                              <tr>
                                {['Rank','Student','Score','Percentage','Warnings','Result'].map(h=>(
                                  <th key={h} className="an-th">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[...selected.finalScores].sort((a,b)=>b.score-a.score).map((s,i)=>{
                                const maxScore=(selected.quiz?.questions?.length||5)*10;
                                const pct=maxScore>0?Math.round((s.score/maxScore)*100):0;
                                const result=getResult(pct,s.flagged);
                                return (
                                  <tr key={i} style={{background:s.flagged?'#fef2f2':i%2===0?'white':'#fafafa'}}>
                                    <td className="an-td">
                                      <span className="an-rank" style={{
                                        background:i===0?'#fef3c7':i===1?'#f1f5f9':i===2?'#fde8d0':'#f8fafc',
                                        color:i===0?'#d97706':i===1?'#475569':i===2?'#b45309':'#94a3b8'
                                      }}>{i===0?'1st':i===1?'2nd':i===2?'3rd':`#${i+1}`}</span>
                                    </td>
                                    <td className="an-td">
                                      <div className="an-student-cell">
                                        <span className="an-student-name">{s.name}</span>
                                        {s.flagged && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
                                      </div>
                                    </td>
                                    <td className="an-td"><strong>{s.score}</strong></td>
                                    <td className="an-td">
                                      <div className="an-pct-wrap">
                                        <div className="an-pct-track">
                                          <div className="an-pct-fill" style={{width:`${pct}%`, background:pct>=70?'#059669':pct>=40?'#d97706':'#dc2626'}}/>
                                        </div>
                                        <span className="an-pct-text">{pct}%</span>
                                      </div>
                                    </td>
                                    <td className="an-td">
                                      {s.warnings>0
                                        ? <span style={{color:s.flagged?'#dc2626':'#d97706',fontWeight:'700',fontSize:'13px'}}>{s.warnings}</span>
                                        : <span style={{color:'#cbd5e1'}}>—</span>}
                                    </td>
                                    <td className="an-td">
                                      <span className="an-result-badge" style={{background:result.bg,color:result.color}}>{result.text}</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
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

  .an-page { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Header */
  .an-header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); height: 60px; padding: 0 28px; display: flex; align-items: center; justify-content: space-between; }
  .an-header-left { display: flex; align-items: center; gap: 10px; }
  .an-logo { width: 34px; height: 34px; background: rgba(255,255,255,0.2); border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .an-logo-text { font-size: 17px; font-weight: 800; color: white; }
  .an-page-tag { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
  .an-header-right { display: flex; align-items: center; gap: 10px; }
  .an-ghost-btn { padding: 7px 14px; background: transparent; color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; display: flex; align-items: center; gap: 6px; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; }
  .an-ghost-btn:hover { background: rgba(255,255,255,0.15); }

  /* Body */
  .an-body { padding: 24px 28px; max-width: 1300px; margin: 0 auto; }

  /* Center states */
  .an-center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 400px; gap: 14px; text-align: center; }
  .an-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: an-spin 0.8s linear infinite; }
  @keyframes an-spin { to { transform: rotate(360deg); } }
  .an-loading-text { color: #64748b; font-size: 15px; }
  .an-empty-icon { width: 80px; height: 80px; background: #f1f5f9; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
  .an-empty-title { font-size: 20px; font-weight: 700; color: #374151; }
  .an-empty-sub { font-size: 14px; color: #94a3b8; }
  .an-primary-btn { padding: 11px 28px; background: linear-gradient(135deg,#2563eb,#059669); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Stats */
  .an-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .an-stat-card { border-radius: 14px; padding: 18px 20px; display: flex; flex-direction: column; gap: 6px; }
  .an-stat-icon { margin-bottom: 2px; }
  .an-stat-val { font-size: 30px; font-weight: 800; line-height: 1; }
  .an-stat-label { font-size: 13px; color: #64748b; font-weight: 500; }

  /* Main grid */
  .an-main-grid { display: grid; grid-template-columns: 280px 1fr; gap: 20px; align-items: start; }

  /* Card base */
  .an-card { background: white; border-radius: 16px; padding: 22px; border: 1px solid #e2e8f0; }
  .an-card-head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .an-card-icon { width: 36px; height: 36px; background: #f8fafc; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #e2e8f0; }
  .an-card-title { font-size: 14px; font-weight: 700; color: #0f172a; }
  .an-card-sub { font-size: 12px; color: #64748b; margin-top: 1px; }

  /* Session list */
  .an-sessions-card { height: fit-content; }
  .an-session-list { display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto; }
  .an-session-item { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border-radius: 10px; border: 1.5px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
  .an-session-item:hover { border-color: #93c5fd; background: #f8faff; }
  .an-session-item.active { border-color: #2563eb; background: linear-gradient(135deg,#eff6ff,#ecfdf5); }
  .an-session-dot { width: 8px; height: 8px; background: #2563eb; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .an-session-info { flex: 1; min-width: 0; }
  .an-session-title { font-size: 13px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .an-session-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .an-session-badges { display: flex; align-items: center; gap: 5px; flex-shrink: 0; flex-direction: column; align-items: flex-end; }
  .an-status-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; white-space: nowrap; }

  /* Right col */
  .an-right-col { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

  /* Hint */
  .an-hint-card { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 280px; text-align: center; gap: 12px; }
  .an-hint-icon { width: 72px; height: 72px; background: #f1f5f9; border-radius: 18px; display: flex; align-items: center; justify-content: center; }
  .an-hint-title { font-size: 16px; font-weight: 700; color: #374151; }
  .an-hint-sub { font-size: 13px; color: #94a3b8; max-width: 260px; }

  /* Charts row — KEY FIX */
  .an-charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .an-chart-card { min-width: 0; overflow: hidden; }
  .an-chart-box { position: relative; width: 100%; height: 220px; }
  .an-doughnut-box { height: 260px; }
  .an-no-data { display: flex; align-items: center; justify-content: center; height: 180px; color: #94a3b8; font-size: 14px; }
  .an-avg-text { text-align: center; font-size: 13px; font-weight: 600; color: #2563eb; margin-top: 10px; }

  /* Table */
  .an-table-card { overflow: hidden; }
  .an-table-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
  .an-export-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: linear-gradient(135deg,#059669,#0d9488); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; flex-shrink: 0; }
  .an-export-btn:hover { opacity: 0.9; }
  .an-exported-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: #94a3b8; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: default; white-space: nowrap; flex-shrink: 0; }
  .an-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .an-table { width: 100%; border-collapse: collapse; min-width: 520px; }
  .an-th { padding: 10px 12px; background: #f8fafc; font-size: 11px; font-weight: 700; color: #64748b; text-align: left; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  .an-td { padding: 11px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .an-rank { font-size: 11px; font-weight: 700; padding: 3px 7px; border-radius: 6px; }
  .an-student-cell { display: flex; align-items: center; gap: 5px; }
  .an-student-name { font-weight: 600; color: #0f172a; }
  .an-pct-wrap { display: flex; align-items: center; gap: 8px; }
  .an-pct-track { width: 60px; height: 6px; background: #e2e8f0; border-radius: 999px; overflow: hidden; flex-shrink: 0; }
  .an-pct-fill { height: 100%; border-radius: 999px; }
  .an-pct-text { font-size: 12px; font-weight: 600; color: #374151; white-space: nowrap; }
  .an-result-badge { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }

  /* ── RESPONSIVE ─────────────────────────────── */

  @media (max-width: 1100px) {
    .an-main-grid { grid-template-columns: 240px 1fr; }
  }

  @media (max-width: 900px) {
    .an-stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .an-main-grid { grid-template-columns: 1fr; }
    .an-session-list { max-height: 220px; }
    .an-charts-row { grid-template-columns: 1fr 1fr; }
  }

  @media (max-width: 640px) {
    .an-header { padding: 0 16px; height: auto; min-height: 56px; flex-wrap: wrap; gap: 8px; padding-top: 10px; padding-bottom: 10px; }
    .an-page-tag { display: none; }
    .an-btn-label { display: none; }
    .an-body { padding: 14px; }
    .an-stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
    .an-stat-card { padding: 14px; }
    .an-stat-val { font-size: 24px; }
    .an-stat-label { font-size: 11px; }
    .an-charts-row { grid-template-columns: 1fr; gap: 14px; }
    .an-chart-box { height: 200px; }
    .an-doughnut-box { height: 240px; }
    .an-card { padding: 16px; }
    .an-pct-track { width: 40px; }
  }

  @media (max-width: 400px) {
    .an-stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .an-stat-val { font-size: 20px; }
    .an-stat-label { font-size: 10px; }
    .an-logo-text { font-size: 15px; }
    .an-ghost-btn { padding: 6px 10px; font-size: 12px; }
  }
`;
