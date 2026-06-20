import React, { useState, useEffect } from 'react';
import { Video, Maximize, Circle, Camera, Radio, ShieldAlert } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { TopBar } from '../components/TopBar';

interface TelemetryEvent {
  id: string;
  student_name: string;
  student_id: string;
  direction: string;
  camera_id: number;
  time: string;
}

export default function Surveillance() {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io('http://localhost:3000');

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('new_attendance', (record) => {
      const newEvent: TelemetryEvent = {
        id: Math.random().toString(36).substr(2, 9),
        student_name: record.student_name || 'Unknown',
        student_id: record.student_id,
        direction: record.direction,
        camera_id: record.camera_id,
        time: new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      
      setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopBar title="Live Surveillance Array" />

      <main className="p-margin-desktop min-h-screen max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col gap-gutter">
          
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-stack-md bg-surface-container p-stack-lg rounded-3xl neu-convex">
            <div>
              <h2 className="font-headline-md text-3xl font-bold text-on-surface">Dual-Gate Node Architecture</h2>
              <p className="font-body-sm text-on-surface-variant mt-1 tracking-wide">Secure Hardware Pipeline Active • Latency &lt; 15ms</p>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-low neu-inset px-4 py-2 rounded-xl">
              <Radio size={20} className={socketConnected ? 'text-secondary animate-pulse' : 'text-error'} />
              <span className="font-label-md text-[12px] font-bold tracking-widest uppercase text-on-surface">
                {socketConnected ? 'SOCKET LINK STABLE' : 'LINK SEVERED'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
            
            {/* Dual Camera Grid */}
            <div className="col-span-1 lg:col-span-8 flex flex-col gap-gutter">
              
              {/* FEED 01: IN */}
              <div className="bg-surface-container rounded-3xl p-stack-lg neu-convex group">
                <div className="flex justify-between items-center mb-stack-md">
                  <div className="flex flex-col">
                    <span className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                      <Video size={20} className="text-secondary" />
                      Feed 01: Entry Gate (IN)
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant tracking-widest mt-1">NODE: CAM_00 | RESOLUTION: 1080p | 60 FPS</span>
                  </div>
                  <span className="bg-secondary/20 border border-secondary/30 text-secondary px-3 py-1 rounded-md text-[10px] font-bold tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(0,229,203,0.5)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    LIVE
                  </span>
                </div>
                
                <div className="relative aspect-video rounded-2xl bg-black border border-secondary/20 overflow-hidden shadow-[0_0_30px_rgba(0,229,203,0.1)]">
                  <img 
                    src="http://192.168.1.7:5001/video_feed_0" 
                    alt="Entry Gate" 
                    className="w-full h-full object-cover opacity-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                  
                  {/* HUD Elements */}
                  <div className="absolute top-4 left-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-secondary/30 text-[10px] font-mono text-secondary">
                    REC ●
                  </div>
                  <div className="absolute bottom-4 left-4 font-mono text-[10px] text-secondary/70">
                    TARGET ACQUISITION LOGIC: ACTIVE
                  </div>
                </div>

                <div className="flex gap-stack-sm mt-stack-md">
                  <button className="flex-1 p-3 rounded-xl text-[11px] font-bold text-on-surface-variant flex items-center justify-center gap-2 hover:text-secondary bg-surface-container-lowest neu-inset transition-colors">
                    <Maximize size={16} /> EXPAND
                  </button>
                  <button className="flex-1 p-3 rounded-xl text-[11px] font-bold text-on-surface-variant flex items-center justify-center gap-2 hover:text-secondary bg-surface-container-lowest neu-inset transition-colors">
                    <Circle size={16} /> MANUAL OVERRIDE
                  </button>
                  <button className="flex-none px-6 py-3 rounded-xl text-[11px] font-bold text-on-surface flex items-center justify-center gap-2 hover:text-white bg-secondary/20 hover:bg-secondary/40 border border-secondary/30 transition-colors shadow-[0_0_15px_rgba(0,229,203,0.2)]">
                    <Camera size={16} /> CAPTURE
                  </button>
                </div>
              </div>

              {/* FEED 02: OUT */}
              <div className="bg-surface-container rounded-3xl p-stack-lg neu-convex group">
                <div className="flex justify-between items-center mb-stack-md">
                  <div className="flex flex-col">
                    <span className="font-headline-sm font-bold text-on-surface flex items-center gap-2">
                      <Video size={20} className="text-error" />
                      Feed 02: Exit Gate (OUT)
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant tracking-widest mt-1">NODE: CAM_01 | RESOLUTION: 1080p | 45 FPS</span>
                  </div>
                  <span className="bg-error/20 border border-error/30 text-error px-3 py-1 rounded-md text-[10px] font-bold tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,50,50,0.5)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                    LIVE
                  </span>
                </div>
                
                <div className="relative aspect-video rounded-2xl bg-black border border-error/20 overflow-hidden shadow-[0_0_30px_rgba(255,50,50,0.1)]">
                  <img 
                    src="http://192.168.1.7:5001/video_feed_1" 
                    alt="Exit Gate" 
                    className="w-full h-full object-cover opacity-80" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                  
                  {/* HUD Elements */}
                  <div className="absolute top-4 left-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-error/30 text-[10px] font-mono text-error">
                    REC ●
                  </div>
                  <div className="absolute bottom-4 left-4 font-mono text-[10px] text-error/70">
                    TARGET ACQUISITION LOGIC: ACTIVE
                  </div>
                </div>

                <div className="flex gap-stack-sm mt-stack-md">
                  <button className="flex-1 p-3 rounded-xl text-[11px] font-bold text-on-surface-variant flex items-center justify-center gap-2 hover:text-error bg-surface-container-lowest neu-inset transition-colors">
                    <Maximize size={16} /> EXPAND
                  </button>
                  <button className="flex-1 p-3 rounded-xl text-[11px] font-bold text-on-surface-variant flex items-center justify-center gap-2 hover:text-error bg-surface-container-lowest neu-inset transition-colors">
                    <Circle size={16} /> MANUAL OVERRIDE
                  </button>
                  <button className="flex-none px-6 py-3 rounded-xl text-[11px] font-bold text-on-surface flex items-center justify-center gap-2 hover:text-white bg-error/20 hover:bg-error/40 border border-error/30 transition-colors shadow-[0_0_15px_rgba(255,50,50,0.2)]">
                    <Camera size={16} /> CAPTURE
                  </button>
                </div>
              </div>

            </div>

            {/* Sidebar: Telemetry Feed */}
            <div className="col-span-1 lg:col-span-4">
              <div className="bg-surface-container rounded-3xl p-stack-lg neu-convex h-full flex flex-col">
                <div className="flex items-center justify-between mb-stack-md">
                  <h3 className="font-headline-md text-2xl font-bold text-on-surface">Neural Telemetry</h3>
                  <ShieldAlert className="text-primary" size={24} />
                </div>
                
                <p className="font-body-sm text-on-surface-variant mb-stack-lg pb-4 border-b border-outline-variant/10">
                  Real-time biometric recognition events strictly streamed from hardware edge nodes.
                </p>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                  {events.length === 0 ? (
                    <div className="text-center py-12 text-on-surface-variant/50 font-mono text-[12px]">
                      Awaiting neural handshake...
                    </div>
                  ) : (
                    events.map((evt) => (
                      <div 
                        key={evt.id} 
                        className={`p-4 rounded-2xl flex flex-col gap-2 border animate-in slide-in-from-right-4 fade-in duration-300 ${
                          evt.direction === 'IN' 
                            ? 'bg-secondary/10 border-secondary/20' 
                            : 'bg-error/10 border-error/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[14px] text-on-surface">{evt.student_name}</span>
                          <span className={`text-[10px] font-bold tracking-widest px-2 py-1 rounded ${
                            evt.direction === 'IN' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'
                          }`}>
                            {evt.direction === 'IN' ? 'ENTRY LOGGED' : 'EXIT LOGGED'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[10px] text-on-surface-variant opacity-80">
                          <span>ID: {evt.student_id}</span>
                          <span>{evt.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
