import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  UserPlus,
  AlertTriangle,
  Upload,
} from 'lucide-react';

interface EmployeeType {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: string;
  status: 'Active' | 'Inactive';
  role: 'Super Admin' | 'HR Manager' | 'Employee';
  reportingManager?: {
    _id: string;
    name: string;
    employeeId: string;
    designation: string;
  } | null;
  profileImage?: string;
}

export const Employees: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [employees, setEmployees] = useState<EmployeeType[]>([]);
  const [managerList, setManagerList] = useState<{ _id: string; name: string; employeeId: string; role: string }[]>([]);
  
  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalEmployees, setTotalEmployees] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [currentEmpId, setCurrentEmpId] = useState<string | null>(null);

  // Create/Edit Form Value state
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    salary: 0,
    joiningDate: '',
    status: 'Active' as 'Active' | 'Inactive',
    role: 'Employee' as 'Super Admin' | 'HR Manager' | 'Employee',
    reportingManager: '',
    profileImage: '',
    password: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Load employee directory
  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        department,
        role,
        status,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: '6', // compact count for nice UI
      });
      const data = await api.get(`/employees?${params.toString()}`);
      setEmployees(data.employees);
      setTotalPages(data.totalPages);
      setTotalEmployees(data.totalEmployees);
    } catch (err: any) {
      setError(err.message || 'Failed to search employee list.');
    } finally {
      setLoading(false);
    }
  };

  // Load possible manager list to populate dropdown selectors
  const loadManagerCandidates = async () => {
    try {
      const data = await api.get('/employees?limit=250');
      // Set list excluding the employee itself (handled on edit submit as well)
      setManagerList(data.employees);
    } catch (err) {
      console.warn('Failed to load manager list candidates', err);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search, department, role, status, sortBy, sortOrder, page]);

  useEffect(() => {
    loadManagerCandidates();
  }, [isModalOpen]);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'salary' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImage: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setFormError(null);
    setFormData({
      employeeId: '',
      name: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      salary: 0,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      role: 'Employee',
      reportingManager: '',
      profileImage: '',
      password: '',
    });
    setModalType('create');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: EmployeeType) => {
    setFormError(null);
    setCurrentEmpId(emp._id);
    setFormData({
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      phone: emp.phone || '',
      department: emp.department,
      designation: emp.designation,
      salary: emp.salary,
      joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
      status: emp.status,
      role: emp.role,
      reportingManager: emp.reportingManager?._id || '',
      profileImage: emp.profileImage || '',
      password: '', // clear password by default
    });
    setModalType('edit');
    setIsModalOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Front-end validations
    if (!formData.employeeId.trim()) return setFormError('Employee ID is required.');
    if (!formData.name.trim()) return setFormError('Name is required.');
    if (!formData.email.trim()) return setFormError('Email is required.');
    if (!formData.department.trim()) return setFormError('Department is required.');
    if (!formData.designation.trim()) return setFormError('Designation is required.');
    if (formData.salary < 0) return setFormError('Salary cannot be negative.');

    if (modalType === 'create' && !formData.password) {
      return setFormError('Password is required for creating a new employee.');
    }

    setActionLoading(true);
    try {
      if (modalType === 'create') {
        await api.post('/employees', formData);
      } else {
        await api.put(`/employees/${currentEmpId}`, formData);
      }
      setIsModalOpen(false);
      loadEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed. Verify inputs.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee (soft-delete)? This will re-link direct reportees to the parent manager level.')) {
      return;
    }
    try {
      await api.delete(`/employees/${id}`);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee profile.');
    }
  };

  const departmentsList = [
    'Executive',
    'Engineering',
    'Human Resources',
    'Sales',
    'Marketing',
    'Finance',
    'Legal',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Employee Directory</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total staff profiles active: {totalEmployees}</p>
        </div>

        {currentUser?.role !== 'Employee' && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center space-x-2 px-5 py-3 bg-indigo-650 hover:bg-indigo-750 text-white rounded-2xl font-bold shadow-md shadow-indigo-150 dark:shadow-none transition-all text-sm self-start md:self-auto"
          >
            <Plus size={18} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center space-x-2 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-955/20 p-4 rounded-2xl text-rose-805 dark:text-rose-300 text-xs animate-fade-in">
          <AlertTriangle className="flex-shrink-0" size={16} />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* search bar */}
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 self-center" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 md:flex items-center gap-3">
            {/* dept selector */}
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-750 dark:text-slate-250 text-xs focus:ring-indigo-500 font-medium"
            >
              <option value="" className="dark:bg-slate-900">All Departments</option>
              {departmentsList.map((d) => (
                <option key={d} value={d} className="dark:bg-slate-900">{d}</option>
              ))}
            </select>

            {/* role selector */}
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-750 dark:text-slate-250 text-xs focus:ring-indigo-500 font-medium"
            >
              <option value="" className="dark:bg-slate-900">All Roles</option>
              <option value="Super Admin" className="dark:bg-slate-900">Super Admin</option>
              <option value="HR Manager" className="dark:bg-slate-900">HR Manager</option>
              <option value="Employee" className="dark:bg-slate-900">Employee</option>
            </select>

            {/* status selector */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-750 dark:text-slate-250 text-xs focus:ring-indigo-500 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            {/* sort toggler */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-750 dark:text-slate-250 text-xs focus:ring-indigo-500 font-medium col-span-2 md:col-span-auto"
            >
              <option value="name-asc">Sort Name (A-Z)</option>
              <option value="name-desc">Sort Name (Z-A)</option>
              <option value="joiningDate-desc">Sort Joining Date (New-Old)</option>
              <option value="joiningDate-asc">Sort Joining Date (Old-New)</option>
              <option value="salary-desc">Sort Salary (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
          <Filter className="mx-auto text-slate-350 dark:text-slate-600" size={48} />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No employee records match the search</h3>
          <p className="text-xs text-slate-450 dark:text-slate-500">Refine query terms, status codes or role settings</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/25">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Contacts</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Department & Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Salary</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Status</th>
                  {currentUser?.role !== 'Employee' && (
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-indigo-650 dark:text-indigo-400">{emp.employeeId}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 text-sm">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt={emp.name} className="w-full h-full object-cover" />
                          ) : (
                            emp.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{emp.name}</h4>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{emp.designation}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs space-y-0.5">
                        <span className="text-slate-655 dark:text-slate-300 font-medium">{emp.email}</span>
                        <span className="text-slate-400 dark:text-slate-500">{emp.phone || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs space-y-0.5">
                        <span className="font-semibold text-slate-750 dark:text-slate-250">{emp.department}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{emp.role}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-750 dark:text-slate-250">
                      ${emp.salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {emp.reportingManager ? (
                        <div className="flex flex-col text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-350">{emp.reportingManager.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-550">{emp.reportingManager.designation}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 dark:text-slate-600 italic">None (CEO)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          emp.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450'
                        }`}
                      >
                        {emp.status === 'Active' ? <UserCheck size={12} /> : <UserX size={12} />}
                        <span>{emp.status}</span>
                      </span>
                    </td>
                    {currentUser?.role !== 'Employee' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(emp)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-405 rounded-lg transition-colors"
                            title="Edit Employee"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          {currentUser?.role === 'Super Admin' && (
                            <button
                              onClick={() => handleDelete(emp._id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 rounded-lg transition-colors"
                              title="Delete (Soft-delete)"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing {employees.length} of {totalEmployees} items
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-655 dark:text-slate-350 px-2">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Creation/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in p-8 space-y-6">
            
            {/* Modal Title Banner */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
              <div className="flex items-center space-x-3 text-indigo-650 dark:text-indigo-400">
                <UserPlus size={24} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {modalType === 'create' ? 'Create Employee Profile' : 'Edit Employee Profile'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* validation form warnings */}
            {formError && (
              <div className="flex items-center space-x-2 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl text-rose-800 dark:text-rose-300 text-xs animate-fade-in">
                <AlertTriangle className="flex-shrink-0" size={16} />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            {/* Input Data Forms */}
            <form onSubmit={submitForm} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Employee ID <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="employeeId"
                  required
                  disabled={modalType === 'edit'} // No editing of ID
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  placeholder="e.g. EMP-024"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Marcus Aurelius"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. marcus@company.com"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Phone / Mobile</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +1-555-0199"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Department <span className="text-rose-500">*</span></label>
                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="" className="dark:bg-slate-900">Select Department</option>
                  {departmentsList.map((d) => (
                    <option key={d} value={d} className="dark:bg-slate-900">{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Designation / Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  name="designation"
                  required
                  value={formData.designation}
                  onChange={handleInputChange}
                  placeholder="e.g. Frontend Specialist"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Annual Salary (USD) <span className="text-rose-500">*</span></label>
                <input
                  type="number"
                  name="salary"
                  required
                  min={0}
                  value={formData.salary}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Joining Date <span className="text-rose-500">*</span></label>
                <input
                  type="date"
                  name="joiningDate"
                  required
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Role Access Tier <span className="text-rose-500">*</span></label>
                <select
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  {/* HR Managers cannot assign/modify Super Admin */}
                  {currentUser?.role === 'Super Admin' && (
                    <option value="Super Admin" className="dark:bg-slate-900">Super Admin</option>
                  )}
                  <option value="HR Manager" className="dark:bg-slate-900">HR Manager</option>
                  <option value="Employee" className="dark:bg-slate-900">Employee (Staff)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">Reporting Manager</label>
                <select
                  name="reportingManager"
                  value={formData.reportingManager}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="">None (Top executive / CEO)</option>
                  {managerList
                    .filter((m) => m._id !== currentEmpId) // remove self
                    .map((m) => (
                      <option key={m._id} value={m._id} className="dark:bg-slate-900">
                        {m.name} ({m.employeeId} - {m.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  {modalType === 'create' ? 'System Password *' : 'Update Password (Optional)'}
                </label>
                <input
                  type="password"
                  name="password"
                  required={modalType === 'create'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={modalType === 'create' ? 'System sign-in pass' : '•••••••• (unchanged if blank)'}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Profile image handler */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block tracking-wider">Profile Image / Avatar</label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="profile preview" className="w-full h-full object-cover" />
                    ) : (
                      'Avatar'
                    )}
                  </div>
                  <label className="flex items-center justify-center space-x-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 rounded-2xl font-bold cursor-pointer transition-colors text-xs">
                    <Upload size={14} />
                    <span>Upload image file</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>
                  {formData.profileImage && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, profileImage: '' }))}
                      className="text-xs text-rose-600 hover:font-bold transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="md:col-span-2 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-slate-655 dark:text-slate-350 text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-750 text-white rounded-2xl font-bold shadow-md shadow-indigo-150 dark:shadow-none transition-colors text-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Employee'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
