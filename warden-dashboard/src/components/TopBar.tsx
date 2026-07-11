import React, { useEffect, useState } from 'react';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  return (
    <header className="fixed top-0 right-0 left-64 h-20 bg-surface z-40 flex items-center justify-between px-margin-desktop glass-md transition-colors">
      <div className="flex items-center gap-stack-md">
        <Menu size={24} className="text-primary cursor-pointer hover:opacity-80" />
        <h2 className="font-headline-md text-headline-md text-on-surface tracking-tighter">{title || 'OneKByte Labs'}</h2>
      </div>
      <div className="flex items-center gap-stack-lg">
        <div className="flex items-center gap-stack-sm px-stack-md py-unit rounded-full glass-sm">
          <div className="w-2 h-2 rounded-full bg-secondary-container glow-teal animate-pulse"></div>
          <span className="font-label-md text-secondary">Live Sync</span>
        </div>
        
        {/* Dark Mode Switcher */}
        <button 
          onClick={toggleDarkMode}
          className="glass-button p-stack-sm rounded-full text-on-surface-variant hover:text-primary transition-all active:scale-95 flex items-center justify-center"
          title="Toggle Dark Mode"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="glass-button p-stack-sm rounded-full text-on-surface-variant hover:text-primary transition-all active:scale-95">
          <Bell size={20} />
        </button>
        <button className="glass-button p-stack-sm rounded-full text-on-surface-variant hover:text-primary transition-all active:scale-95">
          <Search size={20} />
        </button>
      </div>
    </header>
  );
};
