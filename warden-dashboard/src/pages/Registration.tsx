import React, { useState, useEffect } from 'react';
import { UserPlus, Hash, DoorOpen, CheckCircle, Fingerprint, Activity, ShieldCheck, Cpu, Camera, Info, XCircle } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { TopBar } from '../components/TopBar';

export default function Registration() {
  const [formData, setFormData] = useState({
    full_name: '',
    student_id: '',
    room_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  
  const [isScanning, setIsScanning] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [captureStep, setCaptureStep] = useState(0);
  const angles = ['Center', 'Left', 'Right', 'Up', 'Down'];
  
  const [toast, setToast] = useState<{message: string, type: 'info' | 'success' | 'error'} | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    
    socket.on('enrollment_success', (data) => {
      setEnrollmentStatus('success');
      setIsScanning(false);
      showToast(`Enrollment Complete! Biometric profile saved.`, 'success');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/v1/students`, formData);
      if (res.status === 201) {
        setIsRegistered(true);
        setCaptureStep(0);
        showToast('Identity Profile Created. Ready for scan.', 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to create resident profile.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartScan = async () => {
    if (!formData.student_id) return;
    
    setIsScanning(true);
    setEnrollmentStatus('scanning');
    showToast(`Capturing angle: ${angles[captureStep]}... Please hold still.`, 'info');

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/v1/students/enroll-biometric`, {
        student_id: formData.student_id
      });
      
      // Since Jetson is now configured to capture exactly 1 frame per request, 
      // we immediately succeed this step and increment.
      const nextStep = captureStep + 1;
      
      if (nextStep >= 5) {
        setEnrollmentStatus('success');
        setIsScanning(false);
        showToast('Multi-Angle Biometric Capture Complete.', 'success');
        
        // Auto-clear form for next student after a brief pause
        setTimeout(() => {
          setFormData({ full_name: '', student_id: '', room_number: '' });
          setIsRegistered(false);
          setCaptureStep(0);
          setEnrollmentStatus('idle');
        }, 3000);
      } else {
        setCaptureStep(nextStep);
        setIsScanning(false);
        setEnrollmentStatus('idle');
        showToast(`Capture successful. Next: Please Look ${angles[nextStep]}`, 'success');
      }
      
    } catch (err: any) {
      setIsScanning(false);
      setEnrollmentStatus('idle');
      showToast(err.response?.data?.error || 'Failed to trigger hardware scan.', 'error');
    }
  };

  return (
    <>
      <div className="flex flex-col gap-stack-lg min-h-[calc(100vh-120px)] relative">
        <TopBar title="Resident Enrollment Gateway" />

        {/* Toast Notification Layer */}
        {toast && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`px-6 py-4 rounded-full flex items-center gap-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border ${
              toast.type === 'success' ? 'bg-secondary/20 border-secondary/50 text-secondary' :
              toast.type === 'error' ? 'bg-error/20 border-error/50 text-error' :
              'bg-primary/20 border-primary/50 text-primary'
            } backdrop-blur-md`}>
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <XCircle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
              <span className="font-headline-sm tracking-wide font-bold">{toast.message}</span>
            </div>
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-stack-xl px-margin-desktop py-stack-lg">
          
          {/* COLUMN 1: ENROLLMENT FORM */}
          <div className="w-full bg-surface-container rounded-3xl p-8 neu-convex border border-outline-variant/10 flex flex-col justify-between">
            <div>
              {/* Form Header */}
              <div className="flex flex-col items-start mb-8">
                <div className="w-16 h-16 rounded-full neu-inset bg-surface-container-lowest flex items-center justify-center text-primary mb-4 border border-primary/20">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="font-headline-md text-3xl font-bold text-on-surface mb-2 tracking-tight">Identity Provisioning</h2>
                <p className="font-body-md text-on-surface-variant">
                  Register the resident, then initialize the hardware biometric capture process.
                </p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegister} className="flex flex-col gap-6">
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
                      disabled={isRegistered}
                      value={formData.full_name}
                      onChange={handleChange}
                      className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface text-lg rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-on-surface-variant/50 disabled:opacity-50"
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
                        disabled={isRegistered}
                        value={formData.student_id}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface font-mono text-lg rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-on-surface-variant/50 disabled:opacity-50"
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
                        disabled={isRegistered}
                        value={formData.room_number}
                        onChange={handleChange}
                        className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface text-lg font-mono rounded-2xl py-4 pl-12 pr-4 outline-none transition-all placeholder:text-on-surface-variant/50 disabled:opacity-50"
                        placeholder="e.g. A-412"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-2 flex gap-4">
                  {!isRegistered ? (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full relative overflow-hidden group py-4 rounded-2xl bg-surface-container-highest text-on-surface font-headline-md text-lg font-bold flex items-center justify-center gap-3 shadow-md hover:bg-surface-container-highest/80 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? <Cpu size={24} className="animate-pulse" /> : <UserPlus size={24} />}
                      REGISTER PROFILE
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={true}
                      className="w-full py-4 rounded-2xl bg-secondary/10 text-secondary border border-secondary/30 font-headline-md text-lg font-bold flex items-center justify-center gap-3"
                    >
                      <CheckCircle size={24} />
                      PROFILE REGISTERED
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Hardware Trigger Section */}
            <div className="mt-8 pt-8 border-t border-outline-variant/10">
              <button
                type="button"
                disabled={!isRegistered || isScanning || enrollmentStatus === 'success'}
                onClick={handleStartScan}
                className={`w-full relative overflow-hidden group py-5 rounded-2xl font-headline-md text-xl font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                  !isRegistered 
                    ? 'bg-surface-container-lowest text-on-surface-variant opacity-50 cursor-not-allowed'
                    : enrollmentStatus === 'success'
                    ? 'bg-secondary text-surface shadow-[0_0_20px_rgba(0,229,203,0.4)]'
                    : 'bg-primary-container text-on-primary-container shadow-[0_0_20px_rgba(203,190,255,0.2)] hover:shadow-[0_0_30px_rgba(203,190,255,0.4)] active:scale-[0.98]'
                }`}
              >
                {enrollmentStatus === 'scanning' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
                )}
                
                {enrollmentStatus === 'scanning' ? (
                  <div className="flex items-center gap-3"><Cpu size={24} className="animate-pulse" /> CAPTURING {angles[captureStep].toUpperCase()}...</div>
                ) : enrollmentStatus === 'success' ? (
                  <div className="flex items-center gap-3"><CheckCircle size={24} /> ENROLLMENT COMPLETE</div>
                ) : (
                  <>
                    <div className="flex items-center gap-3"><Camera size={24} /> CAPTURE ANGLE {captureStep + 1}/5</div>
                    <div className="text-sm font-normal opacity-80 font-mono tracking-widest">INSTRUCTION: LOOK {angles[captureStep].toUpperCase()}</div>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* COLUMN 2: LIVE MONITOR */}
          <div className="w-full flex flex-col gap-6">
            <h2 className="font-headline-md text-2xl font-bold text-on-surface flex items-center gap-3">
              <Camera className="text-primary" /> Live Feed Monitors
            </h2>
            
            <div className="grid grid-rows-2 gap-6 h-full">
              {/* CAM 0 Feed */}
              <div className="w-full h-full min-h-[250px] bg-black rounded-3xl overflow-hidden relative border border-outline-variant/20 shadow-lg group">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  <span className="text-white font-mono text-xs font-bold tracking-wider">CAM_0_ENTRANCE</span>
                </div>
                <img 
                  src={`http://${import.meta.env.VITE_JETSON_IP || '192.168.1.8'}:5001/video_feed_0`} 
                  alt="Live Feed 0"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>

              {/* CAM 1 Feed */}
              <div className="w-full h-full min-h-[250px] bg-black rounded-3xl overflow-hidden relative border border-outline-variant/20 shadow-lg group">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  <span className="text-white font-mono text-xs font-bold tracking-wider">CAM_1_EXIT</span>
                </div>
                <img 
                  src={`http://${import.meta.env.VITE_JETSON_IP || '192.168.1.8'}:5001/video_feed_1`} 
                  alt="Live Feed 1"
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
