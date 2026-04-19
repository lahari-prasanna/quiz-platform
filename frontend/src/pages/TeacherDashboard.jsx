
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuiz, getMyQuizzes, createSession, deleteQuiz } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [numQ, setNumQ] = useState(5);
  const [loading, setLoading] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [sessionCode, setSessionCode] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [showWaiting, setShowWaiting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);

  useEffect(() => { loadQuizzes(); }, []);

  const loadQuizzes = async () => {
    try { const res = await getMyQuizzes(); setQuizzes(res.data); }
    catch (err) { console.error(err); }
    finally { setPageLoading(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!file) { setMsg('Please select a PDF file'); setMsgType('error'); return; }
    setLoading(true); setMsg('⏳ Uploading file to cloud...'); setMsgType('info');
    try {
      const formData = new FormData();
      formData.append('pdf', file); formData.append('title', title || file.name); formData.append('num_questions', numQ);
      await generateQuiz(formData);
      setMsg('Quiz generated successfully!'); setMsgType('success');
      setFile(null); setTitle(''); loadQuizzes();
    } catch (err) { setMsg(err.response?.data?.msg || err.message); setMsgType('error'); }
    setLoading(false);
  };

  const handleStartSession = async (quiz) => {
    try {
      const res = await createSession({ quizId: quiz._id });
      setSessionCode(res.data.sessionCode); setSelectedQuiz(quiz); setShowWaiting(true);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleStartQuiz = () => {
    navigate('/teacher/live', { state: { sessionCode, questions: selectedQuiz.questions, title: selectedQuiz.title } });
  };

  const handleDelete = (quizId, e) => {
    e.stopPropagation();
    setQuizToDelete(quizId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setDeletingId(quizToDelete);
    try {
      await deleteQuiz(quizToDelete);
      setQuizzes(prev => prev.filter(q => q._id !== quizToDelete));
      setMsg('Quiz deleted successfully!'); setMsgType('success');
    } catch (err) {
      setMsg('Failed to delete quiz'); setMsgType('error');
    }
    setDeletingId(null);
    setQuizToDelete(null);
  };

  const sortedQuizzes = [...quizzes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (pageLoading) {
    return (
      <div className="td-page">
        <style>{css}</style>
        <div className="td-header">
          <div className="td-header-left">
            <div className="td-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
            <span className="td-logo-text">QuizAI</span>
          </div>
        </div>
        <div className="td-full-loader">
          <div className="td-loader-spinner"/>
          <p className="td-loader-text">Loading ...</p>
        </div>
      </div>
    );
  }

  if (showWaiting) {
    return (
      <div className="td-page">
        <style>{css}</style>
        <div className="td-header">
          <div className="td-header-left">
            <div className="td-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
            <span className="td-logo-text">QuizAI</span>
          </div>
          <button className="td-ghost-btn" onClick={logout}>Sign Out</button>
        </div>
        <div className="td-waiting-wrap">
          <div className="td-waiting-card">
            <div className="td-waiting-top">
              <div className="td-waiting-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <h2 className="td-waiting-title">Session Ready!</h2>
                <p className="td-waiting-sub">Share the code below with your students</p>
              </div>
            </div>
            <div className="td-code-wrap">
              <p className="td-code-label">SESSION CODE</p>
              <div className="td-code-display">{sessionCode}</div>
              <p className="td-code-hint">Students need to enter this code to join the room</p>
            </div>
            <div className="td-quiz-info-row">
              <div className="td-quiz-info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <span>{selectedQuiz?.title}</span>
              </div>
              <div className="td-quiz-info-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{selectedQuiz?.questions?.length} questions</span>
              </div>
            </div>
            <div className="td-waiting-btns">
              <button className="td-primary-btn" onClick={handleStartQuiz}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Start Quiz Now
              </button>
              <button className="td-ghost-btn" onClick={() => setShowWaiting(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="td-page">
      <style>{css}</style>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="td-modal-overlay">
          <div className="td-modal">
            <div className="td-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="td-modal-title">Delete Quiz?</h3>
            <p className="td-modal-text">This action cannot be undone. The quiz and all its questions will be permanently deleted.</p>
            <div className="td-modal-btns">
              <button className="td-modal-cancel" onClick={() => { setShowDeleteModal(false); setQuizToDelete(null); }}>Cancel</button>
              <button className="td-modal-confirm" onClick={confirmDelete}>Delete Quiz</button>
            </div>
          </div>
        </div>
      )}

      <div className="td-header">
        <div className="td-header-left">
          <div className="td-logo"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
          <span className="td-logo-text">QuizAI</span>
          <span className="td-role-tag">Teacher</span>
        </div>
        <div className="td-header-right">
          <span className="td-user-name">{user?.name}</span>
          <button className="td-header-btn" onClick={() => navigate('/teacher/manual')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span className="td-btn-label">Manual Quiz</span>
          </button>
          <button className="td-header-btn" onClick={() => navigate('/teacher/analytics')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span className="td-btn-label">Analytics</span>
          </button>
          <button className="td-ghost-btn" onClick={logout}>Sign Out</button>
        </div>
      </div>

      <div className="td-body">
        <div className="td-stats-row">
          {[
            { label:'Total Quizzes', value: quizzes.length, color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
            { label:'AI Generated', value: quizzes.filter(q=>q.sourceFile!=='manual').length, color:'#7c3aed', bg:'#f5f3ff', border:'#c4b5fd' },
            { label:'Manual Quizzes', value: quizzes.filter(q=>q.sourceFile==='manual').length, color:'#059669', bg:'#ecfdf5', border:'#86efac' },
            { label:'Total Questions', value: quizzes.reduce((a,q)=>a+(q.questions?.length||0),0), color:'#dc2626', bg:'#fef2f2', border:'#fecaca' },
          ].map((s,i) => (
            <div key={i} className="td-stat-card" style={{background:s.bg, border:`1px solid ${s.border}`, color:s.color}}>
              <div className="td-stat-val">{s.value}</div>
              <div className="td-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="td-main-grid">
          {/* AI Generator */}
          <div className="td-card">
            <div className="td-card-header">
              <div className="td-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
              <div>
                <h3 className="td-card-title">AI Quiz Generator</h3>
                <p className="td-card-sub">Upload a PDF to auto-generate questions</p>
              </div>
            </div>

            {msg && (
              <div className="td-msg" style={{
                background: msgType==='success'?'#ecfdf5':msgType==='error'?'#fef2f2':'#eff6ff',
                borderColor: msgType==='success'?'#86efac':msgType==='error'?'#fecaca':'#bfdbfe',
                color: msgType==='success'?'#166534':msgType==='error'?'#dc2626':'#1e40af',
              }}>{msg}</div>
            )}

            <form onSubmit={handleGenerate} className="td-form">
              <div className="td-field">
                <label className="td-label">Quiz Title <span className="td-optional">(optional)</span></label>
                <input className="td-input" type="text" placeholder="e.g. Machine Learning Quiz"
                  value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="td-field">
                <label className="td-label">PDF File</label>
                <label className="td-file-label">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={file?'#2563eb':'#94a3b8'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  <span style={{color:file?'#2563eb':'#94a3b8', fontWeight:file?'600':'400'}}>{file ? file.name : 'Click to select file (PDF, Word, PPT, TXT)'}</span>
                  <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" style={{display:'none'}} onChange={e=>setFile(e.target.files[0])}/>
                </label>
              </div>
              <div className="td-field">
                <label className="td-label">Number of Questions</label>
                <div className="td-num-row">
                  {[3,5,10,15].map(n => (
                    <button key={n} type="button" className={numQ===n?'td-num-btn-active':'td-num-btn'} onClick={()=>setNumQ(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <button className={loading?'td-btn-disabled':'td-primary-btn'} type="submit" disabled={loading}>
                {loading ? <><span className="td-spinner"/> Generating...</> : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate with AI</>}
              </button>
            </form>
          </div>

          {/* Quiz List */}
          <div className="td-card">
            <div className="td-card-header">
              <div className="td-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
              <div>
                <h3 className="td-card-title">My Quizzes</h3>
                <p className="td-card-sub">{quizzes.length} quiz{quizzes.length!==1?'zes':''} created</p>
              </div>
            </div>
            {quizzes.length === 0 ? (
              <div className="td-empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <p className="td-empty-text">No quizzes yet</p>
                <p className="td-empty-sub">Generate one with AI or create manually</p>
              </div>
            ) : (
              <div className="td-quiz-list">
                {sortedQuizzes.map(quiz => (
                  <div key={quiz._id} className="td-quiz-row">
                    <div className="td-quiz-left">
                      <div className="td-quiz-icon">
                        {quiz.sourceFile==='manual'
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        }
                      </div>
                      <div>
                        <p className="td-quiz-title">{quiz.title}</p>
                        <p className="td-quiz-meta">
                          {quiz.questions?.length} questions &nbsp;·&nbsp;
                          <span style={{color:quiz.sourceFile==='manual'?'#059669':'#7c3aed'}}>{quiz.sourceFile==='manual'?'Manual':'AI'}</span>
                          &nbsp;·&nbsp;{new Date(quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                      <button className="td-delete-btn" onClick={(e)=>handleDelete(quiz._id, e)} disabled={deletingId===quiz._id}>
                        {deletingId===quiz._id
                          ? <span className="td-mini-spinner"/>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        }
                      </button>
                      <button className="td-start-btn" onClick={()=>handleStartSession(quiz)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        Start
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }

  .td-page { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Header */
  .td-header { background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
  .td-header-left { display: flex; align-items: center; gap: 12px; }
  .td-logo { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .td-logo-text { font-size: 18px; font-weight: 800; color: white; }
  .td-role-tag { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
  .td-header-right { display: flex; align-items: center; gap: 10px; }
  .td-user-name { color: rgba(255,255,255,0.8); font-size: 14px; font-weight: 500; }
  .td-header-btn { padding: 7px 14px; background: rgba(255,255,255,0.15); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .td-header-btn:hover { background: rgba(255,255,255,0.25); }
  .td-ghost-btn { padding: 7px 14px; background: transparent; color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .td-ghost-btn:hover { background: rgba(255,255,255,0.15); }

  /* Body */
  .td-body { padding: 24px 32px; max-width: 1200px; margin: 0 auto; }

  /* Stats */
  .td-stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
  .td-stat-card { border-radius: 14px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
  .td-stat-val { font-size: 32px; font-weight: 800; color: #0f172a; line-height: 1; }
  .td-stat-label { font-size: 13px; color: #64748b; font-weight: 500; }

  /* Main grid */
  .td-main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .td-card { background: white; border-radius: 16px; padding: 28px; border: 1px solid #e2e8f0; }
  .td-card-header { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 24px; }
  .td-card-icon { width: 44px; height: 44px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid #e2e8f0; }
  .td-card-title { font-size: 17px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .td-card-sub { font-size: 13px; color: #64748b; }

  /* Form */
  .td-form { display: flex; flex-direction: column; gap: 18px; }
  .td-field { display: flex; flex-direction: column; gap: 6px; }
  .td-label { font-size: 13px; font-weight: 600; color: #374151; }
  .td-optional { color: #94a3b8; font-weight: 400; }
  .td-input { padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #0f172a; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; width: 100%; }
  .td-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
  .td-file-label { display: flex; align-items: center; gap: 10px; padding: 14px; border: 2px dashed #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
  .td-file-label:hover { border-color: #2563eb; background: #eff6ff; }
  .td-num-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .td-num-btn { padding: 8px 18px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: #64748b; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .td-num-btn:hover { border-color: #2563eb; color: #2563eb; }
  .td-num-btn-active { padding: 8px 18px; background: linear-gradient(135deg, #2563eb, #059669); border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; color: white; font-family: 'Plus Jakarta Sans', sans-serif; }
  .td-msg { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-radius: 10px; font-size: 14px; border: 1px solid; margin-bottom: 4px; font-weight: 500; }
  .td-primary-btn { width: 100%; padding: 13px; background: linear-gradient(135deg, #2563eb, #059669); color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
  .td-primary-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .td-btn-disabled { width: 100%; padding: 13px; background: #94a3b8; color: white; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: not-allowed; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .td-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: td-spin 0.8s linear infinite; display: inline-block; }
  @keyframes td-spin { to { transform: rotate(360deg); } }

  /* Quiz List */
  .td-empty { display: flex; flex-direction: column; align-items: center; padding: 40px 20px; gap: 8px; }
  .td-empty-text { font-size: 16px; font-weight: 600; color: #94a3b8; }
  .td-empty-sub { font-size: 13px; color: #cbd5e1; }
  .td-quiz-list { display: flex; flex-direction: column; gap: 10px; max-height: 420px; overflow-y: auto; }
  .td-full-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: calc(100vh - 60px); gap: 16px; }
  .td-loader-spinner { width: 48px; height: 48px; border: 4px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; }
  .td-loader-text { font-size: 15px; color: #64748b; font-weight: 500; }
  .td-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(6px); padding: 20px; }
  .td-modal { background: white; border-radius: 20px; padding: 36px 32px; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 25px 60px rgba(0,0,0,0.2); }
  .td-modal-icon { width: 64px; height: 64px; background: #fef2f2; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 18px; }
  .td-modal-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
  .td-modal-text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }
  .td-modal-btns { display: flex; gap: 12px; }
  .td-modal-cancel { flex: 1; padding: 12px; background: white; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .td-modal-cancel:hover { background: #f1f5f9; }
  .td-modal-confirm { flex: 1; padding: 12px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .td-modal-confirm:hover { opacity: 0.9; transform: translateY(-1px); }
  .td-delete-btn { padding: 7px 10px; background: white; border: 1.5px solid #fecaca; border-radius: 8px; cursor: pointer; color: #dc2626; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .td-delete-btn:hover { background: #fef2f2; border-color: #dc2626; }
  .td-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .td-mini-spinner { width: 14px; height: 14px; border: 2px solid rgba(220,38,38,0.3); border-top-color: #dc2626; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  .td-delete-btn { padding: 7px 10px; background: white; border: 1.5px solid #fecaca; border-radius: 8px; cursor: pointer; color: #dc2626; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .td-delete-btn:hover { background: #fef2f2; border-color: #dc2626; }
  .td-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .td-mini-spinner { width: 14px; height: 14px; border: 2px solid rgba(220,38,38,0.3); border-top-color: #dc2626; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  .td-delete-btn { padding: 7px 10px; background: white; border: 1.5px solid #fecaca; border-radius: 8px; cursor: pointer; color: #dc2626; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .td-delete-btn:hover { background: #fef2f2; border-color: #dc2626; }
  .td-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .td-mini-spinner { width: 14px; height: 14px; border: 2px solid rgba(220,38,38,0.3); border-top-color: #dc2626; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  .td-delete-btn { padding: 7px 10px; background: white; border: 1.5px solid #fecaca; border-radius: 8px; cursor: pointer; color: #dc2626; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
  .td-delete-btn:hover { background: #fef2f2; border-color: #dc2626; }
  .td-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .td-mini-spinner { width: 14px; height: 14px; border: 2px solid rgba(220,38,38,0.3); border-top-color: #dc2626; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
  .td-quiz-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 12px; transition: all 0.2s; }
  .td-quiz-row:hover { border-color: #bfdbfe; box-shadow: 0 4px 16px rgba(37,99,235,0.1); transform: translateY(-1px); }
  .td-quiz-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .td-quiz-icon { width: 36px; height: 36px; background: #f8fafc; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; flex-shrink: 0; }
  .td-quiz-title { font-size: 14px; font-weight: 600; color: #0f172a; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
  .td-quiz-meta { font-size: 12px; color: #94a3b8; }
  .td-start-btn { padding: 8px 16px; background: linear-gradient(135deg, #2563eb, #059669); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; flex-shrink: 0; }
  .td-start-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  /* Waiting room */
  .td-waiting-wrap { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 64px); padding: 32px; }
  .td-waiting-card { background: white; border-radius: 20px; padding: 48px; max-width: 520px; width: 100%; border: 1px solid #e2e8f0; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .td-waiting-top { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
  .td-waiting-icon { width: 56px; height: 56px; background: #eff6ff; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .td-waiting-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .td-waiting-sub { font-size: 14px; color: #64748b; }
  .td-code-wrap { background: linear-gradient(135deg, #eff6ff, #ecfdf5); border-radius: 16px; padding: 28px; text-align: center; margin-bottom: 24px; border: 1px solid #bfdbfe; }
  .td-code-label { font-size: 12px; font-weight: 700; color: #2563eb; letter-spacing: 2px; margin-bottom: 12px; }
  .td-code-display { font-size: 52px; font-weight: 900; color: #1e3a8a; letter-spacing: 10px; margin-bottom: 12px; }
  .td-code-hint { font-size: 13px; color: #64748b; }
  .td-quiz-info-row { display: flex; gap: 20px; margin-bottom: 28px; flex-wrap: wrap; }
  .td-quiz-info-item { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; font-weight: 500; }
  .td-waiting-btns { display: flex; gap: 12px; flex-wrap: wrap; }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .td-header { padding: 0 20px; }
    .td-body { padding: 20px; }
    .td-stats-row { grid-template-columns: repeat(2, 1fr); }
    .td-user-name { display: none; }
  }
  @media (max-width: 768px) {
    .td-header { height: auto; padding: 12px 16px; flex-wrap: wrap; gap: 10px; }
    .td-btn-label { display: none; }
    .td-header-btn { padding: 8px 10px; }
    .td-body { padding: 16px; }
    .td-stats-row { grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .td-stat-val { font-size: 24px; }
    .td-main-grid { grid-template-columns: 1fr; }
    .td-card { padding: 20px; }
    .td-waiting-card { padding: 28px 20px; }
    .td-code-display { font-size: 36px; letter-spacing: 6px; }
  }
  @media (max-width: 480px) {
    .td-stats-row { grid-template-columns: repeat(2, 1fr); gap: 10px; }
    .td-stat-card { padding: 14px; }
    .td-stat-val { font-size: 22px; }
    .td-stat-label { font-size: 11px; }
    .td-logo-text { font-size: 16px; }
    .td-role-tag { display: none; }
    .td-quiz-title { max-width: 120px; }
    .td-code-display { font-size: 28px; letter-spacing: 4px; }
    .td-waiting-btns { flex-direction: column; }
    .td-ghost-btn, .td-primary-btn { width: 100%; justify-content: center; }
  }
  @media (max-width: 360px) {
    .td-stats-row { grid-template-columns: 1fr 1fr; }
    .td-header-btn { display: none; }
  }
`;
