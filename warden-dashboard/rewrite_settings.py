content = """import React, { useState } from 'react';
import { TopBar } from '../components/TopBar';
import { Database, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleSeedData = async () => {
    setSeeding(true);
    setMessage('');
    setError(false);
    try {
      const res = await axios.post('http://localhost:3000/api/v1/analytics/seed');
      if (res.data?.success) {
        setMessage('Mock data successfully seeded! Database has been reset with test students and logs.');
      }
    } catch (err) {
      setError(true);
      setMessage('Failed to seed mock data. Check backend logs.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopBar title="System Settings & Developer Tools" />
      
      <main className="p-margin-desktop min-h-screen max-w-[1440px] mx-auto w-full">
        <h2 className="font-headline-md text-[28px] font-bold text-on-surface tracking-tight mb-8">Developer Tools</h2>

        <section className="glass-card rounded-3xl p-stack-lg border border-outline-variant/30 max-w-2xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-error/10 text-error rounded-xl border border-error/20">
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-headline-sm text-xl font-bold text-on-surface">Database Reset & Mock Seed</h3>
              <p className="text-on-surface-variant font-body-md mt-1">
                Warning: This will completely wipe all current students and attendance logs from the database, and replace them with a set of 5 mock students and realistic test logs (including late entries).
              </p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${error ? 'bg-error/10 text-error border-error/20' : 'bg-secondary/10 text-secondary border-secondary/20'}`}>
              {error ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
              <span className="font-label-md">{message}</span>
            </div>
          )}

          <button 
            onClick={handleSeedData}
            disabled={seeding}
            className="glass-button bg-error/10 border-error/30 text-error hover:bg-error/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {seeding ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
            {seeding ? 'Seeding Database...' : 'Wipe & Seed Mock Data'}
          </button>
        </section>
      </main>
    </div>
  );
}
"""

with open('/Users/adityakumarsingh/Documents/Face_Detection_Jetson/warden-dashboard/src/pages/Settings.tsx', 'w') as f:
    f.write(content)
print("Settings.tsx created")
