import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  MessageSquare, 
  FileText, 
  Settings, 
  CreditCard, 
  LogOut, 
  Bot,
  Menu,
  Users,
  Moon,
  Sun,
  User
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';

const NotificationCenter = lazy(() => import('../components/NotificationCenter.tsx').then(m => ({ default: m.NotificationCenter })));

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const navItems = [
    { name: 'Overview', path: '/dashboard/overview', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { name: 'AI Chat', path: '/dashboard/chat', icon: <MessageSquare className="w-[18px] h-[18px]" /> },
    { name: 'Documents', path: '/dashboard/documents', icon: <FileText className="w-[18px] h-[18px]" /> },
    { name: 'Team Workspace', path: '/dashboard/team', icon: <Users className="w-[18px] h-[18px]" /> },
    { name: 'Billing', path: '/dashboard/billing', icon: <CreditCard className="w-[18px] h-[18px]" /> },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings className="w-[18px] h-[18px]" /> },
  ];

  return (
    <div className="flex h-screen bg-canvas-soft-2 text-ink overflow-hidden font-sans transition-colors duration-300">
      
      {/* Sidebar - Glassmorphism */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 72 }}
        className="h-full glass-panel z-20 flex flex-col transition-all duration-300 relative shrink-0 m-0 md:m-2 md:rounded-xl md:shadow-level-3 overflow-hidden"
      >
        <div className="h-20 flex items-center px-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-link-deep to-violet-deep flex items-center justify-center shrink-0 shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && <span className="ml-3 font-semibold text-[18px] tracking-tight whitespace-nowrap text-ink">RAGFlow</span>}
        </div>

        <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-3 rounded-lg transition-all duration-200 text-[14px] font-medium
                ${isActive 
                  ? 'bg-ink text-on-primary shadow-level-2 scale-[0.98]' 
                  : 'text-body hover:bg-canvas-soft hover:text-ink hover:scale-[0.98]'}
              `}
            >
              <div className="shrink-0 opacity-80">{item.icon}</div>
              {sidebarOpen && <span className="ml-3 whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 shrink-0">
          <button 
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="flex items-center px-3 py-3 rounded-lg text-body hover:bg-error-soft hover:text-error-deep transition-all duration-200 w-full text-[14px] font-medium group"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0 opacity-80 group-hover:opacity-100" />
            {sidebarOpen && <span className="ml-3 whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar - Glassmorphism */}
        <header className="h-20 glass-panel flex items-center justify-between px-8 z-10 shrink-0 m-0 md:mt-2 md:mr-2 md:rounded-xl border-b md:border-hairline">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 -ml-2 rounded-lg hover:bg-canvas-soft transition-colors text-mute hover:text-ink"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-canvas-soft transition-colors text-mute hover:text-ink"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Suspense fallback={<div className="w-9 h-9" />}>
              <NotificationCenter isDark={isDark} />
            </Suspense>
            <div className="flex items-center gap-3 pl-6 border-l border-hairline">
              {user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="User Avatar" 
                  loading="lazy" 
                  decoding="async"
                  className="w-10 h-10 rounded-full border-2 border-canvas shadow-sm object-cover" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-canvas-soft border-2 border-canvas shadow-sm flex items-center justify-center">
                  <User className="w-5 h-5 text-mute" />
                </div>
              )}
              <div className="hidden md:block">
                <p className="text-[14px] font-semibold text-ink leading-tight">
                  {user?.user_metadata?.first_name 
                    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}` 
                    : user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-[12px] text-mute font-medium">Pro Plan</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-6 md:p-10 max-w-[1400px] mx-auto h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
