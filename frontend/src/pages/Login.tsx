import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bot, Mail, Lock, ArrowRight, Globe, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import type { Provider } from '@supabase/supabase-js';

type AuthMode = 'login' | 'signup' | 'magic_link' | 'forgot_password';

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, forgotPassword, signInWithOAuth, signInWithOtp } = useAuth();

  const handleOAuth = async (provider: Provider) => {
    setError(null);
    try {
      const { error } = await signInWithOAuth(provider);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { error: authError } = await signIn(email, password);
        if (authError) throw authError;
        navigate('/dashboard');
      } else if (mode === 'signup') {
        const { error: authError } = await signUp(email, password, name);
        if (authError) throw authError;
        setMessage('Registration successful! Please verify your email.');
        setMode('login');
      } else if (mode === 'magic_link') {
        const { error: otpError } = await signInWithOtp(email);
        if (otpError) throw otpError;
        setMessage('Magic link sent! Check your inbox.');
      } else if (mode === 'forgot_password') {
        const { error: resetError } = await forgotPassword(email);
        if (resetError) throw resetError;
        setMessage('Password reset instructions sent to your email.');
      }
    } catch (err: any) {
      setError(err.message || 'An authentication error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas relative flex items-center justify-center p-4 overflow-hidden text-ink">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-20 w-96 h-96 mesh-1 mix-blend-multiply filter blur-[100px] opacity-30 animate-blob pointer-events-none"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 mesh-2 mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-canvas w-full max-w-[420px] p-8 rounded-md border border-hairline relative z-10 shadow-level-3"
      >
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-sm bg-ink flex items-center justify-center shadow-level-2 border border-hairline">
            <Bot className="w-6 h-6 text-on-primary" />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-[24px] font-semibold mb-2 tracking-[-0.96px] text-ink">
            {mode === 'login' && 'Welcome back'}
            {mode === 'signup' && 'Create an account'}
            {mode === 'magic_link' && 'Passwordless Login'}
            {mode === 'forgot_password' && 'Reset Password'}
          </h2>
          <p className="text-body text-[14px] mb-4">
            {mode === 'login' && 'Enter your credentials to access your workspace.'}
            {mode === 'signup' && 'Sign up to start chatting with your enterprise data.'}
            {mode === 'magic_link' && 'We will send a secure login link directly to your inbox.'}
            {mode === 'forgot_password' && 'Enter your email and we will send you reset instructions.'}
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-error-soft border border-error-soft text-error-deep text-[13px] rounded-sm p-3 text-left mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-success-soft border border-success-soft text-success-deep text-[13px] rounded-sm p-3 text-left mb-4">
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-[12px] font-medium text-ink mb-1">Full Name</label>
              <div className="relative">
                <input 
                  id="fullName"
                  name="fullName"
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-canvas border border-hairline rounded-sm py-2 px-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] shadow-level-1 text-ink placeholder:text-mute"
                  placeholder="John Doe"
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-[12px] font-medium text-ink mb-1">Work Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
              <input 
                id="email"
                name="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-canvas border border-hairline rounded-sm py-2 pl-9 pr-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] shadow-level-1 text-ink placeholder:text-mute"
                placeholder="name@company.com"
              />
            </div>
          </div>
          
          {(mode === 'login' || mode === 'signup') && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-[12px] font-medium text-ink">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => { setMode('forgot_password'); setError(null); setMessage(null); }} className="text-[12px] text-link hover:underline transition-colors font-medium">Forgot password?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mute" />
                <input 
                  id="password"
                  name="password"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="w-full bg-canvas border border-hairline rounded-sm py-2 pl-9 pr-3 focus:outline-none focus:border-link focus:ring-1 focus:ring-link transition-colors text-[14px] shadow-level-1 text-ink placeholder:text-mute"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="remember" name="remember" className="w-3.5 h-3.5 rounded-sm border-hairline text-link focus:ring-link accent-link" defaultChecked />
              <label htmlFor="remember" className="text-[12px] text-ink cursor-pointer">Remember me for 30 days</label>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading || !email || ((mode === 'login' || mode === 'signup') && !password)}
            className="w-full h-[40px] mt-2 rounded-sm bg-ink text-on-primary text-[14px] font-medium hover:bg-ink/90 shadow-level-2 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'magic_link' && 'Send Magic Link'}
                {mode === 'forgot_password' && 'Reset Password'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {mode === 'login' && (
          <button 
            type="button"
            onClick={() => setMode('magic_link')}
            className="w-full h-[40px] mt-3 rounded-sm bg-canvas border border-hairline text-ink text-[14px] font-medium hover:bg-canvas-soft shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-link" /> Sign in with Magic Link
          </button>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="mt-6 flex items-center justify-between before:content-[''] before:flex-1 before:border-b before:border-hairline after:content-[''] after:flex-1 after:border-b after:border-hairline">
              <span className="text-[11px] text-mute px-4 uppercase tracking-wider font-mono">Enterprise SSO</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => handleOAuth('github')} className="flex items-center justify-center gap-2 h-[38px] rounded-sm bg-canvas border border-hairline hover:bg-canvas-soft transition-colors text-[13px] font-medium shadow-sm text-ink">
                <Globe className="w-4 h-4" />
                GitHub
              </button>
              <button onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-2 h-[38px] rounded-sm bg-canvas border border-hairline hover:bg-canvas-soft transition-colors text-[13px] font-medium shadow-sm text-ink">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-hairline flex flex-col items-center justify-center gap-2">
          {(mode === 'magic_link' || mode === 'forgot_password') ? (
            <button 
              onClick={() => { setMode('login'); setError(null); setMessage(null); }} 
              className="text-[13px] text-ink hover:text-link transition-colors font-medium flex items-center gap-1"
            >
              ← Back to Login
            </button>
          ) : (
            <p className="text-center text-[13px] text-mute">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setMessage(null);
                }} 
                className="text-ink hover:text-link transition-colors font-medium"
              >
                {mode === 'login' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          )}
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
