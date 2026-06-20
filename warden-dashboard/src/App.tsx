import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Surveillance from './pages/Surveillance';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import Registration from './pages/Registration';
import { Login } from './pages/Login';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="surveillance" element={<Surveillance />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="students" element={<Students />} />
          <Route path="students/register" element={<Registration />} />
          <Route path="analytics" element={<div className="p-8"><h1 className="text-2xl text-primary">AI Analytics Coming Soon</h1></div>} />
          <Route path="insights" element={<div className="p-8"><h1 className="text-2xl text-primary">System Health Coming Soon</h1></div>} />
          <Route path="settings" element={<div className="p-8"><h1 className="text-2xl text-primary">Settings Coming Soon</h1></div>} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};
