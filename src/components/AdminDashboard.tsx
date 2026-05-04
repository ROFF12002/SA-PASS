import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import UsersManagement from './UsersManagement';

interface AdminDashboardProps {
  userEmail: string;
  onBack: () => void;
}

interface Stats {
  totalUsers: number;
  activeUsers24h: number;
  totalPasswords: number;
}

export default function AdminDashboard({ userEmail, onBack }: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState<'overview' | 'users'>('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error: rpcError } = await supabase.rpc('get_admin_stats');
      
      if (rpcError) {
        throw rpcError;
      }
      
      if (data) {
        setStats(data as Stats);
      }
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Failed to fetch statistics. Please add the required Supabase RPC functions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Developer Dashboard
            </h1>
          </div>
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button 
              onClick={() => setCurrentTab('overview')} 
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${currentTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setCurrentTab('users')} 
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${currentTab === 'users' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Users
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
        
        {currentTab === 'overview' ? (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                Welcome, Developer
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Overview of your application's usage. Active account: <strong className="text-indigo-500 text-left" dir="ltr">{userEmail}</strong>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-red-600 dark:text-red-400" dir="ltr">
                  {error}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 mt-4 font-medium animate-pulse">Loading statistics...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Total Users Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Registered Users</p>
                      <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                        {stats?.totalUsers || 0}
                      </p>
                    </div>
                  </div>

                  {/* Active Users 24h Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 dark:bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors"></div>
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Users (Last 24h)</p>
                      <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                        {stats?.activeUsers24h || 0}
                      </p>
                    </div>
                  </div>

                  {/* Total Stored Passwords/Links Card */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Saved Items</p>
                      <p className="text-4xl font-bold text-slate-900 dark:text-white mt-2 font-mono">
                        {stats?.totalPasswords || 0}
                      </p>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Security Overview */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">Security Overview</h3>
                    <ul className="space-y-4 text-sm">
                      <li className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-500 dark:text-slate-400">Transport Security</span>
                        <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md">HTTPS Active</span>
                      </li>
                      <li className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800/50">
                        <span className="text-slate-500 dark:text-slate-400">Vault Encryption</span>
                        <span className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-md">AES-GCM 256</span>
                      </li>
                      <li className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Data Backup</span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">Automated by Supabase</span>
                      </li>
                    </ul>
                  </div>

                  {/* Activity Alerts Placeholder */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Recent Activity & Alerts</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Real-time activity tracking is limited to maintain privacy and comply with RLS requirements.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 rounded-xl border border-amber-100 dark:border-amber-500/20">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm">
                          <strong>Note:</strong> Attempting to query `auth.audit_log_entries` for Failed Logins from the client requires Elevated Service Keys, which poses a security risk. It has intentionally been excluded.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <UsersManagement />
        )}

      </main>
    </div>
  );
}