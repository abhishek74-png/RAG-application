import React, { useState, useEffect } from 'react';
import { Bot, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-canvas/80 backdrop-blur-md border-b border-hairline' : 'bg-transparent'}`}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-on-primary" />
            </div>
            <span className="font-semibold text-[18px] tracking-tight text-ink">RAGFlow</span>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            <a href="#features" className="text-body text-[14px] leading-[20px] font-normal hover:bg-canvas-soft hover:text-ink rounded-full px-3 py-2 transition-colors">Features</a>
            <div className="relative group cursor-pointer flex items-center gap-1 hover:bg-canvas-soft rounded-full px-3 py-2 transition-colors">
              <span className="text-body text-[14px] leading-[20px] font-normal group-hover:text-ink">Solutions</span>
              <ChevronDown className="w-4 h-4 text-mute group-hover:text-ink" />
            </div>
            <a href="#demo" className="text-body text-[14px] leading-[20px] font-normal hover:bg-canvas-soft hover:text-ink rounded-full px-3 py-2 transition-colors">Demo</a>
            <a href="#pricing" className="text-body text-[14px] leading-[20px] font-normal hover:bg-canvas-soft hover:text-ink rounded-full px-3 py-2 transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {!user ? (
              <>
                <button onClick={() => navigate('/login')} className="text-ink text-[14px] font-medium h-[28px] px-3 rounded-sm hover:bg-canvas-soft transition-colors">
                  Log in
                </button>
                <button onClick={() => navigate('/login')} className="bg-primary text-on-primary text-[14px] font-medium h-[28px] px-3 rounded-sm hover:bg-primary/90 transition-colors">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/dashboard')} className="bg-primary text-on-primary text-[14px] font-medium h-[28px] px-3 rounded-sm hover:bg-primary/90 transition-colors">
                  Dashboard
                </button>
                <button onClick={() => signOut()} className="text-ink text-[14px] font-medium h-[28px] px-3 rounded-sm hover:bg-canvas-soft transition-colors">
                  Log out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
