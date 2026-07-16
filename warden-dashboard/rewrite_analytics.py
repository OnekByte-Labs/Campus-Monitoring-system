import os

content = """import React, { useState, useEffect } from 'react';
import { TopBar } from '../components/TopBar';
import axios from 'axios';
import { Users, Clock, AlertTriangle } from 'lucide-react';

interface Occupant {
  student_id: string;
  student_name: string | null;
  entry_time: string;
  is_late: boolean;
}

export default function Analytics() {
  const [occupants, setOccupants] = useState<Occupant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/analytics/occupancy');
        if (res.data?.success) {
          setOccupants(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch occupancy data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOccupancy();
  }, []);

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopBar title="Live Occupancy & Analytics" />
      
      <main className="p-margin-desktop min-h-screen max-w-[1440px] mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-headline-md text-[28px] font-bold text-on-surface tracking-tight">Currently Inside</h2>
          <div className="glass-card px-6 py-3 rounded-full border-l-4 border-secondary flex items-center gap-3">
            <Users size={24} className="text-secondary glow-orange" />
            <span className="font-headline-lg text-[24px] font-bold text-secondary">{occupants.length}</span>
            <span className="text-on-surface-variant font-label-md">Students</span>
          </div>
        </div>

        <section className="glass-card rounded-3xl p-stack-lg border border-outline-variant/30">
          <div className="overflow-x-auto custom-scrollbar">
            {loading ? (
              <div className="text-center py-12 text-on-surface-variant animate-pulse">Loading occupancy data...</div>
            ) : occupants.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant font-body-md">
                No students are currently logged as inside the hostel.
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-outline-variant/20 text-on-surface-variant font-label-md uppercase tracking-widest text-[11px]">
                    <th className="pb-4 px-4 font-bold">Student Details</th>
                    <th className="pb-4 px-4 font-bold">Time of Entry</th>
                    <th className="pb-4 px-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {occupants.map((student) => {
                    const timeStr = new Date(student.entry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr key={student.student_id} className="border-b border-outline-variant/5 hover:bg-surface-container-high transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-on-surface text-md">{student.student_name || 'Unknown'}</span>
                            <span className="text-[12px] font-mono text-on-surface-variant">{student.student_id}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <Clock size={16} />
                            <span className="font-mono text-[14px]">{timeStr}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          {student.is_late ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-error/10 text-error border border-error/20 drop-shadow-[0_0_4px_rgba(255,50,50,0.3)]">
                              <AlertTriangle size={12} /> LATE ENTRY
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 drop-shadow-[0_0_4px_rgba(0,229,203,0.3)]">
                              REGULAR ENTRY
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
"""

with open('/Users/adityakumarsingh/Documents/Face_Detection_Jetson/warden-dashboard/src/pages/Analytics.tsx', 'w') as f:
    f.write(content)
print("Analytics.tsx created successfully.")
