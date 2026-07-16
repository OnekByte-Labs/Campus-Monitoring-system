content = """import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, UserPlus, Database } from 'lucide-react';
import { TopBar } from '../components/TopBar';
import axios from 'axios';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  room_number: string;
  status: string;
  created_at: string;
}

export default function Students() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/students');
        if (res.data?.success) {
          setStudents(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch students", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(p => {
    if (searchTerm && !p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.student_id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopBar title="Enrollment & Directory" />
      
      <main className="px-margin-mobile pt-stack-md space-y-gutter max-w-4xl mx-auto w-full">
        
        {/* Header Area */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-md text-2xl font-bold text-on-surface">Enrolled Students</h2>
            <p className="text-on-surface-variant text-sm mt-1">Manage the database of registered resident profiles.</p>
          </div>
          <div className="glass-card px-4 py-2 rounded-xl flex items-center gap-2">
            <Database size={16} className="text-primary" />
            <span className="font-mono font-bold text-on-surface">{students.length} Total</span>
          </div>
        </div>

        {/* Search Area */}
        <section className="w-full h-14 neu-inset bg-surface-container-lowest rounded-xl flex items-center px-4 gap-3 border border-outline-variant/10">
          <Search className="text-outline" size={20} />
          <input 
            type="text"
            className="bg-transparent border-none outline-none focus:ring-0 text-on-surface w-full font-body-md text-body-md placeholder:text-outline-variant" 
            placeholder="Search by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        {/* Directory List */}
        <section className="space-y-4">
          {loading ? (
            <div className="text-center py-10 text-on-surface-variant animate-pulse">Loading database...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-10 text-on-surface-variant bg-surface-container rounded-2xl border border-outline-variant/10">
              No students found. Use the + button to enroll a new student.
            </div>
          ) : (
            filteredStudents.map((person) => (
              <div key={person.id} className="glass-card bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/10 rounded-2xl p-margin-mobile flex items-center gap-4 transition-all duration-300">
                <div className="w-14 h-14 rounded-full neu-inset flex items-center justify-center bg-primary-container text-on-primary-container font-bold text-xl uppercase">
                  {person.full_name.charAt(0)}
                </div>
                <div className="flex-grow">
                  <h3 className="font-headline-md text-[18px] text-on-surface font-semibold">{person.full_name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="font-mono text-label-md text-outline-variant bg-surface-container-highest px-2 py-0.5 rounded-md">{person.student_id}</p>
                    <p className="font-label-md text-label-md text-outline">Room: {person.room_number}</p>
                  </div>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-secondary`}></span>
                  <span className={`text-secondary font-label-md text-[10px] uppercase tracking-wider`}>{person.status}</span>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* FAB: Add New Personnel */}
      <button 
        onClick={() => navigate('/students/register')}
        className="fixed bottom-28 right-6 w-16 h-16 rounded-full bg-primary-container text-white neu-high-lift drop-shadow-[0_0_15px_rgba(139,110,255,0.6)] flex items-center justify-center z-50 active:scale-95 duration-150 group"
      >
        <UserPlus size={32} className="group-active:rotate-90 transition-transform text-on-primary-container" />
      </button>
    </div>
  );
}
"""

with open('/Users/adityakumarsingh/Documents/Face_Detection_Jetson/warden-dashboard/src/pages/Students.tsx', 'w') as f:
    f.write(content)
print("Students.tsx rewritten")
