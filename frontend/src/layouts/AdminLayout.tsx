import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  CreditCard, 
  FileText, 
  HardDrive, 
  Activity, 
  Settings, 
  ShieldAlert,
  LogOut,
  Bot,
  Menu,
  Search
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.ts';
import { NotificationCenter } from '../components/NotificationCenter.tsx';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Users & Subscriptions', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { name: 'Revenue & Plans', path: '/admin/revenue', icon: <CreditCard className="w-4 h-4" /> },
    { name: 'Documents & Storage', path: '/admin/storage', icon: <HardDrive className="w-4 h-4" /> },
    { name: 'AI Engine Usage', path: '/admin/ai-usage', icon: <Bot className="w-4 h-4" /> },
    { name: 'Audit Logs', path: '/admin/audit', icon: <FileText className="w-4 h-4" /> },
    { name: 'System Health', path: '/admin/health', icon: <Activity className="w-4 h-4" /> },
    { name: 'Platform Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-[#EDEDED] overflow-hidden font-sans">
      
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: sidebarOpen ? 260 : 64 }}
        className="h-full bg-[#111111] border-r border-[#222222] z-20 flex flex-col transition-all duration-300 relative shrink-0"
      >
        <div className="h-16 flex items-center px-4 border-b border-[#222222] shrink-0">
          <div className="w-8 h-8 rounded-sm bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && <span className="ml-3 font-semibold text-[15px] tracking-tight whitespace-nowrap text-white">SuperAdmin</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {sidebarOpen && <p className="px-3 mb-2 text-[10px] font-bold text-[#888888] uppercase tracking-widest">Platform Operations</p>}
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 rounded-sm transition-colors text-[13px]
                ${isActive 
                  ? 'bg-white/10 text-white font-medium shadow-sm' 
                  : 'text-[#888888] hover:bg-white/5 hover:text-white'}
              `}
            >
              <div className="shrink-0">{item.icon}</div>
              {sidebarOpen && <span className="ml-3 whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-[#222222] shrink-0">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center px-3 py-2.5 rounded-sm bg-[#222222] hover:bg-[#333333] text-white transition-colors w-full text-[13px] mb-2 font-medium"
          >
            {sidebarOpen ? 'Return to User App' : 'App'}
          </button>
          <button 
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="flex items-center px-3 py-2 rounded-sm text-[#888888] hover:bg-red-500/10 hover:text-red-500 transition-colors w-full text-[13px]"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="ml-3 font-medium whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0A]">
        
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#222222] bg-[#111111] flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 -ml-1.5 rounded-sm hover:bg-[#222222] transition-colors text-[#888888] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center bg-[#222222] rounded-sm px-3 py-1.5 w-64 border border-[#333333]">
               <Search className="w-4 h-4 text-[#888888]" />
               <label htmlFor="admin-global-search" className="sr-only">Search globally</label>
               <input id="admin-global-search" name="search" type="text" placeholder="Search globally..." className="bg-transparent border-none focus:outline-none text-[13px] text-white ml-2 w-full placeholder:text-[#888888]" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter isDark={true} />
            <div className="flex items-center gap-3 pl-4 border-l border-[#222222]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0A]">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
