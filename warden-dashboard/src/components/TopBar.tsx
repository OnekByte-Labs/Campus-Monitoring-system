import React from 'react';

export const TopBar: React.FC = () => {
  return (
    <header className="fixed top-0 right-0 left-64 h-20 glass-md z-40 flex items-center justify-between px-margin-desktop">
      <div className="flex items-center gap-stack-md">
        <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_open</span>
        <h2 className="font-headline-md text-headline-md text-on-surface tracking-tighter">Warden&nbsp; Dashboard</h2>
      </div>
      <div className="flex items-center gap-stack-lg">
        <div className="flex items-center gap-stack-sm px-stack-md py-unit rounded-full glass-sm">
          <div className="w-2 h-2 rounded-full bg-secondary animate-pulse glow-orange"></div>
          <span className="font-label-md text-secondary">Live Sync</span>
        </div>
        <button className="glass-button p-stack-sm rounded-full text-on-surface-variant hover:text-primary transition-all active:scale-95">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
        </button>
        <button className="glass-button p-stack-sm rounded-full text-on-surface-variant hover:text-primary transition-all active:scale-95">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
        </button>
      </div>
    </header>
  );
};
