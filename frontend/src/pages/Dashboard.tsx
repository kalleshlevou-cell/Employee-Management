import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  UserCheck,
  UserX,
  Briefcase,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';

interface DashboardData {
  summary: {
    total: number;
    active: number;
    inactive: number;
    departmentCount: number;
  };
  departmentBreakdown: { department: string; count: number; avgSalary: number }[];
  roleBreakdown: { role: string; count: number }[];
  salaryRanges: { range: string; count: number }[];
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.get('/employees/dashboard/stats');
        setData(stats);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12 border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-6 rounded-3xl text-center space-y-4 animate-fade-in">
        <AlertTriangle className="mx-auto text-amber-600 dark:text-amber-500" size={40} />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Database Connection Issue</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          We could not reach the server or database. Please make sure:
        </p>
        <ul className="text-xs text-left max-w-xs mx-auto list-disc space-y-1.5 text-slate-500 dark:text-slate-400">
          <li>The Express backend is running.</li>
          <li>Your MongoDB server is running on port 27017 or your MONGODB_URI env variable is set.</li>
          <li>You have seeded the database by running <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">npm run seed</code>.</li>
        </ul>
      </div>
    );
  }

  if (!data) return null;

  const cardItems = [
    {
      title: 'Total Employees',
      value: data.summary.total,
      icon: <Users className="text-indigo-650" size={24} />,
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      border: 'border-indigo-100 dark:border-indigo-900/40',
    },
    {
      title: 'Active Positions',
      value: data.summary.active,
      icon: <UserCheck className="text-emerald-650" size={24} />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      title: 'Inactive / On Leave',
      value: data.summary.inactive,
      icon: <UserX className="text-amber-650" size={24} />,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-100 dark:border-amber-900/40',
    },
    {
      title: 'Active Departments',
      value: data.summary.departmentCount,
      icon: <Briefcase className="text-sky-650" size={24} />,
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      border: 'border-sky-100 dark:border-sky-900/40',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Organization Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Overview of operational units, allocations, and payrolls</p>
      </div>

      {/* Grid Statistics Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cardItems.map((card, idx) => (
          <div
            key={idx}
            className={`bg-white dark:bg-slate-900 border ${card.border} rounded-3xl p-6 flex items-center justify-between shadow-sm transition-all duration-200 hover:shadow-md`}
          >
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">{card.title}</span>
              <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{card.value}</span>
            </div>
            <div className={`p-4 rounded-2xl ${card.bg}`}>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* Row Charts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Department Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[380px]">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 leading-none">Employees per Department</h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="department" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.04)' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Roles Pie Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[380px]">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 leading-none">Role Allocations</h3>
          <div className="flex-1 w-full min-h-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.roleBreakdown}
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="role"
                >
                  {data.roleBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Bands Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[380px] lg:col-span-2">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-4 leading-none flex items-center gap-2">
            <TrendingUp size={16} /> Salary Ranges (USD)
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salaryRanges} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(16, 185, 129, 0.04)' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
