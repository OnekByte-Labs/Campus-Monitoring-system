import React, { useState } from 'react';
import { UserPlus, Hash, DoorOpen, CheckCircle, Fingerprint, Activity, ShieldCheck, Cpu } from 'lucide-react';
import axios from 'axios';
import { TopBar } from '../components/TopBar';

export default function Registration() {
  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    room_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(false);
    setErrorMsg('');

    try {
      const res = await axios.post('http://localhost:3000/api/v1/students', formData);
      if (res.status === 201) {
        setSuccess(true);
        setFormData({ full_name: '', student_id: '', room_number: '' });
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to create resident profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-stack-lg min-h-[calc(100vh-120px)]">
        <TopBar title="Resident Enrollment Gateway" />

        <div className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-xl bg-surface-container rounded-3xl p-8 neu-convex border border-outline-variant/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            
            {/* Form Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 rounded-full neu-inset bg-surface-container-lowest flex items-center justify-center text-primary mb-4 border border-primary/20 shadow-[0_0_20px_rgba(203,190,255,0.15)]">
                <ShieldCheck size={40} className="drop-shadow-[0_0_10px_rgba(203,190,255,0.5)]" />
              </div>
              <h2 className="font-headline-md text-3xl font-bold text-on-surface mb-2 tracking-tight">Identity Provisioning</h2>
              <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">
                Securely register a new resident into the Warden OS biometric database.
              </p>
            </div>

            {/* Success Alert */}
            {success && (
              <div className="mb-8 p-4 rounded-2xl bg-secondary/10 border border-secondary/30 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-2 bg-secondary/20 rounded-xl">
                  <CheckCircle className="text-secondary drop-shadow-[0_0_8px_rgba(0,229,203,0.8)]" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm font-bold text-secondary tracking-wide">Identity Profile Created</span>
                  <span className="font-body-sm text-secondary/80">Ready for Biometric Capture. Proceed to Studio.</span>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMsg && (
              <div className="mb-8 p-4 rounded-2xl bg-error/10 border border-error/30 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-2 bg-error/20 rounded-xl">
                  <Activity className="text-error" size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="font-headline-sm font-bold text-error tracking-wide">Provisioning Failed</span>
                  <span className="font-body-sm text-error/80">{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-[12px] font-bold text-on-surface-variant uppercase tracking-widest pl-2">
                  Legal Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserPlus size={20} className="text-on-surface-variant group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface text-lg rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="e.g. Eleanor Vance"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[12px] font-bold text-on-surface-variant uppercase tracking-widest pl-2">
                    Student ID
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Hash size={20} className="text-on-surface-variant group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="student_id"
                      required
                      value={formData.student_id}
                      onChange={handleChange}
                      className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface font-mono text-lg rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-on-surface-variant/50"
                      placeholder="e.g. STU-802"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[12px] font-bold text-on-surface-variant uppercase tracking-widest pl-2">
                    Assigned Room
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <DoorOpen size={20} className="text-on-surface-variant group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="room_number"
                      required
                      value={formData.room_number}
                      onChange={handleChange}
                      className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface text-lg font-mono rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-on-surface-variant/50"
                      placeholder="e.g. A-412"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/10 mt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative overflow-hidden group py-4 rounded-2xl bg-primary-container text-on-primary-container font-headline-md text-xl font-bold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(203,190,255,0.2)] hover:shadow-[0_0_30px_rgba(203,190,255,0.4)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  
                  {isSubmitting ? (
                    <>
                      <Cpu size={24} className="animate-pulse" />
                      PROVISIONING...
                    </>
                  ) : (
                    <>
                      <Fingerprint size={24} />
                      ENROLL RESIDENT
                    </>
                  )}
                </button>
              </div>

            </form>

            <div className="mt-8 text-center flex items-center justify-center gap-2 text-on-surface-variant opacity-60">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <p className="font-label-md text-[10px] tracking-widest uppercase">AES-256 Encrypted Database Link</p>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}
