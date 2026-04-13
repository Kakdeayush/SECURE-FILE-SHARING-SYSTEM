import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Globe, Shield, Download } from 'lucide-react';
import { analyticsAPI } from '../services/api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await analyticsAPI.get();
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center">
          <Activity className="h-10 w-10 text-indigo-400 mb-4 animate-[spin_3s_linear_infinite]" />
          <p className="text-slate-500 font-medium">Gathering insights...</p>
        </div>
      </div>
    );
  }

  const topCards = [
    { label: 'Total Downloads', value: data?.totalDownloads ?? 0, icon: Download, color: 'blue' },
    { label: 'Unique Visitors', value: data?.uniqueVisitors ?? 0, icon: Globe, color: 'purple' },
    { label: 'Blocked Attempts', value: data?.blockedAttempts ?? 0, icon: Shield, color: 'emerald' },
  ];

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Analytics & Logs</h2>
        <p className="text-sm text-slate-500 mt-1">Detailed breakdown of file access and sharing metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topCards.map((card, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
            <div className={`p-3 rounded-xl mr-4 ${
              card.color === 'blue' ? 'bg-blue-100 text-blue-600' :
              card.color === 'purple' ? 'bg-purple-100 text-purple-600' :
              'bg-emerald-100 text-emerald-600'
            }`}><card.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-slate-500 font-medium pb-1">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{Number(card.value).toLocaleString()}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2 flex flex-col min-h-[350px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Traffic Over Time</h3>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="uniqueViews" name="Unique Views" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="downloads" name="Downloads" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-0 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Access Logs</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {(data?.recentLogs || []).length === 0 ? (
                <li className="p-6 text-center text-slate-400 text-sm">No logs yet.</li>
              ) : (
                (data?.recentLogs || []).map((log) => (
                  <li key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-sm text-slate-800 truncate pr-2" title={log.file}>{log.file}</p>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{log.time}</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <div className="text-xs text-slate-500">
                        <span className="block">IP: {log.ip}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                        log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>{log.status}</span>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
