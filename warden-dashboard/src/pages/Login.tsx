import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

type AuthStep = 'idle' | 'email' | 'password' | 'loading' | 'error' | 'success';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus email when entering email step
  useEffect(() => {
    if (step === 'email' && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [step]);

  // Auto-focus password when entering password step
  useEffect(() => {
    if (step === 'password' && passwordInputRef.current) {
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleStartAuth = () => {
    setStep('email');
    setError('');
  };

  const handleEmailSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && email.trim()) {
      // Validate email format
      if (!email.includes('@')) {
        setError('Please enter a valid email address');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
        return;
      }
      setStep('password');
      setError('');
    }
  };

  const handlePasswordSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password.trim()) {
      handleAuthenticate();
    }
  };

  const handleAuthenticate = async () => {
    if (!password.trim()) return;

    setStep('loading');
    setError('');

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock authentication logic
    const isValidCredentials = 
      email === 'system_controller_01@onekbyte.com' && 
      password === 'admin';

    if (isValidCredentials) {
      setStep('success');
      // Transition to dashboard after success animation
      setTimeout(() => navigate('/'), 800);
    } else {
      setStep('error');
      setError('Invalid credentials. Please try again.');
      setPassword('');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      setTimeout(() => setStep('password'), 2000);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.4 } }
  };

  const buttonVariants = {
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.02, transition: { duration: 0.3, ease: 'easeOut' } },
    tap: { scale: 0.98 }
  };

  const glassInputVariants = {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: [0.34, 1.56, 0.64, 1], // Spring-like easing
        type: 'spring',
        stiffness: 100,
        damping: 15
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: -20, 
      transition: { duration: 0.3 } 
    }
  };

  const shakeVariants = {
    shake: {
      x: [0, -10, 10, -10, 10, 0],
      transition: { duration: 0.5, ease: 'easeInOut' }
    }
  };

  const loadingPulse = {
    animate: {
      boxShadow: [
        '0 0 20px rgba(255, 140, 66, 0.3)',
        '0 0 40px rgba(255, 140, 66, 0.6)',
        '0 0 20px rgba(255, 140, 66, 0.3)'
      ],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden"
      style={{
        backgroundImage: 'url(/front_onekbyte.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Gradient Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        animate={{ 
          background: step === 'loading' || step === 'success' 
            ? 'radial-gradient(circle at center, rgba(255,251,247,0.3), rgba(45,36,22,0.4))'
            : 'linear-gradient(to right, rgba(255,251,247,0.6), rgba(255,251,247,0.4), rgba(255,251,247,0.6))'
        }}
        transition={{ duration: 0.8 }}
      />

      {/* Auth Container */}
      <motion.main className="relative z-10 flex flex-col items-center justify-center w-full h-full pointer-events-auto">
        {/* Floating Glass Input Container */}
        <AnimatePresence mode="wait">
          {(step === 'email' || step === 'password' || step === 'loading' || step === 'error') && (
            <motion.div
              key="auth-form"
              variants={glassInputVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`w-full max-w-sm px-margin-mobile ${shakeError ? 'shake' : ''}`}
            >
              {/* Glass Container */}
              <motion.div
                animate={step === 'loading' ? { boxShadow: '0 0 20px rgba(255, 140, 66, 0.3)' } : {}}
                className="relative backdrop-blur-[20px] bg-white/5 rounded-3xl p-stack-lg border border-white/20 transition-all"
                style={{
                  boxShadow: step === 'loading' || step === 'error' 
                    ? '0 0 20px rgba(255, 140, 66, 0.3)' 
                    : '0 8px 32px 0 rgba(31, 38, 135, 0.08)'
                }}
              >
                {/* Email Field */}
                {step === 'email' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-unit"
                  >
                    <label className="font-label-md text-label-md text-on-surface ml-stack-sm mb-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <input
                        ref={emailInputRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={handleEmailSubmit}
                        placeholder="system_controller_01@onekbyte.com"
                        className="w-full h-12 px-12 backdrop-blur-sm bg-white/5 rounded-2xl font-body-md text-on-surface border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/8 transition-all placeholder:text-on-surface/50"
                      />
                      <span 
                        className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface text-xl opacity-60 transition-opacity" 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        mail
                      </span>
                    </div>
                    <p className="text-xs text-on-surface/50 ml-stack-sm">Press Enter to continue</p>
                  </motion.div>
                )}

                {/* Password Field */}
                {(step === 'password' || step === 'error') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-stack-md"
                  >
                    {/* Email Summary */}
                    <div className="flex items-center gap-stack-sm px-unit py-unit rounded-xl bg-white/5 border border-white/10">
                      <span 
                        className="material-symbols-outlined text-on-surface text-lg opacity-70" 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        mail
                      </span>
                      <span className="text-body-sm text-on-surface truncate flex-1">{email}</span>
                      <button
                        onClick={() => setStep('email')}
                        className="text-primary hover:text-primary-container transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>edit</span>
                      </button>
                    </div>

                    {/* Password Input */}
                    <div className="flex flex-col gap-unit">
                      <label className="font-label-md text-label-md text-on-surface ml-stack-sm mb-1">
                        Password
                      </label>
                      <div className="relative group">
                        <input
                          ref={passwordInputRef}
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={handlePasswordSubmit}
                          placeholder="••••••••••••"
                          className="w-full h-12 px-12 backdrop-blur-sm bg-white/5 rounded-2xl font-body-md text-on-surface border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 focus:bg-white/8 transition-all placeholder:text-on-surface/50"
                        />
                        <span 
                          className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface text-xl opacity-60" 
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          lock
                        </span>
                      </div>
                      <p className="text-xs text-on-surface/50 ml-stack-sm">Press Enter to authenticate</p>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-center gap-stack-sm px-unit py-unit rounded-lg bg-red-500/10 border border-red-500/30"
                        >
                          <span 
                            className="material-symbols-outlined text-red-400 text-lg" 
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            error
                          </span>
                          <span className="text-body-xs text-red-400">{error}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* Loading State */}
                {step === 'loading' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-stack-lg py-stack-lg"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white/50"
                    />
                    <div className="flex flex-col items-center gap-unit">
                      <p className="font-label-md text-on-surface">Authenticating</p>
                      <p className="text-body-xs text-on-surface/60">Verifying credentials...</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Access System Button - Bottom Center */}
        {step === 'idle' && (
          <motion.button
            onClick={handleStartAuth}
            variants={buttonVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-80 h-16 backdrop-blur-sm bg-gradient-to-r from-white/8 to-white/5 rounded-3xl font-headline-md text-on-surface border border-white/15 hover:from-white/12 hover:to-white/8 transition-all flex items-center justify-center gap-stack-sm z-20"
            style={{
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span 
              className="material-symbols-outlined text-2xl" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lock_open
            </span>
            <span className="font-bold">ACCESS SYSTEM</span>
          </motion.button>
        )}

        {/* Success State */}
        {step === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-stack-lg"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-white/15 to-white/5 border border-white/20 flex items-center justify-center"
            >
              <motion.span
                animate={{ scale: [0, 1] }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="material-symbols-outlined text-white text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </motion.span>
            </motion.div>
            <motion.p
              animate={{ opacity: [0, 1] }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="font-label-lg text-on-surface"
            >
              Welcome back!
            </motion.p>
          </motion.div>
        )}
      </motion.main>

      {/* Apply shake animation */}
      {shakeError && (
        <style>{`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            50% { transform: translateX(10px); }
            75% { transform: translateX(-10px); }
            100% { transform: translateX(0); }
          }
          .shake { animation: shake 0.5s ease-in-out; }
        `}</style>
      )}
    </motion.div>
  );
};
