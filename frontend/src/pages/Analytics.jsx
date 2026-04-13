import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Clock, Globe, Shield, Download } from 'lucide-react';
import api from '../services/api';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [accessLogs, setAccessLogs] = useState([]);
  const [stats, setStats] = useState({
    totalDownloads: 0,
    uniqueVisitors: 0,
    blockedAttempts: 0,
    avgAccessTime: '0s'
  });
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        const data = res.data.data;
        
        // Set the chart data
        setAnalyticsData(data.chartData || []);
        
        // Set the access logs
        setAccessLogs(data.accessLogs || []);
        
        // Set the stats
        setStats({
          totalDownloads: data.totalDownloads || 0,
          uniqueVisitors: data.uniqueVisitors || 0,
          blockedAttempts: data.blockedAttempts || 0,
          avgAccessTime: data.avgAccessTime || '0s'
        });
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
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

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Analytics & Logs</h2>
        <p className="text-sm text-slate-500 mt-1">Detailed breakdown of file access and sharing metrics.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="bg-blue-100 text-blue-600 p-3 rounded-xl mr-4"><Download className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium pb-1">Total Downloads</p><h3 className="text-2xl font-bold text-slate-800">{stats.totalDownloads}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="bg-purple-100 text-purple-600 p-3 rounded-xl mr-4"><Globe className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium pb-1">Unique Visitors</p><h3 className="text-2xl font-bold text-slate-800">{stats.uniqueVisitors}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl mr-4"><Shield className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium pb-1">Blocked Attempts</p><h3 className="text-2xl font-bold text-slate-800">{stats.blockedAttempts}</h3></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center">
          <div className="bg-amber-100 text-amber-600 p-3 rounded-xl mr-4"><Clock className="w-6 h-6" /></div>
          <div><p className="text-sm text-slate-500 font-medium pb-1">Avg. Access Time</p><h3 className="text-2xl font-bold text-slate-800">{stats.avgAccessTime}</h3></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Chart Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2 flex flex-col min-h-[350px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Traffic Over Time</h3>
          <div className="flex-1 w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="uniqueViews" name="Unique Views" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="downloads" name="Downloads" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-0 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Access Logs</h3>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Export CSV</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-slate-100">
              {accessLogs.map((log) => (
                <li key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-sm text-slate-800 truncate pr-2" title={log.file}>{log.file}</p>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{log.time}</span>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="text-xs text-slate-500">
                      <span className="block">IP: {log.ip}</span>
                      <span className="block">Loc: {log.location}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                      log.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;