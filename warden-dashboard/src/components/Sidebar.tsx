import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Video, Fingerprint, Users, Brain,
  Activity, Settings, LogOut, Shield
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/surveillance', icon: Video, label: 'Live Feed' },
  { to: '/attendance', icon: Fingerprint, label: 'Attendance' },
  { to: '/students', icon: Users, label: 'Resident Logs' },
  { to: '/analytics', icon: Brain, label: 'AI Analytics' },
  { to: '/settings', icon: Activity, label: 'System Health' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar neu-high-lift">
      {/* Brand */}
      <div className="sidebar-brand">
        <h1 className="brand-title">OneKByte Labs</h1>
        <div className="brand-user">
          <div className="brand-avatar neu-convex">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-label-md">System Controller</p>
            <p className="brand-version">V2.4 Active</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive ? 'nav-item-active neu-inset' : ''}`}
            >
              <Icon size={20} />
              <span className="text-label-md">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <NavLink to="/settings" className="nav-item">
          <Settings size={20} />
          <span className="text-label-md">Settings</span>
        </NavLink>
        <NavLink to="/login" className="nav-item nav-item-logout">
          <LogOut size={20} />
          <span className="text-label-md">Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}
