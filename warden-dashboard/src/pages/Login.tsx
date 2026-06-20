import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login for now
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-stretch selection:bg-primary-container selection:text-on-primary-container bg-background">
      {/* Left Section: 55% Branding & Preview */}
      <section 
        className="hidden lg:flex lg:w-[55%] relative flex-col items-center justify-center p-margin-desktop overflow-hidden bg-background"
        onMouseMove={handleMouseMove}
      >
        {/* Deep Fluid Gradient Background */}
        <div 
          className="absolute inset-0 radial-glow opacity-80 pointer-events-none" 
          style={{ background: `radial-gradient(circle at ${position.x || 344}px ${position.y || 976}px, rgba(101, 62, 255, 0.12) 0%, rgba(20, 18, 27, 0) 50%)` }}
        ></div>
        {/* Animated Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[0%] w-[300px] h-[300px] bg-secondary/10 blur-[100px] rounded-full"></div>
        
        <div className="z-10 w-full max-w-3xl flex flex-col gap-stack-lg">
          <div className="flex flex-col gap-stack-sm">
            <span className="text-secondary font-label-md tracking-widest uppercase neon-glow-teal">Unified Control Center</span>
            <h1 
              className="font-headline-xl text-headline-xl leading-tight text-on-surface" 
              style={{ textShadow: 'rgba(3, 1, 10, 0.8) 2px 2px 4px, rgba(203, 190, 255, 0.3) -1px -1px 2px, rgba(203, 190, 255, 0.15) 0px 0px 12px' }}
            >
              ONEKBYTES&nbsp;<br />Hostel Management.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
              Real-time resident logistics, biometrics, and automated analytics carved from a single digital substrate.
            </p>
          </div>
          
          {/* Laptop Preview Frame */}
          <div className="relative mt-stack-lg group">
            <div className="laptop-frame neumorphic-high-lift overflow-hidden bg-surface-container-low transition-transform duration-700 hover:scale-[1.02]">
              <img 
                alt="Dashboard Preview" 
                className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuChLckWCpBDeeUaEp6jnGTOFLjBTBL0zs7wfNplabtUy-k5hThfSrK3ubt4-V9RKsYD2tfHoSzSseMjgKdoxfJTQ-Xd8iYDnN98lM_-uXCI-INvljOkA2kCtttrGU4XlAh3U2Sz27th4r4cBwCO3rpfYN8AWczs_BlpLGhUYaKGeXQPBntDfv3hXzjM9nCfinbI99_gHNp4qYGaD0GnVFl9xwxztRcliiIAX9l-n5ozvakG03CRQv7xVar-YcZcp4QHuqso-3hN_kE" 
              />
              {/* Overlay Micro-interactions */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-md border border-primary/30 neumorphic-convex">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </div>
              </div>
            </div>
            <div className="laptop-base"></div>
          </div>
        </div>
      </section>

      {/* Right Section: 45% Authentication Canvas */}
      <main className="w-full lg:w-[45%] flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-surface z-10 relative">
        <form onSubmit={handleLogin} className="w-full max-w-md flex flex-col gap-stack-lg animate-in fade-in slide-in-from-right-8 duration-700">
          {/* Brand Header */}
          <div className="flex flex-col items-center gap-stack-sm mb-stack-sm">
            <div className="w-16 h-16 rounded-2xl neumorphic-convex bg-surface-container flex items-center justify-center mb-stack-sm">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">System Access</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">OneKByte Labs v2.4 Terminal</p>
          </div>
          
          {/* Login Box (Extruded Neumorphic Block) */}
          <div className="bg-surface-container neumorphic-high-lift rounded-[32px] p-stack-lg flex flex-col gap-stack-md border border-white/5">
            {/* Email Field */}
            <div className="flex flex-col gap-unit">
              <label className="font-label-md text-label-md text-on-surface-variant ml-stack-sm mb-1" htmlFor="admin_id">ADMIN_ID</label>
              <div className="relative group">
                <input 
                  className="w-full h-14 px-12 bg-surface-container-low rounded-xl font-body-md text-on-surface neumorphic-inset border-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-outline" 
                  id="admin_id" 
                  placeholder="system_controller_01" 
                  type="text" 
                  required
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>fingerprint</span>
              </div>
            </div>
            
            {/* Password Field */}
            <div className="flex flex-col gap-unit">
              <label className="font-label-md text-label-md text-on-surface-variant ml-stack-sm mb-1" htmlFor="access_key">ACCESS_KEY</label>
              <div className="relative">
                <input 
                  className="w-full h-14 px-12 bg-surface-container-low rounded-xl font-body-md text-on-surface neumorphic-inset border-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-outline" 
                  id="access_key" 
                  placeholder="••••••••••••" 
                  type="password" 
                  required
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>key</span>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline text-xl cursor-pointer hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>visibility</span>
              </div>
            </div>
            
            {/* Secondary Options */}
            <div className="flex items-center justify-between px-unit mt-2">
              <label className="flex items-center gap-stack-sm cursor-pointer group">
                <div className="w-5 h-5 rounded bg-surface-container-low neumorphic-inset flex items-center justify-center transition-all group-hover:scale-105">
                  <div className="w-2 h-2 rounded-full bg-secondary opacity-0 transition-opacity peer-checked:opacity-100"></div>
                </div>
                <input className="hidden peer" type="checkbox" />
                <span className="font-body-sm text-body-sm text-on-surface-variant group-hover:text-on-surface transition-colors">Persist Session</span>
              </label>
              <a className="font-body-sm text-body-sm text-primary hover:text-primary-container transition-colors font-semibold" href="#">Recovery Key?</a>
            </div>
            
            {/* Submit Button */}
            <button type="submit" className="mt-stack-sm w-full h-16 bg-surface-container rounded-2xl font-headline-md text-on-surface neumorphic-convex hover:scale-[0.98] active:scale-95 active:neumorphic-inset transition-all duration-200 group flex items-center justify-center gap-stack-sm">
              <span className="font-bold">INITIALIZE CORE</span>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </button>
            
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent my-stack-sm"></div>
            
            {/* Alternative Logins */}
            <div className="grid grid-cols-2 gap-stack-md">
              <button type="button" className="h-12 neumorphic-convex bg-surface-container rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors active:neumorphic-inset">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
                <span className="font-label-md text-label-md">QR SCAN</span>
              </button>
              <button type="button" className="h-12 neumorphic-convex bg-surface-container rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors active:neumorphic-inset">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>
                <span className="font-label-md text-label-md">BIO AUTH</span>
              </button>
            </div>
          </div>
          
          {/* Footer Meta */}
          <div className="flex items-center justify-center gap-stack-md opacity-40">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-secondary neon-glow-teal animate-pulse"></div>
              <span className="font-label-md text-[10px] uppercase tracking-widest">Node: Delta-04</span>
            </div>
            <div className="w-px h-3 bg-outline"></div>
            <span className="font-label-md text-[10px] uppercase tracking-widest">Secure TLS 1.3</span>
          </div>
        </form>
      </main>
    </div>
  );
};
