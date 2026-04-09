
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveManualQuiz } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyQuestion = () => ({ question: '', options: ['','','',''], answer: '' });

export default function ManualQuizEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const updateQuestion = (qi, field, value) =>
    setQuestions(prev => prev.map((q, i) => i === qi ? { ...q, [field]: value } : q));

  const updateOption = (qi, oi, value) =>
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qi) return q;
      const opts = [...q.options]; opts[oi] = value;
      return { ...q, options: opts };
    }));

  const addQuestion = () => setQuestions(prev => [...prev, emptyQuestion()]);

  const removeQuestion = (qi) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== qi));
  };

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('Please enter a quiz title'); return; }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) { setError(`Question ${i+1}: Please enter the question text`); return; }
      if (q.options.some(o => !o.trim())) { setError(`Question ${i+1}: Please fill all 4 options`); return; }
      if (!q.answer) { setError(`Question ${i+1}: Please select the correct answer`); return; }
    }
    setSaving(true);
    try {
      const formatted = questions.map(q => ({
        question: q.question,
        options: q.options.map((o, i) => `${['A','B','C','D'][i]}) ${o}`),
        answer: q.answer,
      }));
      await saveManualQuiz({ title, questions: formatted });
      setSuccess(true);
      setTimeout(() => navigate('/teacher'), 1500);
    } catch (err) { setError(err.response?.data?.msg || 'Failed to save quiz'); }
    setSaving(false);
  };

  const letters = ['A','B','C','D'];

  if (success) {
    return (
      <div className="mq-page">
        <style>{css}</style>
        <div className="mq-header">
          <div className="mq-header-left">
            <div className="mq-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
            <span className="mq-logo-text">QuizAI</span>
          </div>
        </div>
        <div className="mq-success-wrap">
          <div className="mq-success-card">
            <div className="mq-success-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="mq-success-title">Quiz Saved!</h2>
            <p className="mq-success-sub">Redirecting to dashboard...</p>
            <div className="mq-success-spinner"/>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mq-page">
      <style>{css}</style>

      <div className="mq-header">
        <div className="mq-header-left">
          <div className="mq-logo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
          <span className="mq-logo-text">QuizAI</span>
          <span className="mq-page-tag">Manual Editor</span>
        </div>
        <div className="mq-header-right">
          <span className="mq-q-count">{questions.length} Q{questions.length!==1?'s':''}</span>
          <button className="mq-ghost-btn" onClick={() => navigate('/teacher')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            <span className="mq-btn-label">Cancel</span>
          </button>
          <button className={saving?'mq-save-btn-disabled':'mq-save-btn'} onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="mq-spinner"/>Saving...</>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Quiz</>
            }
          </button>
        </div>
      </div>

      <div className="mq-body">

        {/* Title Card */}
        <div className="mq-title-card">
          <div className="mq-title-top">
            <div className="mq-title-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div>
              <h3 className="mq-title-label">Quiz Title</h3>
              <p className="mq-title-hint">Give your quiz a descriptive name</p>
            </div>
          </div>
          <input className="mq-title-input" type="text"
            placeholder="e.g. Chapter 5 — Newton's Laws of Motion"
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {error && (
          <div className="mq-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="mq-questions-list">
          {questions.map((q, qi) => (
            <div key={qi} className="mq-question-card">
              <div className="mq-q-header">
                <span className="mq-q-num">Q{qi+1}</span>
                <div className="mq-q-header-right">
                  {q.answer && (
                    <span className="mq-answer-badge">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      Answer: {q.answer}
                    </span>
                  )}
                  {questions.length > 1 && (
                    <button className="mq-remove-btn" onClick={() => removeQuestion(qi)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                      <span className="mq-btn-label">Remove</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mq-field">
                <label className="mq-label">Question</label>
                <textarea className="mq-textarea"
                  placeholder="Type your question here..."
                  value={q.question}
                  onChange={e => updateQuestion(qi, 'question', e.target.value)}
                  rows={2}/>
              </div>

              <div className="mq-field">
                <label className="mq-label">Options <span className="mq-label-hint">— click "Mark Correct" to set answer</span></label>
                <div className="mq-options-grid">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="mq-option-row" style={{
                      border: q.answer===letters[oi]?'1.5px solid #059669':'1.5px solid #e2e8f0',
                      background: q.answer===letters[oi]?'#f0fdf4':'white',
                    }}>
                      <span className="mq-opt-letter" style={{
                        background: q.answer===letters[oi]?'#059669':'#f1f5f9',
                        color: q.answer===letters[oi]?'white':'#64748b',
                      }}>{letters[oi]}</span>
                      <input className="mq-opt-input" type="text"
                        placeholder={`Option ${letters[oi]}`}
                        value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}/>
                      <button
                        className={q.answer===letters[oi]?'mq-correct-btn-active':'mq-correct-btn'}
                        onClick={() => updateQuestion(qi, 'answer', letters[oi])}>
                        {q.answer===letters[oi]
                          ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>Correct</>
                          : 'Mark Correct'
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="mq-add-btn" onClick={addQuestion}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Question
        </button>

        {/* Bottom bar spacer */}
        <div style={{height:'80px'}}/>
      </div>

      {/* Fixed bottom bar */}
      <div className="mq-bottom-bar">
        <p className="mq-bottom-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{questions.length} question{questions.length!==1?'s':''} · 10 pts each</span>
        </p>
        <button className={saving?'mq-save-btn-disabled':'mq-save-btn'} onClick={handleSave} disabled={saving}>
          {saving
            ? <><span className="mq-spinner"/>Saving...</>
            : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Quiz</>
          }
        </button>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .mq-page { min-height: 100vh; background: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }

  /* Header */
  .mq-header { background: linear-gradient(135deg,#1e3a8a,#1d4ed8); height: 60px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
  .mq-header-left { display: flex; align-items: center; gap: 10px; }
  .mq-logo { width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mq-logo-text { font-size: 16px; font-weight: 800; color: white; }
  .mq-page-tag { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }
  .mq-header-right { display: flex; align-items: center; gap: 10px; }
  .mq-q-count { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600; }
  .mq-ghost-btn { padding: 7px 14px; background: transparent; color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .mq-ghost-btn:hover { background: rgba(255,255,255,0.15); }
  .mq-save-btn { padding: 8px 16px; background: linear-gradient(135deg,#059669,#0d9488); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; }
  .mq-save-btn:hover { opacity: 0.9; transform: translateY(-1px); }
  .mq-save-btn-disabled { padding: 8px 16px; background: #94a3b8; color: white; border: none; border-radius: 8px; cursor: not-allowed; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .mq-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: mq-spin 0.8s linear infinite; display: inline-block; flex-shrink: 0; }
  @keyframes mq-spin { to { transform: rotate(360deg); } }

  /* Body */
  .mq-body { padding: 20px 24px; max-width: 860px; margin: 0 auto; }

  /* Title card */
  .mq-title-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 16px; }
  .mq-title-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .mq-title-icon { width: 40px; height: 40px; background: #ecfdf5; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .mq-title-label { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
  .mq-title-hint { font-size: 12px; color: #64748b; }
  .mq-title-input { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; font-weight: 600; color: #0f172a; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .mq-title-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

  /* Error */
  .mq-error { display: flex; align-items: center; gap: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 12px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; margin-bottom: 16px; }

  /* Questions */
  .mq-questions-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; }
  .mq-question-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #e2e8f0; }
  .mq-q-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 8px; }
  .mq-q-num { background: linear-gradient(135deg,#2563eb,#059669); color: white; font-size: 13px; font-weight: 800; padding: 4px 12px; border-radius: 20px; }
  .mq-q-header-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .mq-answer-badge { display: flex; align-items: center; gap: 5px; background: #dcfce7; color: #166534; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
  .mq-remove-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; color: #64748b; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .mq-remove-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }

  /* Fields */
  .mq-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .mq-label { font-size: 13px; font-weight: 700; color: #374151; }
  .mq-label-hint { color: #94a3b8; font-weight: 400; }
  .mq-textarea { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #0f172a; resize: vertical; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.5; }
  .mq-textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }

  /* Options */
  .mq-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .mq-option-row { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; transition: all 0.2s; }
  .mq-opt-letter { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; transition: all 0.2s; }
  .mq-opt-input { flex: 1; border: none; background: transparent; font-size: 14px; color: #0f172a; font-family: 'Plus Jakarta Sans', sans-serif; outline: none; min-width: 0; }
  .mq-correct-btn { padding: 5px 8px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; color: #64748b; white-space: nowrap; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; flex-shrink: 0; }
  .mq-correct-btn:hover { background: #f0fdf4; border-color: #059669; color: #059669; }
  .mq-correct-btn-active { padding: 5px 8px; background: #dcfce7; border: 1px solid #86efac; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 700; color: #166534; white-space: nowrap; display: flex; align-items: center; gap: 4px; font-family: 'Plus Jakarta Sans', sans-serif; flex-shrink: 0; }

  /* Add button */
  .mq-add-btn { width: 100%; padding: 14px; background: white; border: 2px dashed #e2e8f0; border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 700; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; font-family: 'Plus Jakarta Sans', sans-serif; }
  .mq-add-btn:hover { border-color: #2563eb; background: #eff6ff; color: #2563eb; }

  /* Bottom bar */
  .mq-bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid #e2e8f0; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 99; gap: 12px; }
  .mq-bottom-info { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; font-weight: 500; }

  /* Success */
  .mq-success-wrap { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 60px); padding: 20px; }
  .mq-success-card { background: white; border-radius: 20px; padding: 48px 32px; text-align: center; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 360px; width: 100%; }
  .mq-success-icon { width: 80px; height: 80px; background: #dcfce7; border-radius: 20px; display: flex; align-items: center; justify-content: center; }
  .mq-success-title { font-size: 24px; font-weight: 800; color: #0f172a; }
  .mq-success-sub { font-size: 14px; color: #64748b; }
  .mq-success-spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #059669; border-radius: 50%; animation: mq-spin 0.8s linear infinite; }

  /* ── RESPONSIVE ─────────────────────────────── */

  @media (max-width: 768px) {
    .mq-header { padding: 0 16px; }
    .mq-page-tag { display: none; }
    .mq-body { padding: 14px 16px; }
    .mq-options-grid { grid-template-columns: 1fr; gap: 8px; }
    .mq-title-card { padding: 16px; }
    .mq-question-card { padding: 16px; }
  }

  @media (max-width: 480px) {
    .mq-header { height: auto; min-height: 56px; padding: 10px 14px; flex-wrap: wrap; gap: 8px; }
    .mq-btn-label { display: none; }
    .mq-ghost-btn { padding: 7px 10px; }
    .mq-q-count { display: none; }
    .mq-body { padding: 12px; }
    .mq-title-input { font-size: 14px; }
    .mq-label-hint { display: none; }
    .mq-option-row { padding: 8px 10px; gap: 6px; }
    .mq-opt-input { font-size: 13px; }
    .mq-correct-btn, .mq-correct-btn-active { font-size: 10px; padding: 4px 6px; }
    .mq-bottom-bar { padding: 10px 14px; }
    .mq-bottom-info span { display: none; }
  }

  @media (max-width: 360px) {
    .mq-logo-text { font-size: 14px; }
    .mq-save-btn, .mq-save-btn-disabled { font-size: 12px; padding: 7px 12px; }
  }
`;
