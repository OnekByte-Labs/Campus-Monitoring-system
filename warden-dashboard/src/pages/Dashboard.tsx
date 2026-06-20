import React, { useState, useEffect } from 'react';
import { Users, Activity, Radio, ArrowUpRight, ArrowDownRight, Clock, Video } from 'lucide-react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { TopBar } from '../components/TopBar';

interface AttendanceLog {
  id: number;
  student_id: string;
  student_name: string | null;
  camera_id: number | null;
  similarity_score: number;
  direction: 'IN' | 'OUT';
  timestamp: string;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const [currentlyInside, setCurrentlyInside] = useState(142); // Mocked for now

  // Fetch today's logs on mount
  useEffect(() => {
    const fetchTodayLogs = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/events/attendance/today');
        if (res.data && res.data.success) {
          setLogs(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch today's logs", err);
      }
    };
    fetchTodayLogs();
  }, []);

  // Setup Socket.IO for real-time updates
  useEffect(() => {
    const socket: Socket = io('http://localhost:3000');

    socket.on('connect', () => {
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('new_attendance', (newRecord: AttendanceLog) => {
      setLogs((prevLogs) => [newRecord, ...prevLogs]);
      // Update mocked currently inside logic
      setCurrentlyInside(prev => newRecord.direction === 'IN' ? prev + 1 : prev - 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const totalMovements = logs.length;

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopBar title="Hostel Live Dashboard" />
      
      <main className="p-margin-desktop min-h-screen max-w-[1440px] mx-auto w-full">
        <div className="flex flex-col gap-gutter">
          
          {/* Analytics Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Total Movements */}
            <div className="bg-surface-container rounded-3xl p-stack-md neu-convex border-l-4 border-primary">
              <div className="flex items-center justify-between mb-unit">
                <p className="text-label-md font-label-md text-on-surface-variant">TOTAL MOVEMENTS TODAY</p>
                <Activity size={20} className="text-primary" />
              </div>
              <div className="flex items-end justify-between">
                <h3 className="font-headline-lg text-[32px] font-bold text-primary">{totalMovements}</h3>
                <span className="text-on-surface-variant font-label-md text-[12px]">Logs Recorded</span>
              </div>
            </div>
            
            {/* Currently Inside */}
            <div className="bg-surface-container rounded-3xl p-stack-md neu-convex border-l-4 border-secondary">
              <div className="flex items-center justify-between mb-unit">
                <p className="text-label-md font-label-md text-on-surface-variant">CURRENTLY INSIDE</p>
                <Users size={20} className="text-secondary" />
              </div>
              <div className="flex items-end justify-between">
                <h3 className="font-headline-lg text-[32px] font-bold text-secondary">{currentlyInside}</h3>
                <span className="text-on-surface-variant font-label-md text-[12px]">Estimated Capacity</span>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-surface-container rounded-3xl p-stack-md neu-convex border-l-4 border-tertiary">
              <div className="flex items-center justify-between mb-unit">
                <p className="text-label-md font-label-md text-on-surface-variant">SYSTEM STATUS</p>
                <Radio size={20} className="text-tertiary" />
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className={`w-4 h-4 rounded-full ${socketConnected ? 'bg-secondary animate-pulse drop-shadow-[0_0_8px_rgba(0,229,203,0.8)]' : 'bg-error'}`}></div>
                <h3 className="font-headline-md text-[24px] font-bold text-on-surface">
                  {socketConnected ? 'Live Connection' : 'Disconnected'}
                </h3>
              </div>
            </div>
          </section>

          {/* Table / Feed Area */}
          <section className="bg-surface-container rounded-3xl p-stack-lg neu-convex">
            <div className="flex items-center justify-between mb-stack-lg">
              <h4 className="font-headline-md text-[24px] font-bold text-on-surface">Real-Time Movement Log</h4>
              <button className="neu-inset px-stack-md py-2 rounded-xl text-label-md font-label-md text-secondary uppercase tracking-widest hover:text-primary transition-colors">
                Export Data
              </button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar pb-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-md uppercase tracking-widest text-[12px]">
                    <th className="pb-4 px-4 font-bold">Status</th>
                    <th className="pb-4 px-4 font-bold">Student</th>
                    <th className="pb-4 px-4 font-bold">Time</th>
                    <th className="pb-4 px-4 font-bold">Confidence</th>
                    <th className="pb-4 px-4 font-bold">Camera Node</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-on-surface-variant font-body-md">
                        No movements recorded today yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isEntry = log.direction === 'IN';
                      const timeString = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                      return (
                        <tr key={log.id} className="border-b border-outline-variant/10 hover:bg-surface-container-high transition-colors">
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-bold ${
                              isEntry 
                                ? 'bg-secondary/10 text-secondary border border-secondary/20 drop-shadow-[0_0_4px_rgba(0,229,203,0.3)]' 
                                : 'bg-error/10 text-error border border-error/20 drop-shadow-[0_0_4px_rgba(255,50,50,0.3)]'
                            }`}>
                              {isEntry ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                              {isEntry ? 'ENTRY' : 'EXIT'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-on-surface">{log.student_name || 'Unknown'}</span>
                              <span className="text-[12px] font-mono text-on-surface-variant">{log.student_id}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <Clock size={14} />
                              <span className="font-mono text-[14px]">{timeString}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${log.similarity_score > 0.8 ? 'bg-secondary' : 'bg-tertiary'}`} 
                                  style={{ width: `${Math.min(100, log.similarity_score * 100)}%` }}
                                />
                              </div>
                              <span className="text-[12px] font-mono text-on-surface-variant">
                                {(log.similarity_score * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-on-surface-variant">
                              <Video size={14} />
                              <span className="text-[12px] uppercase tracking-wider">{log.camera_id ? `CAM-${log.camera_id}` : 'CAM-1-MAIN'}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
