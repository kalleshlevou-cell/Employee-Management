import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Network,
  FileSpreadsheet,
  User,
  LogOut,
  Sun,
  Moon,
  Shield,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const menuItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: <LayoutDashboard size={20} />,
      roles: ['Super Admin', 'HR Manager'],
    },
    {
      path: '/employees',
      name: 'Employees',
      icon: <Users size={20} />,
      roles: ['Super Admin', 'HR Manager'],
    },
    {
      path: '/hierarchy',
      name: 'Org Tree',
      icon: <Network size={20} />,
      roles: ['Super Admin', 'HR Manager', 'Employee'], // Let all roles see tree (employees view reports tree)
    },
    {
      path: '/csv-import',
      name: 'CSV Import',
      icon: <FileSpreadsheet size={20} />,
      roles: ['Super Admin', 'HR Manager'],
    },
    {
      path: `/profile/${user._id}`,
      name: 'My Profile',
      icon: <User size={20} />,
      roles: ['Super Admin', 'HR Manager', 'Employee'],
    },
  ];

  const filteredMenu = menuItems.filter((item) => hasRole(item.roles as any));

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen fixed left-0 top-0 transition-colors duration-200 z-10">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight">EMS Terminal</h1>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Control Dashboard</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-200'
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile Details & Settings */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {/* Active User Card */}
        <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 text-sm">
            {user.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.name}</h4>
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold block">{user.role}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between px-2">
          {/* Dark Mode Switcher */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-850 dark:hover:text-slate-200 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1.5 p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold text-xs transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
