import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, Building, X, Plus } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Attendance() {
  const [logs, setLogs] = useState([
    { id: 1, type: 'entry', title: 'Main Gate Entry', time: '08:42 AM', method: 'Biometric', alert: false },
    { id: 2, type: 'building', title: 'Block A Entry', time: '09:15 AM', method: 'RFID', alert: false },
    { id: 3, type: 'missing', title: 'Mess Exit Missing', time: 'Expected 02:00 PM', alert: true },
  ]);

  useEffect(() => {
    // Listen to real-time events just to show it's connected
    const socket = io('http://localhost:3000');
    
    socket.on('new_attendance', (data) => {
      console.log('Real-time attendance:', data);
    });

    socket.on('security_alert', (data) => {
      console.log('Security alert:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-32">
      {/* TopAppBar */}
      <header className="w-full top-0 sticky z-50 bg-surface shadow-[6px_6px_16px_rgba(3,1,10,0.7),-6px_-6px_16px_rgba(42,30,92,0.25)] flex justify-between items-center px-margin-mobile py-4 mb-stack-lg">
        <div className="flex items-center gap-stack-sm active:scale-95 transition-transform">
          <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden flex items-center justify-center filter drop-shadow-[0_0_6px_rgba(203,190,255,0.4)]">
            <img alt="Student Profile Photo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJASsb4wfTJZ6pSV5pqFIZviOP7Y6rL00HbpseAUxrzRkYMT6WXNadg5Lyzssh5cTdskJ8O7JhL-XmtTwoeODjbvf1bqE_Kjz4rCKfxVfIkva8g17IbpI_ca8zqGHIwpbrSGJnlKdlWuIPKlD4vKImyWo-zlQb2qBQt6dXI0YZ5ryC6ddmo6UMxFnJgWJccYkeKAtrGN8SeTb4J7YZgdiPlb8aZHiTW6nTtKs_G-aE8lJcl8ZpeznAa7-a8nM0_QddBGaA9ff3C84"/>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-md text-[20px] font-bold text-primary tracking-tight">Student Presence</span>
          </div>
        </div>
      </header>

      <main className="flex-1 px-margin-mobile max-w-4xl mx-auto w-full">
        {/* Monthly Attendance Calendar */}
        <section className="mb-stack-lg">
          <div className="flex items-center justify-between mb-stack-md">
            <h2 className="font-headline-md text-[24px] font-bold text-on-surface">May 2024</h2>
            <div className="flex gap-stack-sm">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface neu-convex active:neu-inset transition-all">
                <ChevronLeft size={20} className="text-on-surface" />
              </button>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface neu-convex active:neu-inset transition-all">
                <ChevronRight size={20} className="text-on-surface" />
              </button>
            </div>
          </div>
          
          {/* Recessed Calendar Basin */}
          <div className="bg-surface-container-low rounded-xl p-4 neu-inset">
            <div className="grid grid-cols-7 gap-2 mb-4">
              <div className="text-center font-label-md text-[12px] font-bold text-on-surface-variant">MO</div>
              <div className="text-center font-label-md text-[12px] font-bold text-on-surface-variant">TU</div>
              <div className="text-center font-label-md text-[12px] font-bold text-on-surface-variant">WE</div>
              <div className="text-center font-label-md text-[12px] font-bold text-on-surface-variant">TH</div>
              <div className="text-center font-label-md text-[12px] font-bold text-on-surface-variant">FR</div>
              <div className="text-center font-label-md text-[12px] font-bold text-on-surface-variant">SA</div>
              <div className="text-center font-label-md text-[12px] font-bold text-error">SU</div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {/* Previous Month */}
              <div className="h-10 flex items-center justify-center font-body-sm text-[14px] text-outline-variant opacity-30">29</div>
              <div className="h-10 flex items-center justify-center font-body-sm text-[14px] text-outline-variant opacity-30">30</div>
              
              {/* Current Month: Present */}
              {[1,2,3,4].map(day => (
                <div key={day} className="h-10 rounded-lg flex items-center justify-center font-body-sm text-[14px] text-secondary-fixed-dim bg-surface neu-convex filter drop-shadow-[0_0_4px_rgba(0,223,197,0.5)] border border-secondary-fixed-dim/20">{day}</div>
              ))}
              <div className="h-10 rounded-lg flex items-center justify-center font-body-sm text-[14px] text-on-surface-variant opacity-50">5</div>
              
              {[6,7].map(day => (
                <div key={day} className="h-10 rounded-lg flex items-center justify-center font-body-sm text-[14px] text-secondary-fixed-dim bg-surface neu-convex filter drop-shadow-[0_0_4px_rgba(0,223,197,0.5)] border border-secondary-fixed-dim/20">{day}</div>
              ))}
              
              {/* Absent */}
              <div className="h-10 rounded-lg flex items-center justify-center font-body-sm text-[14px] text-tertiary-fixed-dim bg-surface-container-high filter drop-shadow-[0_0_4px_rgba(255,185,95,0.5)] border border-tertiary/20">8</div>
              
              {[9,10,11].map(day => (
                <div key={day} className="h-10 rounded-lg flex items-center justify-center font-body-sm text-[14px] text-secondary-fixed-dim bg-surface neu-convex filter drop-shadow-[0_0_4px_rgba(0,223,197,0.5)] border border-secondary-fixed-dim/20">{day}</div>
              ))}
              <div className="h-10 rounded-lg flex items-center justify-center font-body-sm text-[14px] text-on-surface-variant opacity-50">12</div>
              
              {/* Current Day Recessed */}
              <div className="h-10 rounded-lg flex items-center justify-center font-body-sm text-[14px] font-bold text-primary neu-inset bg-surface-container-highest border border-primary/30">13</div>
              
              {/* Future */}
              {[14,15,16,17,18].map(day => (
                <div key={day} className="h-10 flex items-center justify-center font-body-sm text-[14px] text-on-surface-variant">{day}</div>
              ))}
              <div className="h-10 flex items-center justify-center font-body-sm text-[14px] text-on-surface-variant opacity-50">19</div>
              {[20,21,22,23,24,25].map(day => (
                <div key={day} className="h-10 flex items-center justify-center font-body-sm text-[14px] text-on-surface-variant">{day}</div>
              ))}
              <div className="h-10 flex items-center justify-center font-body-sm text-[14px] text-on-surface-variant opacity-50">26</div>
            </div>
          </div>
        </section>

        {/* Daily Log List */}
        <section className="mb-stack-lg">
          <div className="flex items-center justify-between mb-stack-md">
            <h2 className="font-headline-md text-[20px] font-bold text-on-surface">Recent Logs</h2>
            <button className="font-label-md text-[12px] font-bold text-primary uppercase tracking-widest hover:opacity-80">View All</button>
          </div>
          
          <div className="flex flex-col gap-4">
            {logs.map((log) => (
              <div key={log.id} className={`p-4 bg-surface rounded-xl neu-convex flex items-center gap-4 transition-transform active:scale-95 ${log.alert ? 'border-l-4 border-tertiary' : ''}`}>
                <div className={`w-12 h-12 rounded-full neu-inset bg-surface-container-low flex items-center justify-center ${log.alert ? 'text-tertiary filter drop-shadow-[0_0_4px_rgba(255,185,95,0.5)]' : 'text-secondary'}`}>
                  {log.type === 'entry' ? (
                    <span className="material-symbols-outlined">gate</span>
                  ) : log.type === 'building' ? (
                    <Building size={24} />
                  ) : (
                    <X size={24} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-body-md text-[16px] font-semibold text-on-surface">{log.title}</p>
                  <p className="font-label-md text-[12px] text-on-surface-variant mt-1">{log.time}{log.method ? ` • ${log.method}` : ''}</p>
                </div>
                {log.alert ? (
                  <button className="px-3 py-2 rounded-lg bg-tertiary text-on-tertiary font-label-md text-[10px] font-bold active:neu-inset transition-all">
                    RAISE DISPUTE
                  </button>
                ) : (
                  <button className="p-2 rounded-lg bg-surface neu-inset text-primary hover:text-secondary-fixed transition-colors">
                    <AlertTriangle size={20} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Stats/Insight Summary */}
        <section className="grid grid-cols-2 gap-gutter">
          <div className="p-4 bg-surface rounded-xl neu-inset flex flex-col items-center">
            <span className="text-secondary font-headline-md text-[32px] font-bold filter drop-shadow-[0_0_4px_rgba(0,223,197,0.5)]">94%</span>
            <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase mt-1">Attendance</span>
          </div>
          <div className="p-4 bg-surface rounded-xl neu-inset flex flex-col items-center">
            <span className="text-tertiary font-headline-md text-[32px] font-bold filter drop-shadow-[0_0_4px_rgba(255,185,95,0.5)]">2</span>
            <span className="text-on-surface-variant font-label-md text-[10px] font-bold uppercase mt-1">Pending Disputes</span>
          </div>
        </section>
      </main>

      {/* FAB for 'Report Missing Mark' */}
      <button className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-primary-container text-on-primary-container neu-high-lift active:neu-inset active:scale-90 transition-all z-40 flex items-center justify-center">
        <Plus size={32} />
      </button>
    </div>
  );
}
