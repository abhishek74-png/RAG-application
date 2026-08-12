import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, Zap, MessageSquare, ArrowUpRight, ArrowDownRight, Clock, Loader2, Database, BarChart3, Activity, HardDrive } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
const AIQueryChart = React.lazy(() => import('../../components/OverviewCharts').then(m => ({ default: m.AIQueryChart })));
const StorageGrowthChart = React.lazy(() => import('../../components/OverviewCharts').then(m => ({ default: m.StorageGrowthChart })));

const AnimatedCounter = ({ value, duration = 2 }: { value: number, duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = value / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start > value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

// Mock chart data to simulate real SaaS metrics
const aiQueryData = [
  { name: 'Mon', queries: 4000, expected: 2400 },
  { name: 'Tue', queries: 3000, expected: 1398 },
  { name: 'Wed', queries: 2000, expected: 9800 },
  { name: 'Thu', queries: 2780, expected: 3908 },
  { name: 'Fri', queries: 1890, expected: 4800 },
  { name: 'Sat', queries: 2390, expected: 3800 },
  { name: 'Sun', queries: 3490, expected: 4300 },
];

const storageData = [
  { month: 'Jan', gb: 4 },
  { month: 'Feb', gb: 7 },
  { month: 'Mar', gb: 12 },
  { month: 'Apr', gb: 18 },
  { month: 'May', gb: 25 },
  { month: 'Jun', gb: 45 },
];

const Overview = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => dashboardService.getDashboardStats(user!.id),
    enabled: !!user?.id,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statCards = [
    { title: "Total Documents", value: stats?.totalDocuments || 0, trend: "+12%", up: true, icon: <FileText className="text-ink" /> },
    { title: "Total AI Chats", value: stats?.totalChats || 0, trend: "+45%", up: true, icon: <MessageSquare className="text-link" /> },
    { title: "Storage Used", value: stats?.totalStorage || 0, isBytes: true, trend: "+2%", up: true, icon: <Database className="text-violet" /> },
    { title: "Avg Response", value: 1.2, isFloat: true, suffix: "s", trend: "-15%", up: true, icon: <Zap className="text-warning" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.96px] text-ink mb-1">Workspace Overview</h1>
          <p className="text-[14px] text-body">Here's what's happening in your RAG workspace today.</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/chat" className="flex items-center justify-center bg-canvas text-ink border border-hairline h-[40px] px-4 rounded-sm font-medium hover:bg-canvas-soft transition-colors shadow-level-1 text-[14px]">
            New Chat
          </Link>
          <Link to="/dashboard/documents" className="flex items-center justify-center bg-ink text-on-primary h-[40px] px-4 rounded-sm font-medium hover:bg-ink/90 transition-colors shadow-level-2 text-[14px]">
            Upload Document
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-canvas p-6 rounded-md border border-hairline shadow-level-1 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-canvas-soft rounded-bl-full -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 bg-canvas-soft border border-hairline rounded-sm shadow-level-1">{stat.icon}</div>
              <span className={`text-[12px] font-medium px-2 py-1 rounded-sm flex items-center gap-1 ${
                stat.up ? 'text-success bg-success-soft' : 'text-error bg-error-soft'
              }`}>
                {stat.trend} {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </span>
            </div>
            {isLoading ? (
              <div className="h-[32px] w-24 bg-canvas-soft animate-pulse rounded-sm mb-1"></div>
            ) : (
              <h3 className="text-[28px] font-bold text-ink tracking-tight mb-1 relative z-10 flex items-baseline gap-1">
                {stat.isBytes ? formatBytes(stat.value) : stat.isFloat ? stat.value : <AnimatedCounter value={stat.value} />}
                {stat.suffix && <span className="text-[14px] text-mute font-medium">{stat.suffix}</span>}
              </h3>
            )}
            <p className="text-[14px] text-mute relative z-10">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-canvas rounded-md border border-hairline shadow-level-1 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[16px] font-semibold text-ink flex items-center gap-2"><Activity className="w-4 h-4 text-link" /> AI Query Trend</h2>
              <label htmlFor="trendTimeframe" className="sr-only">Trend Timeframe</label>
              <select id="trendTimeframe" name="trendTimeframe" className="text-[12px] border border-hairline rounded-sm px-2 py-1 bg-canvas outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <React.Suspense fallback={<div className="h-full w-full bg-canvas-soft animate-pulse rounded-md"></div>}>
                <AIQueryChart data={aiQueryData} />
              </React.Suspense>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Storage Chart */}
            <div className="bg-canvas rounded-md border border-hairline shadow-level-1 p-6">
              <h2 className="text-[16px] font-semibold text-ink mb-6 flex items-center gap-2"><HardDrive className="w-4 h-4 text-violet" /> Storage Growth</h2>
              <div className="h-[200px] w-full">
                  <React.Suspense fallback={<div className="h-full w-full bg-canvas-soft animate-pulse rounded-md"></div>}>
                    <StorageGrowthChart data={storageData} />
                  </React.Suspense>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-canvas rounded-md border border-hairline shadow-level-1 p-6 flex flex-col">
              <h2 className="text-[16px] font-semibold mb-6 text-ink flex items-center gap-2"><Clock className="w-4 h-4 text-success" /> Recent Uploads</h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-mute" /></div>
                ) : stats?.recentDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-mute">
                    <FileText className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-[14px]">No documents yet</p>
                  </div>
                ) : (
                  stats?.recentDocuments.map((doc: any, i: number) => (
                    <div key={doc.id} className="flex items-center gap-4 p-3 rounded-sm bg-canvas-soft border border-hairline hover:bg-canvas transition-colors shadow-level-1">
                      <div className="w-8 h-8 rounded-full bg-canvas border border-hairline flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-ink" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-ink truncate">{doc.file_name}</p>
                        <p className="text-[12px] text-mute">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel Widgets */}
        <div className="space-y-6">
          <div className="bg-ink rounded-md p-8 relative overflow-hidden shadow-level-4">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/30 to-blue-600/30"></div>
            <div className="absolute top-0 right-0 w-32 h-32 mesh-2 opacity-20 -mr-10 -mt-10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 text-on-primary">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-warning" />
                <h2 className="text-[16px] font-semibold">Pro Limits</h2>
              </div>
              
              <div className="mb-2 flex justify-between text-[14px] font-medium">
                <span>{(Math.min(((stats?.totalStorage || 0) / (1024 * 1024 * 1024)) * 100, 100)).toFixed(1)}% Storage</span>
                <span className="font-mono text-on-primary/70">1 GB Limit</span>
              </div>
              <div className="h-2 w-full bg-on-primary/20 rounded-sm overflow-hidden mb-6">
                <div 
                  className="h-full bg-warning rounded-sm transition-all duration-1000 shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                  style={{ width: `${Math.min(((stats?.totalStorage || 0) / (1024 * 1024 * 1024)) * 100, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-[14px] text-on-primary/80 mb-6 leading-relaxed">Upgrade to Enterprise for unlimited storage, custom models, and priority support.</p>
              <Link to="/dashboard/billing" className="block w-full text-center py-2.5 bg-on-primary text-ink rounded-sm text-[14px] font-bold hover:bg-white transition-colors">
                View Plans
              </Link>
            </div>
          </div>

          <div className="bg-canvas rounded-md border border-hairline shadow-level-1 p-6">
            <h2 className="text-[16px] font-semibold text-ink mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-mute" /> Model Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-ink font-medium">Llama 3.1</span>
                  <span className="text-mute font-mono">65%</span>
                </div>
                <div className="h-1.5 w-full bg-canvas-soft rounded-full overflow-hidden">
                  <div className="h-full bg-link w-[65%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-ink font-medium">Gemini 2.5 Flash</span>
                  <span className="text-mute font-mono">25%</span>
                </div>
                <div className="h-1.5 w-full bg-canvas-soft rounded-full overflow-hidden">
                  <div className="h-full bg-violet w-[25%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="text-ink font-medium">Mistral 7B</span>
                  <span className="text-mute font-mono">10%</span>
                </div>
                <div className="h-1.5 w-full bg-canvas-soft rounded-full overflow-hidden">
                  <div className="h-full bg-warning w-[10%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Overview;
