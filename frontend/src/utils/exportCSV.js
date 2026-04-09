export function exportToCSV(session) {
  if (!session?.finalScores?.length) return;

  const quizTitle = session.quiz?.title || 'Quiz';
  const maxScore = (session.quiz?.questions?.length || 0) * 10;
  const date = new Date(session.createdAt).toLocaleDateString('en-IN');

  const headers = [
    'Rank', 'Student Name', 'Score', 'Max Score',
    'Percentage', 'Grade', 'Warnings', 'Flagged',
    'Result', 'Session Code', 'Date'
  ];

  const sorted = [...session.finalScores].sort((a, b) => b.score - a.score);

  const getGrade = (pct, flagged) => {
    if (flagged) return 'FLAGGED';
    if (pct >= 90) return 'A+';
    if (pct >= 70) return 'A';
    if (pct >= 50) return 'B';
    if (pct >= 40) return 'C';
    return 'F';
  };

  const getResult = (pct, flagged) => {
    if (flagged) return 'Flagged for Cheating';
    if (pct >= 70) return 'Pass';
    if (pct >= 40) return 'Average';
    return 'Fail';
  };

  const rows = sorted.map((s, i) => {
    const pct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
    return [
      i + 1,
      s.name,
      s.score,
      maxScore,
      pct + '%',
      getGrade(pct, s.flagged),
      s.warnings || 0,
      s.flagged ? 'YES' : 'NO',
      getResult(pct, s.flagged),
      session.sessionCode,
      date
    ];
  });

  // Summary section at top
  const totalStudents = sorted.length;
  const flaggedCount = sorted.filter(s => s.flagged).length;
  const passCount = sorted.filter(s => {
    const pct = maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0;
    return !s.flagged && pct >= 70;
  }).length;
  const avgScore = sorted.length > 0
    ? (sorted.reduce((a, b) => a + b.score, 0) / sorted.length).toFixed(1)
    : 0;

  const csvContent = [
    [`Quiz Title: ${quizTitle}`],
    [`Session Code: ${session.sessionCode}`],
    [`Date: ${date}`],
    [`Total Students: ${totalStudents}`],
    [`Passed: ${passCount}`],
    [`Flagged for Cheating: ${flaggedCount}`],
    [`Average Score: ${avgScore} / ${maxScore}`],
    [],
    headers,
    ...rows
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${quizTitle.replace(/\s+/g, '_')}_${session.sessionCode}_results.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
