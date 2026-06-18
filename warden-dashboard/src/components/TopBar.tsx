import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { getSocket } from '../socket';
import './TopBar.css';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return (
    <header className="topbar neu-convex">
      <div className="topbar-left">
        <h2 className="text-headline-md">{title}</h2>
      </div>
      <div className="topbar-right">
        <div className={`sync-badge neu-inset ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className={`sync-dot ${isConnected ? 'animate-pulse-glow' : ''}`} />
          <span className="text-label-md">
            {isConnected ? 'Live Sync' : 'Offline'}
          </span>
        </div>
        <button className="topbar-btn neu-convex" aria-label="Notifications">
          <Bell size={20} />
        </button>
        <button className="topbar-btn neu-convex" aria-label="Search">
          <Search size={20} />
        </button>
      </div>
    </header>
  );
}
