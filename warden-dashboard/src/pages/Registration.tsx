import React, { useState, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, Fingerprint, CloudUpload } from 'lucide-react';
import { TopBar } from '../components/TopBar';

export default function Registration() {
  const [scanning, setScanning] = useState(false);
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const interval = setInterval(() => {
      setScanPos(prev => (prev >= 100 ? 0 : prev + 2));
    }, 50);
    return () => clearInterval(interval);
  }, [scanning]);

  return (
    <>
      <div className="flex flex-col gap-stack-lg min-h-[calc(100vh-120px)]">
        {/* Process Tracking Timeline */}
        <div className="p-8 rounded-3xl neu-convex bg-surface-container relative">
          <div className="flex justify-between items-center relative">
            {/* Progress Line Background */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-container-highest -translate-y-1/2 rounded-full overflow-hidden">
              <div className="h-full bg-primary-container w-[66%] filter drop-shadow-[0_0_12px_rgba(203,190,255,0.4)]"></div>
            </div>
            
            {/* Steps */}
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full neu-inset bg-surface-container-low flex items-center justify-center text-secondary">
                <CheckCircle size={24} className="fill-secondary text-surface-container-low" />
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">Profile Setup</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full neu-inset bg-surface-container-low flex items-center justify-center text-secondary">
                <CheckCircle size={24} className="fill-secondary text-surface-container-low" />
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">Verification</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full neu-convex bg-surface flex items-center justify-center text-primary scale-110 shadow-[0_0_20px_rgba(203,190,255,0.3)]">
                <span className="material-symbols-outlined text-3xl">face</span>
              </div>
              <span className="font-label-md text-label-md text-primary font-bold">Biometric Studio</span>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-3 opacity-40">
              <div className="w-12 h-12 rounded-full neu-convex bg-surface-container flex items-center justify-center text-on-surface-variant">
                <Fingerprint size={24} />
              </div>
              <span className="font-label-md text-label-md text-on-surface-variant">Digital Signature</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Camera Feed Housing */}
          <div className="col-span-1 lg:col-span-8">
            <div className="p-1 rounded-[40px] neu-inset bg-surface-container-lowest overflow-hidden">
              <div className="relative aspect-video rounded-[36px] overflow-hidden bg-black group flex items-center justify-center">
                {/* Simulated Camera Feed */}
                <img 
                  alt="Face Enrollment View" 
                  className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-1000" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBW-YBjaf3TauwwwFWepA57vjGcMRXiYsFLdndEhNUXzHij9GRfPuKxFAQ4hNfptbFnQczf1UdFGjoOV5JhmQ3SHRmNHeQJGYITaDF-j2zwau_IoMShCpy9P3EVXm2-UkPSbEzGdJHaOu9xnVCzK7BvOdrGNVnyVDneOr_ySmYCEuQWOA645cRc4i4-bthy2Gyh3POtoZ7hXGQ5ay4BY0k8sarqHyYeZjC1K-YehqToeK0eN5J2jmjWpe162iobJShQoVy7PNlLszU"
                />
                
                {/* Scanning Animation */}
                {scanning && (
                  <div 
                    className="absolute left-0 w-full h-[2px] bg-secondary z-20 shadow-[0_0_15px_rgba(112,255,231,0.8)] opacity-70"
                    style={{ top: `${scanPos}%` }}
                  />
                )}

                {/* Diagnostic HUD Overlays */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(203, 190, 255, 0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                
                {/* Corner Brackets */}
                <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-primary/50 rounded-tl-2xl"></div>
                <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-primary/50 rounded-tr-2xl"></div>
                <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-primary/50 rounded-bl-2xl"></div>
                <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-primary/50 rounded-br-2xl"></div>
                
                {/* Diagnostic Bars */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[80%] flex flex-col gap-4 bg-black/40 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md text-on-surface-variant">Exposure</span>
                        <span className="font-label-md text-label-md text-secondary">Good</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-[85%] drop-shadow-[0_0_8px_rgba(0,229,203,0.5)]"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md text-on-surface-variant">Angle</span>
                        <span className="font-label-md text-label-md text-secondary">Frontal</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-[92%] drop-shadow-[0_0_8px_rgba(0,229,203,0.5)]"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-label-md text-label-md text-on-surface-variant">Range</span>
                        <span className="font-label-md text-label-md text-secondary">Correct</span>
                      </div>
                      <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-[78%] drop-shadow-[0_0_8px_rgba(0,229,203,0.5)]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Capture Button */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-6">
                  <button 
                    onClick={() => setScanning(!scanning)}
                    className="w-16 h-16 rounded-full neu-convex bg-surface-container flex items-center justify-center text-primary hover:text-secondary hover:scale-105 active:scale-95 transition-all group/btn"
                  >
                    {!scanning ? (
                      <Camera className="text-3xl" size={28} />
                    ) : (
                      <div className="w-8 h-8 rounded-full border-4 border-secondary border-t-transparent animate-spin"></div>
                    )}
                  </button>
                  <button className="w-12 h-12 rounded-full neu-convex bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-all">
                    <RefreshCw size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Control & Config Sidebar */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-gutter">
            {/* Enrollment Status Card */}
            <div className="p-6 rounded-3xl neu-convex bg-surface-container flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface">System Readout</h3>
                <span className="material-symbols-outlined text-primary">analytics</span>
              </div>
              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-2xl neu-inset bg-surface-container-lowest flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Feature Density</span>
                  <span className="font-body-sm text-body-sm text-primary font-bold">1,024 Points</span>
                </div>
                <div className="p-4 rounded-2xl neu-inset bg-surface-container-lowest flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Liveness Check</span>
                  <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-lg font-label-md text-label-md shadow-[0_0_8px_rgba(0,229,203,0.5)]">VERIFIED</span>
                </div>
                <div className="p-4 rounded-2xl neu-inset bg-surface-container-lowest flex items-center justify-between">
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Neural Hash</span>
                  <span className="font-label-md text-label-md text-on-surface-variant font-mono">0x4F...E2</span>
                </div>
              </div>
            </div>

            {/* Digital Asset Dropzone */}
            <div className="p-8 rounded-3xl neu-inset bg-surface-container-lowest border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-all duration-300">
              <div className="w-16 h-16 rounded-full neu-convex bg-surface-container flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <CloudUpload size={28} />
              </div>
              <h4 className="font-body-md text-body-md text-on-surface mb-1">Import Legacy Data</h4>
              <p className="font-label-md text-label-md text-on-surface-variant">Supports .OBJ, .RAW, .JPG (min 4K)</p>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col gap-4 mt-auto">
              <button className="w-full py-4 rounded-2xl neu-convex bg-primary-container text-on-primary-container font-headline-md text-[20px] font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:neu-inset active:scale-[0.98] transition-all">
                Finalize Enrollment
                <Fingerprint size={24} />
              </button>
              <button className="w-full py-4 rounded-2xl neu-convex bg-surface-container text-on-surface-variant font-body-md text-body-md hover:text-primary transition-all">
                Cancel Session
              </button>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-auto pt-stack-lg flex justify-between items-center text-on-surface-variant/40">
          <p className="font-label-md text-label-md">ENCRYPTED STREAM: AES-256-GCM</p>
          <p className="font-label-md text-label-md">LATENCY: 12ms</p>
        </div>
      </div>
    </>
  );
}
