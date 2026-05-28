import React, { useState, useEffect } from 'react';
import Navbar from '@/src/components/Navbar';
import { fetchAnalyticsPayloadClient } from '@/src/utils/visitorTrackerClient';
import { 
  Users, 
  Eye, 
  Fingerprint, 
  Activity, 
  Download, 
  RefreshCw, 
  Laptop, 
  Smartphone, 
  Tablet as TabletIcon, 
  Compass, 
  MapPin, 
  Clock, 
  History,
  FileText,
  MousePointer,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface AnalyticStats {
  summary: {
    totalPageViews: number;
    totalVisitors: number;
    uniqueVisitors: number;
  };
  today: {
    date: string;
    totalPageViews: number;
    totalVisitors: number;
    uniqueVisitors: number;
    devices: {
      Desktop: number;
      Mobile: number;
      Tablet: number;
    };
    browsers: {
      [key: string]: number;
    };
    pageViewsByPath: {
      [key: string]: number;
    };
  };
  recentHistory: {
    date: string;
    totalPageViews: number;
    totalVisitors: number;
    uniqueVisitors: number;
  }[];
  recentEvents: {
    id: string;
    ip: string;
    path: string;
    userAgent: string;
    browser: string;
    device: string;
    visitedAt: string;
    dateKey: string;
    sessionToken: string;
  }[];
  activeLast15Mins: number;
}

export default function VisitorTracker() {
  const [data, setData] = useState<AnalyticStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchAnalyticsPayloadClient();
      setData(payload);
    } catch (err: any) {
      setError(err.message || 'Error occurred while querying tracking database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // Poll for real-time tracking updates every 20 seconds
    const interval = setInterval(fetchAnalytics, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/analytics/export');
      if (!response.ok) throw new Error('Failed to output report');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visitor_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to download CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  // Re-format date strings for line charts
  const chartData = data?.recentHistory.map(day => {
    const parted = day.date.split('-');
    const label = parted.length === 3 ? `${parted[1]}/${parted[2]}` : day.date;
    return {
      name: label,
      views: day.totalPageViews,
      visitors: day.totalVisitors,
      uniques: day.uniqueVisitors,
    };
  }) || [];

  // Sort paths by views
  const pathStats = data?.today?.pageViewsByPath 
    ? Object.entries(data.today.pageViewsByPath)
        .map(([rawPath, count]) => ({ path: rawPath, count: count as number }))
        .sort((a, b) => (b.count as number) - (a.count as number))
    : [];

  const totalPageViewsToday = data?.today?.totalPageViews || 0;
  const deviceStats = data?.today?.devices || { Desktop: 0, Mobile: 0, Tablet: 0 };
  const browserStats = data?.today?.browsers || {};

  // Formatter helper for timestamps
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get device icon
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-emerald-500" />;
      case 'tablet':
        return <TabletIcon className="w-4 h-4 text-orange-500" />;
      default:
        return <Laptop className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Ribbon */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-900/50 mb-2 uppercase tracking-wide">
              <Activity className="w-3 h-3 animate-pulse" /> Live System Monitor
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Website Visitor Tracker
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Zero-configuration tracking, fraud protection, and instant analytics. See who visits and when.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold rounded-xl shadow-sm transition-all text-slate-700 dark:text-slate-200 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
              Sync Now
            </button>
            <button
              onClick={handleExportCSV}
              disabled={exporting || !data}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Analytics'}
            </button>
          </div>
        </div>

        {/* Info Notification banner regarding Spam Protection */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20 border border-blue-100 dark:border-slate-800/80 p-4 rounded-2xl flex gap-3 mb-8 text-sm">
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-slate-200">Session Spam Lock is ACTIVE</h4>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5">
              Refreshes and reload loops from the same browser on identical routes are server-debounced (restricted once every 15s) to guarantee high-integrity, scam-proof visit logs.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
            <h3 className="font-bold">Database Error</h3>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* 1. Main Key Metrics (4 Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Active Users */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/50">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400">Live</span>
            </div>
            <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              Active Visitors (Last 15M)
            </div>
            {loading && !data ? (
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24 mb-1" />
            ) : (
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {data?.activeLast15Mins || 1}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              Real-time connected users auditing
            </p>
          </motion.div>

          {/* Today's Pageviews */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Today's Page Views
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Eye className="w-5 h-5" />
              </div>
            </div>
            {loading && !data ? (
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24 mb-1" />
            ) : (
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {data?.today?.totalPageViews || 0}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              All browser route transitions today
            </p>
          </motion.div>

          {/* Today's Visitors */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Today's Visits / Sessions
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            {loading && !data ? (
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24 mb-1" />
            ) : (
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {data?.today?.totalVisitors || 0}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Total session tokens initiated today
            </p>
          </motion.div>

          {/* Today's Unique IP Visitors */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider">
                Today's Unique IPs
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Fingerprint className="w-5 h-5" />
              </div>
            </div>
            {loading && !data ? (
              <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24 mb-1" />
            ) : (
              <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white">
                {data?.today?.uniqueVisitors || 0}
              </h3>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Unique network IP addresses resolved
            </p>
          </motion.div>

        </div>

        {/* 2. All-time global summary bar */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-950 dark:text-white text-lg">Platform Lifetime Aggregates</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total metrics from first track deployment and audit log archives</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 md:gap-12 text-center md:text-left">
            <div>
              <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Page Views</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {data?.summary?.totalPageViews || 0}
              </div>
            </div>
            <div className="border-l border-slate-100 dark:border-slate-800/80 pl-8">
              <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Sessions</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {data?.summary?.totalVisitors || 0}
              </div>
            </div>
            <div className="border-l border-slate-100 dark:border-slate-800/80 pl-8">
              <div className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase">Unique IPs</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {data?.summary?.uniqueVisitors || 0}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Graph Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Main Traffic Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Daily Traffic Flow</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Historical traffic timeline of the past 7 days</p>
              </div>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl text-xs">
                <button 
                  onClick={() => setActiveTab('today')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${activeTab === 'today' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Views
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Users / Uniques
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[250px] w-full">
              {loading && !data ? (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-800/30 rounded-2xl animate-pulse" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorUniques" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="opacity-20" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                        borderColor: '#1e293b', 
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {activeTab === 'today' ? (
                      <Area type="monotone" name="Page Views" dataKey="views" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                    ) : (
                      <>
                        <Area type="monotone" name="Total Visitors" dataKey="visitors" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitors)" />
                        <Area type="monotone" name="Unique IPs" dataKey="uniques" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorUniques)" />
                      </>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
                  No data to plot yet. Open other core tools to populate statistics!
                </div>
              )}
            </div>
          </div>

          {/* Today's Visited Pages list */}
          <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Page Ingestion</h3>
              <p className="text-xs text-slate-400 text-slate-500">Distribution of today's pageviews across tools</p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto max-h-[280px] pr-1">
              {loading && !data ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12" />
                  </div>
                ))
              ) : pathStats.length > 0 ? (
                pathStats.map((item, index) => {
                  const percent = totalPageViewsToday > 0 ? ((item.count as number) / totalPageViewsToday) * 100 : 0;
                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <span className="truncate flex items-center gap-1.5 text-slate-800 dark:text-slate-250">
                          <MousePointer className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {item.path}
                        </span>
                        <span className="font-bold text-slate-950 dark:text-white text-xs">{item.count} views</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-105 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
                  No active route coordinates caught today.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 4. Audience breakdown: Devices vs Browsers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          
          {/* Device Demographics */}
          <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-500" />
              Device Inflows Today
            </h3>

            <div className="space-y-6">
              {['Desktop', 'Mobile', 'Tablet'].map((dev) => {
                const count = ((deviceStats as any)[dev] as number) || 0;
                const totalDev = (Object.values(deviceStats) as number[]).reduce((acc: number, curr: number) => acc + curr, 0) || 1;
                const percent = (count / totalDev) * 105; // scalar adjustments for visually pleasing fill
                const finalPercent = Math.min(100, Math.round((count / totalDev) * 100));

                const getIcon = (d: string) => {
                  if (d === 'Desktop') return <Laptop className="w-5 h-5 text-blue-500" />;
                  if (d === 'Mobile') return <Smartphone className="w-5 h-5 text-emerald-500" />;
                  return <TabletIcon className="w-5 h-5 text-orange-500" />;
                };

                return (
                  <div key={dev} className="flex items-center gap-4">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl shrink-0">
                      {getIcon(dev)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-sm font-semibold text-slate-800 dark:text-slate-200">
                        <span>{dev}</span>
                        <span>{count} ({finalPercent}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className={`h-full rounded-full ${dev === 'Desktop' ? 'bg-blue-500' : dev === 'Mobile' ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          style={{ width: `${finalPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Browser Demographics */}
          <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Compass className="w-5 h-5 text-green-500" />
              Browser Demographics
            </h3>

            <div className="space-y-4 overflow-y-auto max-h-[220px] pr-1">
              {Object.keys(browserStats).length > 0 ? (
                Object.entries(browserStats).map(([browser, count]) => {
                  const total = (Object.values(browserStats) as number[]).reduce((acc: number, curr: number) => acc + curr, 0) || 1;
                  const finalPercent = Math.round(((count as number) / total) * 100);

                  return (
                    <div key={browser} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="capitalize">{browser}</span>
                        <span>{count} ({finalPercent}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${finalPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-8">
                  Waiting for browser records.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 5. Live Auditing Logs Table */}
        <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Live Network Visitor Logs
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Exhaustive real-time hit telemetry records</p>
            </div>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl self-start">
              Showing last 20 events
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left whitespace-nowrap text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">IP Address</th>
                  <th className="px-6 py-4">Requested Coordinate</th>
                  <th className="px-6 py-4">Device</th>
                  <th className="px-6 py-4">Browser</th>
                  <th className="px-6 py-4">Visit Date / Time</th>
                  <th className="px-6 py-4">Session Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-102 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
                {loading && !data ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" /></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" /></td>
                    </tr>
                  ))
                ) : data?.recentEvents && data.recentEvents.length > 0 ? (
                  data.recentEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-indigo-600 dark:text-indigo-400 text-xs">
                        {ev.ip}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        {ev.path}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {getDeviceIcon(ev.device)}
                          {ev.device}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{ev.browser}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(ev.visitedAt)} at {formatTime(ev.visitedAt)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                        {ev.sessionToken}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-semibold">
                      Audit log records empty. Start clicking other tabs on the top navbar to generate live tracked telemetry events!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
