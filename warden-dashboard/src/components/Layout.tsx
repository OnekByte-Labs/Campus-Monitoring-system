import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export const Layout: React.FC = () => {
  return (
    <div className="flex bg-background min-h-screen">
      <Sidebar />
      <TopBar />
      <main className="ml-64 mt-20 p-margin-desktop w-full max-w-[1440px] mx-auto min-h-screen">
        <Outlet />
      </main>
      
      {/* Floating Action Button (Global) */}
      <button className="fixed bottom-margin-desktop right-margin-desktop w-16 h-16 rounded-full bg-primary glass-button flex items-center justify-center text-on-primary hover:scale-110 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};
