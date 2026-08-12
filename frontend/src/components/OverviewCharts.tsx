import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const AIQueryChart = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
        <Tooltip 
          contentStyle={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', borderRadius: '6px', fontSize: '14px' }}
          itemStyle={{ color: 'var(--ink)' }}
        />
        <Area type="monotone" dataKey="queries" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorQueries)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const StorageGrowthChart = ({ data }: { data: any[] }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.1} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'var(--canvas)', borderColor: 'var(--hairline)', borderRadius: '6px' }} />
        <Bar dataKey="gb" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
