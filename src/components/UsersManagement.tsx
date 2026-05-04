import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('get_all_users');
      if (rpcError) throw rpcError;
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;
    try {
      const { error: rpcError } = await supabase.rpc('admin_delete_user', { target_user_id: id });
      if (rpcError) throw rpcError;
      setUsers(users.filter(u => u.id !== id));
    } catch (err: any) {
      alert('Error deleting user: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-6 py-1">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {error && <div className="p-4 text-red-500 text-sm bg-red-50 dark:bg-red-500/10">{error}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <th className="p-4 bg-slate-50 dark:bg-slate-800/50">Email</th>
              <th className="p-4 hidden sm:table-cell bg-slate-50 dark:bg-slate-800/50">Joined</th>
              <th className="p-4 hidden sm:table-cell bg-slate-50 dark:bg-slate-800/50">Last Login</th>
              <th className="p-4 text-right bg-slate-50 dark:bg-slate-800/50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 border-b border-slate-100 dark:border-slate-800/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="p-4 text-sm font-medium text-slate-900 dark:text-white" dir="ltr">{user.email}</td>
                <td className="p-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-sm text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(user.id, user.email)} 
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">
                  No users found or could not load users.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}