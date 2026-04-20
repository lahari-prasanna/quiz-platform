import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherLiveSession from './pages/TeacherLiveSession';
import StudentDashboard from './pages/StudentDashboard';
import StudentHistory from './pages/StudentHistory';
import LiveQuiz from './pages/LiveQuiz';
import Analytics from './pages/Analytics';
import ManualQuizEditor from './pages/ManualQuizEditor';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailSent from './pages/VerifyEmailSent';

function PrivateRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
           {/* NEW: Email verification routes */}
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          <Route path="/teacher" element={
            <PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>
          } />
          <Route path="/teacher/live" element={
            <PrivateRoute role="teacher"><TeacherLiveSession /></PrivateRoute>
          } />
          <Route path="/teacher/analytics" element={
            <PrivateRoute role="teacher"><Analytics /></PrivateRoute>
          } />
          <Route path="/teacher/manual" element={
            <PrivateRoute role="teacher"><ManualQuizEditor /></PrivateRoute>
          } />
          <Route path="/student" element={
            <PrivateRoute role="student"><StudentDashboard /></PrivateRoute>
          } />
          <Route path="/student/history" element={
            <PrivateRoute role="student"><StudentHistory /></PrivateRoute>
          } />
          <Route path="/quiz/:sessionCode" element={
            <PrivateRoute><LiveQuiz /></PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
