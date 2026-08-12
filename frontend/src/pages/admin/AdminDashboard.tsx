import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { 
  Users, CreditCard, HardDrive, Bot, Activity, ArrowUpRight, ArrowDownRight, 
  FileText, Database, ShieldCheck, Download, AlertCircle, Settings2, BarChart3, LineChart as LineChartIcon
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';

// Mock Data
const revenueData = [
  { name: 'Mon', revenue: 4000, users: 2400 },
  { name: 'Tue', revenue: 3000, users: 1398 },
  { name: 'Wed', revenue: 2000, users: 9800 },
  { name: 'Thu', revenue: 2780, users: 3908 },
  { name: 'Fri', revenue: 1890, users: 4800 },
  { name: 'Sat', revenue: 2390, users: 3800 },
  { name: 'Sun', revenue: 3490, users: 4300 },
];

const aiQueriesData = [
  { time: '00:00', queries: 120, embeddings: 40 },
  { time: '04:00', queries: 80, embeddings: 20 },
  { time: '08:00', queries: 450, embeddings: 120 },
  { time: '12:00', queries: 890, embeddings: 300 },
  { time: '16:00', queries: 620, embeddings: 210 },
  { time: '20:00', queries: 310, embeddings: 90 },
];

const storageData = [
  { month: 'Jan', documents: 120, storageGB: 1.2 },
  { month: 'Feb', documents: 250, storageGB: 2.8 },
  { month: 'Mar', documents: 380, storageGB: 4.1 },
  { month: 'Apr', documents: 520, storageGB: 5.9 },
  { month: 'May', documents: 700, storageGB: 8.2 },
  { month: 'Jun', documents: 950, storageGB: 11.5 },
];

const retentionData = [
  { cohort: 'Week 1', rate: 100 },
  { cohort: 'Week 2', rate: 85 },
  { cohort: 'Week 3', rate: 72 },
  { cohort: 'Week 4', rate: 65 },
  { cohort: 'Week 5', rate: 58 },
  { cohort: 'Week 6', rate: 55 },
];

const AdminDashboard = () => {
  const location = useLocation();
  const path = location.pathname.split('/').pop() || 'analytics';

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [path]);

  const handleExportCSV = () => {
    // Generate simple mock CSV for analytics data
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value,Trend\n"
      + "Total Revenue,42500,+12.5%\n"
      + "Active Users,8245,+5.2%\n"
      + "AI Generations,1200000,+24.8%\n"
      + "Storage Used (GB),11.5,+15.3%\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "platform_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const MetricCard = ({ title, value, change, trend, icon: Icon }: any) => (
    <div className="bg-[#111111] p-6 rounded-md border border-[#222222] shadow-sm relative overflow-hidden group hover:border-[#333333] transition-colors">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Icon className="w-16 h-16 text-indigo-400" /></div>
      <p className="text-[13px] font-medium text-[#888888] mb-2 relative z-10">{title}</p>
      <h3 className="text-[32px] font-semibold text-white tracking-tight relative z-10 mb-2">{value}</h3>
      <div className={`flex items-center gap-1 text-[12px] font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'} relative z-10`}>
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {change} vs last period
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111111] border border-[#333333] p-3 rounded-md shadow-lg text-[12px]">
          <p className="text-[#888888] mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-medium">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="animate-pulse space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[1,2,3,4].map(i => <div key={i} className="h-[140px] bg-[#111111] rounded-md border border-[#222222]"></div>)}
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="h-[350px] bg-[#111111] rounded-md border border-[#222222]"></div>
             <div className="h-[350px] bg-[#111111] rounded-md border border-[#222222]"></div>
           </div>
        </div>
      );
    }

    switch (path) {
      case 'analytics':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-[24px] font-semibold text-white tracking-tight">Platform Analytics</h1>
                <p className="text-[14px] text-[#888888]">Comprehensive metrics for RAG engine usage, revenue, and retention.</p>
              </div>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 h-[36px] bg-[#222222] hover:bg-[#333333] border border-[#333333] rounded-sm text-[13px] text-white transition-colors shadow-sm w-fit">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Total Revenue (MRR)" value="$42,500" change="+12.5%" trend="up" icon={CreditCard} />
              <MetricCard title="Active Users" value="8,245" change="+5.2%" trend="up" icon={Users} />
              <MetricCard title="AI Generations" value="1.2M" change="+24.8%" trend="up" icon={Bot} />
              <MetricCard title="Documents Uploaded" value="14,291" change="+18.1%" trend="up" icon={FileText} />
            </div>

            {/* Row 1: Revenue & AI Queries */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111111] rounded-md border border-[#222222] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-semibold text-white flex items-center gap-2"><CreditCard className="w-4 h-4 text-[#888888]"/> Revenue & Active Users (7D)</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#111111] rounded-md border border-[#222222] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-semibold text-white flex items-center gap-2"><Bot className="w-4 h-4 text-[#888888]"/> Daily AI Queries & Embeddings</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aiQueriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="time" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                      <Line type="monotone" dataKey="queries" name="Chat Queries" stroke="#6366F1" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="embeddings" name="Chunks Embedded" stroke="#EC4899" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row 2: Storage & Retention */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#111111] rounded-md border border-[#222222] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-semibold text-white flex items-center gap-2"><HardDrive className="w-4 h-4 text-[#888888]"/> Documents & Storage Growth</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={storageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="month" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#888' }} />
                      <Bar dataKey="documents" name="Documents" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="storageGB" name="Storage (GB)" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#111111] rounded-md border border-[#222222] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[15px] font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-[#888888]"/> User Retention (Weekly Cohorts)</h3>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={retentionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <defs>
                        <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="cohort" stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#666" tick={{fill: '#888', fontSize: 12}} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="rate" name="Retention Rate" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorRetention)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </motion.div>
        );

      case 'users':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
              <h1 className="text-[24px] font-semibold text-white tracking-tight">Users & Subscriptions</h1>
              <p className="text-[14px] text-[#888888]">Manage registered users, organizations, and active Stripe subscriptions.</p>
            </div>
            
            <div className="bg-[#111111] rounded-md border border-[#222222] overflow-hidden">
              <div className="p-4 border-b border-[#222222] flex items-center justify-between">
                <label htmlFor="admin-user-search" className="sr-only">Search users</label>
                <input id="admin-user-search" name="search" type="text" placeholder="Search by email or customer ID..." className="bg-[#0A0A0A] border border-[#222222] rounded-sm py-1.5 px-3 text-[13px] text-white focus:outline-none focus:border-indigo-500 w-72" />
                <button className="flex items-center gap-2 px-3 py-1.5 bg-[#222222] hover:bg-[#333333] border border-[#333333] rounded-sm text-[12px] text-white transition-colors">
                  <Settings2 className="w-3 h-3" /> Filter
                </button>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0A0A0A] border-b border-[#222222]">
                    <th className="py-3 px-6 text-[11px] font-bold text-[#888888] uppercase tracking-wider">User</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#888888] uppercase tracking-wider">Plan</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#888888] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#888888] uppercase tracking-wider">MRR</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-[#888888] uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {[1,2,3,4,5].map((i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <td className="py-4 px-6">
                        <p className="text-[13px] font-medium text-white">user_{i}@enterprise.com</p>
                        <p className="text-[11px] text-[#888888] font-mono mt-0.5">cus_Stripe{Math.floor(Math.random()*10000)}</p>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-white">Business Tier</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-wider">Active</span>
                      </td>
                      <td className="py-4 px-6 text-[13px] text-[#888888] font-mono">$99.00</td>
                      <td className="py-4 px-6 text-[12px] text-[#888888]">Oct 12, 2026</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        );

      case 'revenue':
      case 'storage':
      case 'ai-usage':
      case 'audit':
      case 'health':
      case 'settings':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-[#222222] rounded-full flex items-center justify-center mb-6">
              <Settings2 className="w-8 h-8 text-[#888888]" />
            </div>
            <h2 className="text-[20px] font-semibold text-white mb-2 tracking-tight">{path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ')} Dashboard</h2>
            <p className="text-[14px] text-[#888888] max-w-md">This administration module is successfully registered in the router. Specific views can be expanded here.</p>
          </motion.div>
        );

      default:
        return <div>Module not found.</div>;
    }
  };

  return (
    <div className="w-full h-full">
      {renderContent()}
    </div>
  );
};

export default AdminDashboard;
