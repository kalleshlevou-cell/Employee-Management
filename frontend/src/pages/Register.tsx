import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

const DEPARTMENTS = [
  'Executive',
  'Engineering',
  'Human Resources',
  'Sales',
  'Marketing',
  'Finance',
  'Legal',
];

export const Register: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: '',
    designation: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) return setError('Full name is required.');
    if (!form.email.trim()) return setError('Email address is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!form.department) return setError('Please select a department.');
    if (!form.designation.trim()) return setError('Designation is required.');

    setLoading(true);
    try {
      // Register the account
      const data = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        department: form.department,
        designation: form.designation,
      });

      // Store token and set user in auth context
      localStorage.setItem('ems_token', data.token);
      await login(form.email, form.password);

      // Registered accounts are always Employee role
      navigate(`/profile/${data._id}`);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 transition-shadow text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-10 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 space-y-7">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 dark:shadow-none mb-4">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create Account</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Register as an Employee</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center space-x-2 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl text-rose-800 dark:text-rose-300 text-sm animate-fade-in">
            <AlertTriangle className="flex-shrink-0" size={18} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Full Name *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><User size={16} /></span>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Jane Smith"
                className={inputClass}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Mail size={16} /></span>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone (optional)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Phone size={16} /></span>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1-555-0199"
                className={inputClass}
              />
            </div>
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Department *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Briefcase size={16} /></span>
              <select
                name="department"
                required
                value={form.department}
                onChange={handleChange}
                className={`${inputClass} appearance-none`}
              >
                <option value="" className="dark:bg-slate-900">Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="dark:bg-slate-900">{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Designation / Title *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><CheckCircle size={16} /></span>
              <input
                type="text"
                name="designation"
                required
                value={form.designation}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                className={inputClass}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Password *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Lock size={16} /></span>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Min. 6 characters"
                className={inputClass}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confirm Password *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><Lock size={16} /></span>
              <input
                type="password"
                name="confirmPassword"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                className={inputClass}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-md shadow-indigo-200 dark:shadow-none hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-50 text-sm mt-2"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Link to login */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};
