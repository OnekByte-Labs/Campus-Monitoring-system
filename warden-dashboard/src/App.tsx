import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Surveillance from './pages/Surveillance';
import Registration from './pages/Registration';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import './index.css';

// Placeholder pages for Phase 2 (will be built next)
function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 className="text-headline-lg" style={{ color: 'var(--primary)', marginBottom: 'var(--stack-md)' }}>{title}</h2>
          <p className="text-body-md" style={{ color: 'var(--on-surface-variant)' }}>Coming soon — this page will be built in the next phase.</p>
        </div>
      </div>
    </>
  );
}

// Auth guard
function ProtectedLayout() {
  const token = localStorage.getItem('warden_token');
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <Sidebar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/surveillance" element={<Surveillance />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/register" element={<Registration />} />
          <Route path="/students/:id" element={<Students />} />
          <Route path="/analytics" element={<PlaceholderPage title="AI Analytics Dashboard" />} />
          <Route path="/insights" element={<PlaceholderPage title="Weekly AI Behavioral Insights" />} />
          <Route path="/settings" element={<PlaceholderPage title="System Infrastructure Settings" />} />
          <Route path="/admin" element={<PlaceholderPage title="Super Admin Central Overview" />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
