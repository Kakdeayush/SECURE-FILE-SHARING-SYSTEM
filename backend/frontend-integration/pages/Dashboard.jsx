import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Folder, Download, Link as LinkIcon, Activity } from 'lucide-react';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalFiles: 0, totalDownloads: 0, activeLinks: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getActivity(),
        ]);
        setStats(statsRes.data.data);
        setRecentActivity(activityRes.data.data || []);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: 'Total Files', value: stats.totalFiles, icon: Folder, color: 'indigo' },
    { title: 'Total Downloads', value: stats.totalDownloads, icon: Download, color: 'emerald' },
    { title: 'Active Links', value: stats.activeLinks, icon: LinkIcon, color: 'amber' },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="h-10 w-10 text-indigo-400 mb-4 animate-spin" />
          <p className="text-slate-500">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl inline-flex w-fit mb-4 ${
              stat.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' :
              stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <h4 className="text-slate-500 text-sm font-medium">{stat.title}</h4>
            <div className="text-3xl font-bold text-slate-800 mt-1">{Number(stat.value).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Chart — uses analytics chart data if available, else shows empty state */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2 flex flex-col min-h-[350px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Download Trends</h3>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="downloads" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorDownloads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {recentActivity.length === 0 ? (
              <p className="text-slate-400 text-sm text-center mt-8">No activity yet.</p>
            ) : (
              <div className="relative border-l border-slate-200 ml-4 space-y-8 pb-4">
                {recentActivity.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <span className="absolute -left-3.5 top-0.5 rounded-full p-1.5 ring-4 ring-white bg-indigo-100 text-indigo-500">
                      <Download className="w-4 h-4" />
                    </span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800">{log.action}</span>
                      <span className="text-sm text-slate-600 truncate mr-2" title={log.file}>{log.file}</span>
                      <span className="text-xs text-slate-400 mt-1">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
