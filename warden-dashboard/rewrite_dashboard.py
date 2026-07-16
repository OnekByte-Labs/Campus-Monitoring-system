import re
with open('/Users/adityakumarsingh/Documents/Face_Detection_Jetson/warden-dashboard/src/pages/Dashboard.tsx', 'r') as f:
    content = f.read()

new_content = """import React, { useState, useEffect } from 'react';
import { Users, Activity, Radio, ArrowUpRight, ArrowDownRight, Clock, Video, AlertCircle, Send, CheckCircle2 } from 'lucide-react';
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
  is_late: boolean;
  reason: string | null;
}

interface DashboardStats {
  totalEnrolled: number;
  currentlyInside: number;
  currentlyOutside: number;
  lateEntriesToday: number;
}

export default function Dashboard() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEnrolled: 0,
    currentlyInside: 0,
    currentlyOutside: 0,
    lateEntriesToday: 0
  });
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Late Entry Form State
  const [lateStudentId, setLateStudentId] = useState('');
  const [lateTime, setLateTime] = useState('');
  const [lateReason, setLateReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:3000/api/v1/events/attendance/today'),
          axios.get('http://localhost:3000/api/v1/analytics/dashboard')
        ]);
        
        if (logsRes.data?.success) setLogs(logsRes.data.data);
        if (statsRes.data?.success) setStats(statsRes.data.data);
        
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };
    fetchData();
  }, []);

  // Setup Socket.IO for real-time updates
  useEffect(() => {
    const socket: Socket = io('http://localhost:3000');

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('new_attendance', (newRecord: AttendanceLog) => {
      setLogs((prev) => [newRecord, ...prev]);
      
      // Optimistically update stats
      setStats(prev => {
        const isLate = newRecord.is_late;
        const isEntry = newRecord.direction === 'IN';
        return {
          ...prev,
          currentlyInside: isEntry ? prev.currentlyInside + 1 : prev.currentlyInside - 1,
          currentlyOutside: isEntry ? prev.currentlyOutside - 1 : prev.currentlyOutside + 1,
          lateEntriesToday: isLate ? prev.lateEntriesToday + 1 : prev.lateEntriesToday
        };
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleLateEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lateStudentId || !lateTime) return;
    
    setIsSubmitting(true);
    try {
      const today = new Date();
      const [hours, minutes] = lateTime.split(':');
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      
      const res = await axios.post('http://localhost:3000/api/v1/events/attendance/late-entry', {
        studentId: lateStudentId,
        entryTime: today.toISOString(),
        reason: lateReason
      }, {
        headers: { 'x-api-key': 'dev-secret-key' }
      });

      if (res.data?.success) {
        setToastMessage('Late entry logged & Warden notified.');
        setLateStudentId('');
        setLateTime('');
        setLateReason('');
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err) {
      console.error("Failed to submit late entry", err);
      alert("Error submitting late entry. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const lateLogs = logs.filter(l => l.is_late);

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopBar title="Warden OS Command Center" />
      
      <main className="p-margin-desktop min-h-screen max-w-[1440px] mx-auto w-full">
        {toastMessage && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 glass-card px-6 py-3 rounded-full flex items-center gap-3 border border-secondary shadow-lg animate-fade-in">
            <CheckCircle2 className="text-secondary" size={20} />
            <span className="font-label-md text-on-surface">{toastMessage}</span>
          </div>
        )}

        <div className="flex flex-col gap-gutter">
          
          {/* Header & Status */}
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md text-[28px] font-bold text-on-surface tracking-tight">Real-Time Analytics</h2>
            <div className="glass-sm px-4 py-2 rounded-full flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${socketConnected ? 'bg-secondary animate-pulse glow-orange-lg' : 'bg-error'}`}></div>
              <span className="font-mono text-sm text-on-surface-variant">
                {socketConnected ? 'System Live' : 'Offline'}
              </span>
            </div>
          </div>

          {/* 4 Analytics Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <div className="glass-card rounded-3xl p-stack-md border-l-4 border-primary hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between mb-unit">
                <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Total Enrolled</p>
                <Users size={20} className="text-primary glow-orange" />
              </div>
              <h3 className="font-headline-lg text-[36px] font-bold text-primary mt-2">{stats.totalEnrolled}</h3>
            </div>
            
            <div className="glass-card rounded-3xl p-stack-md border-l-4 border-secondary hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between mb-unit">
                <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Currently Inside</p>
                <Activity size={20} className="text-secondary glow-orange" />
              </div>
              <h3 className="font-headline-lg text-[36px] font-bold text-secondary mt-2">{stats.currentlyInside}</h3>
            </div>

            <div className="glass-card rounded-3xl p-stack-md border-l-4 border-tertiary hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between mb-unit">
                <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Currently Outside</p>
                <ArrowUpRight size={20} className="text-tertiary glow-orange" />
              </div>
              <h3 className="font-headline-lg text-[36px] font-bold text-tertiary mt-2">{stats.currentlyOutside}</h3>
            </div>

            <div className="glass-card rounded-3xl p-stack-md border-l-4 border-error hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between mb-unit">
                <p className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Late Entries Today</p>
                <AlertCircle size={20} className="text-error animate-pulse glow-orange" />
              </div>
              <h3 className="font-headline-lg text-[36px] font-bold text-error mt-2">{stats.lateEntriesToday}</h3>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-4">
            
            {/* Left Column: Movement Log & Manual Entry */}
            <div className="lg:col-span-2 flex flex-col gap-gutter">
              
              {/* Manual Late Entry Form */}
              <section className="glass-card rounded-3xl p-stack-lg border border-outline-variant/30">
                <h4 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                  <AlertCircle size={24} className="text-error" />
                  Log Manual Late Entry
                </h4>
                <form onSubmit={handleLateEntrySubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Student ID</label>
                    <input 
                      type="text" 
                      required
                      value={lateStudentId}
                      onChange={e => setLateStudentId(e.target.value)}
                      placeholder="e.g. STU-101" 
                      className="w-full glass-input rounded-xl px-4 py-3 text-on-surface font-mono"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Time of Entry</label>
                    <input 
                      type="time" 
                      required
                      value={lateTime}
                      onChange={e => setLateTime(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-3 text-on-surface font-mono"
                    />
                  </div>
                  <div className="flex-[1.5] w-full">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Reason (Optional)</label>
                    <input 
                      type="text" 
                      value={lateReason}
                      onChange={e => setLateReason(e.target.value)}
                      placeholder="Why were they late?" 
                      className="w-full glass-input rounded-xl px-4 py-3 text-on-surface"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto glass-button bg-error/10 border-error/30 text-error hover:bg-error/20 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all"
                  >
                    {isSubmitting ? 'Logging...' : <><Send size={18} /> Submit</>}
                  </button>
                </form>
              </section>

              {/* Movement Log Table */}
              <section className="glass-card rounded-3xl p-stack-lg border border-outline-variant/30 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-headline-md text-xl font-bold text-on-surface">Live Movement Feed</h4>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-md uppercase tracking-widest text-[11px]">
                        <th className="pb-4 px-4 font-bold">Status</th>
                        <th className="pb-4 px-4 font-bold">Student</th>
                        <th className="pb-4 px-4 font-bold">Time</th>
                        <th className="pb-4 px-4 font-bold">Confidence</th>
                        <th className="pb-4 px-4 font-bold">Camera</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 15).map((log) => {
                        const isEntry = log.direction === 'IN';
                        const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr key={log.id} className="border-b border-outline-variant/5 hover:bg-surface-container-high transition-colors">
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                                isEntry 
                                  ? 'bg-secondary/10 text-secondary border border-secondary/20 drop-shadow-[0_0_4px_rgba(0,229,203,0.3)]' 
                                  : 'bg-error/10 text-error border border-error/20 drop-shadow-[0_0_4px_rgba(255,50,50,0.3)]'
                              }`}>
                                {isEntry ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
                                {isEntry ? 'IN' : 'OUT'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-on-surface text-sm">{log.student_name || 'Unknown'}</span>
                                <span className="text-[11px] font-mono text-on-surface-variant">{log.student_id}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 text-on-surface-variant">
                                <Clock size={12} />
                                <span className="font-mono text-[12px]">{timeStr}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1 bg-background rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${log.similarity_score > 0.8 ? 'bg-secondary' : 'bg-tertiary'}`} 
                                    style={{ width: `${Math.min(100, log.similarity_score * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-on-surface-variant">
                                  {(log.similarity_score * 100).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-on-surface-variant uppercase">{log.camera_id ? `CAM-${log.camera_id}` : 'MANUAL'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            {/* Right Column: Warden Notification Feed */}
            <div className="lg:col-span-1">
              <section className="glass-card rounded-3xl p-stack-lg border border-error/20 h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-error/0 via-error to-error/0 opacity-50"></div>
                
                <h4 className="font-headline-md text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                  <AlertCircle size={20} className="text-error" />
                  Recent Alerts
                </h4>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
                  {lateLogs.length === 0 ? (
                    <div className="text-center py-10 text-on-surface-variant text-sm">
                      No late entries recorded today.
                    </div>
                  ) : (
                    lateLogs.map(log => (
                      <div key={log.id} className="p-4 rounded-2xl glass-sm border border-error/10 hover:border-error/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-on-surface text-sm">{log.student_name || 'Unknown'}</span>
                          <span className="text-[10px] font-mono font-bold bg-error/10 text-error px-2 py-0.5 rounded-full border border-error/20">LATE</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono mb-2">
                          <Clock size={12} />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="text-xs text-on-surface-variant bg-surface-container-highest p-2 rounded-lg italic">
                          "{log.reason || 'No reason provided.'}"
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
"""

with open('/Users/adityakumarsingh/Documents/Face_Detection_Jetson/warden-dashboard/src/pages/Dashboard.tsx', 'w') as f:
    f.write(new_content)

print("Dashboard.tsx rewritten successfully with main branch styles.")
