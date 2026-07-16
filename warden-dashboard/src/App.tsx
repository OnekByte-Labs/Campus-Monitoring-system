import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import Surveillance from './pages/Surveillance';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import Registration from './pages/Registration';
import DeviceRegistry from './pages/DeviceRegistry';
import Settings from './pages/Settings';
import { Login } from './pages/Login';

import Analytics from './pages/Analytics';

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
          <Route path="devices" element={<DeviceRegistry />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="insights" element={<div className="p-8"><h1 className="text-2xl text-primary">System Health Coming Soon</h1></div>} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
};
