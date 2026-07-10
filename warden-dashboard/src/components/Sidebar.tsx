import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/surveillance', label: 'Live Feed', icon: 'videocam' },
  { path: '/attendance', label: 'Attendance', icon: 'fingerprint' },
  { path: '/students/register', label: 'Resident Logs', icon: 'group' },
  { path: '/devices', label: 'Device Registry', icon: 'router' },
  { path: '/analytics', label: 'AI Analytics', icon: 'psychology' },
  { path: '/insights', label: 'System Health', icon: 'sensors' },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-container neumorphic-high-lift flex flex-col py-stack-lg gap-stack-md z-50">
      <div className="px-margin-desktop mb-stack-lg">
        <div className="flex items-center justify-between gap-stack-sm mb-stack-sm">
          <img 
            src="/onekbyte_labs_logo.png" 
            alt="OneKByte Labs Logo" 
            className="h-10 w-auto object-contain flex-shrink-0"
          />
        </div>
        <div className="flex items-center gap-stack-sm">
          <div className="w-10 h-10 rounded-full neumorphic-convex flex items-center justify-center overflow-hidden border border-outline-variant/20">
            <img 
              alt="Admin Avatar" 
              className="w-full h-full object-cover" 
              src="https://ui-avatars.com/api/?name=Admin+User&background=ffecd9&color=2d2416" 
            />
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface">System Controller</p>
            <p className="text-[10px] text-primary opacity-70">V2.4 Active</p>
          </div>
        </div>
      </div>
      
      <nav className="flex flex-col gap-unit px-stack-md">
        {navItems.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center gap-stack-md px-stack-md py-stack-md rounded-xl transition-all duration-300 active:scale-95 ` +
              (isActive 
                ? `neumorphic-inset text-secondary` 
                : `text-on-surface-variant hover:text-primary hover:neumorphic-convex`)
            }
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
            <span className="font-label-md">{item.label}</span>
          </NavLink>
        ))}

        <div className="mt-auto pt-stack-lg border-t border-outline-variant/10">
          <NavLink 
            to="/settings"
            className={({ isActive }) => 
              `flex items-center gap-stack-md px-stack-md py-stack-md rounded-xl transition-all duration-300 active:scale-95 ` +
              (isActive 
                ? `neumorphic-inset text-secondary` 
                : `text-on-surface-variant hover:text-primary hover:neumorphic-convex`)
            }
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            <span className="font-label-md">Settings</span>
          </NavLink>
          <NavLink 
            to="/login"
            className="flex items-center gap-stack-md px-stack-md py-stack-md rounded-xl text-on-surface-variant hover:text-error hover:neumorphic-convex transition-all duration-300 active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>logout</span>
            <span className="font-label-md">Logout</span>
          </NavLink>
        </div>
      </nav>
    </aside>
  );
};
