import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout: React.FC = () => {
  return (
    <div className="flex bg-background min-h-screen selection:bg-primary-container selection:text-on-primary-container">
      <Sidebar />
      <div className="flex-1 ml-64 pt-20 flex flex-col min-h-screen w-full relative">
        <Outlet />
      </div>
      
      {/* Floating Action Button (Global) */}
      <button className="fixed bottom-margin-desktop right-margin-desktop w-16 h-16 rounded-full bg-primary glass-button flex items-center justify-center text-on-primary hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};
