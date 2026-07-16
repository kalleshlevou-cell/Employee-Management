import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end validations
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      // Retrieve the token details via localstorage/context indirectly to check role or let auth provider load it
      // Let's decode or read from LocalStorage or make a quick query to auth status
      // We can fetch `/auth/me` or check returned information. Since we set the user state in auth context, we wait a moment or check
      // For immediate redirection:
      const token = localStorage.getItem('ems_token');
      if (token) {
        // Read decoded role by fetching the me profile
        const me = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => res.json());

        if (me.role === 'Employee') {
          navigate(`/profile/${me._id}`);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-8 space-y-8 transition-colors duration-200">
        
        {/* Banner Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none mb-4">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to manage employees & structures</p>
        </div>

        {/* Action Error Alerts */}
        {error && (
          <div className="flex items-center space-x-2 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl text-rose-800 dark:text-rose-300 text-sm animate-fade-in">
            <AlertTriangle className="flex-shrink-0" size={18} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-shadow text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-shadow text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl font-semibold shadow-md shadow-indigo-200 dark:shadow-none hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 text-sm"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Cheat Sheet */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center space-y-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold mb-2">DEMO ACCOUNTS FOR EVALUATION</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-left text-slate-500 dark:text-slate-400">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block">Super Admin</span>
              <span>admin@ems.com</span>
              <span className="block mt-0.5 font-bold">password123</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block">HR Lead</span>
              <span>sarah@ems.com</span>
              <span className="block mt-0.5 font-bold">password123</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/40 col-span-2">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block text-center">Standard Employee</span>
              <div className="flex justify-between">
                <span>alice@ems.com (Eng Lead)</span>
                <span className="font-bold">password123</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            New here?{' '}
            <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
