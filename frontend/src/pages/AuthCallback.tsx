import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        
        // Handle OAuth error from query params
        const errorDesc = params.get('error_description');
        if (errorDesc) {
            throw new Error(errorDesc);
        }

        // Handle OAuth error from hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashError = hashParams.get('error_description');
        if (hashError) {
          throw new Error(hashError);
        }

        const code = params.get('code');
        
        if (code) {
          // Explicitly exchange the code for a session
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          // Fallback to getSession for implicit flow or if session is already active
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!data.session) {
            throw new Error('No session found. Authentication may have failed or was cancelled.');
          }
        }

        // Successfully authenticated, redirect to dashboard
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An error occurred during authentication.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-ink">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-canvas-soft border border-error-soft text-error-deep p-6 rounded-md shadow-level-2 max-w-md w-full text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-4 text-error" />
          <h2 className="text-[18px] font-semibold mb-2">Authentication Failed</h2>
          <p className="text-[14px] text-body mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="bg-error text-white px-4 py-2 rounded-sm text-[14px] font-medium hover:bg-error/90 transition-colors">
            Return to Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center text-ink">
      <Loader2 className="w-8 h-8 animate-spin text-link mb-4" />
      <p className="text-[14px] text-mute font-medium animate-pulse">Completing authentication...</p>
    </div>
  );
};

export default AuthCallback;
