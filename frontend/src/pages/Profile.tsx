import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Phone,
  Mail,
  Shield,
  Layers,
  DollarSign,
  Calendar,
  AlertTriangle,
  Upload,
  Users,
  CheckCircle,
} from 'lucide-react';

interface DirectReportee {
  _id: string;
  name: string;
  employeeId: string;
  designation: string;
  department: string;
  profileImage: string;
}

interface ProfileType {
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
    email: string;
  } | null;
  profileImage?: string;
}

export const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [reportees, setReportees] = useState<DirectReportee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form edit states
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>('');
  
  const [success, setSuccess] = useState<boolean>(false);
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const isSelf = currentUser?._id === id;

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/employees/${id}`);
      setProfile(data);
      setPhone(data.phone || '');
      setProfileImage(data.profileImage || '');

      // Load direct reports
      const reports = await api.get(`/employees/${id}/reportees`);
      setReportees(reports);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
    setSuccess(false);
    setEditError(null);
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    setEditError(null);
    setEditLoading(true);

    try {
      const payload: any = { phone, profileImage };
      if (password) {
        payload.password = password;
      }

      await api.put(`/employees/${id}`, payload);
      setSuccess(true);
      setPassword('');
      
      // refresh cached auth profile if user just edited their own details
      if (isSelf) {
        fetchProfile();
      }
      
      // reload local panel
      const updated = await api.get(`/employees/${id}`);
      setProfile(updated);
    } catch (err: any) {
      setEditError(err.message || 'Could not update data.');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto mt-12 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-955/20 p-6 rounded-3xl text-center space-y-4 animate-fade-in">
        <AlertTriangle className="mx-auto text-rose-600" size={36} />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Access Restricted</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'Profile could not be found'}</p>
        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-indigo-650 text-white rounded-xl text-xs font-bold shadow-sm">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Employee Profile</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Personal metadata and reporting parameters</p>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Card details */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-6">
            {/* profile size */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 flex flex-shrink-0 items-center justify-center font-extrabold text-indigo-700 dark:text-indigo-400 text-3xl shadow-inner border border-slate-100 dark:border-slate-800">
              {profileImage ? (
                <img src={profileImage} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.split(' ').map((n) => n[0]).join('').toUpperCase()
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-909 dark:text-white leading-tight">{profile.name}</h3>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold">{profile.designation}</p>
                <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 border border-slate-100 dark:border-slate-850">
                    ID: {profile.employeeId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-500 border border-slate-100 dark:border-slate-855">
                    Team: {profile.department}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-[10px] font-bold text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                    Access Level: {profile.role}
                  </span>
                </div>
              </div>

              {/* Readonly Grid Details */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-850 pt-4 text-xs">
                <div className="flex items-center space-x-2 text-slate-555 dark:text-slate-400">
                  <Mail size={16} className="text-slate-450 dark:text-slate-500" />
                  <span className="font-semibold">{profile.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-555 dark:text-slate-400">
                  <DollarSign size={16} className="text-slate-450 dark:text-slate-500" />
                  <span className="font-semibold">${profile.salary.toLocaleString()} / year</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-555 dark:text-slate-400">
                  <Calendar size={16} className="text-slate-450 dark:text-slate-500" />
                  <span className="font-semibold">Joined {new Date(profile.joiningDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-555 dark:text-slate-400">
                  <Shield size={16} className="text-slate-450 dark:text-slate-500" />
                  <span className="font-semibold">Status: {profile.status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Reports Display */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-855 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-850">
              <Users size={18} />
              <h3 className="font-bold text-sm">Direct Reports ({reportees.length})</h3>
            </div>
            
            {reportees.length === 0 ? (
              <p className="text-xs text-slate-450 dark:text-slate-655 italic">This employee currently has no direct reporting staffers.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportees.map((rep) => (
                  <div
                    key={rep._id}
                    onClick={() => navigate(`/profile/${rep._id}`)}
                    className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-950/20 cursor-pointer transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-indigo-50 dark:bg-indigo-905 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 text-xs flex-shrink-0">
                      {rep.profileImage ? (
                        <img src={rep.profileImage} alt={rep.name} className="w-full h-full object-cover" />
                      ) : (
                        rep.name.split(' ').map((n) => n[0]).join('').toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{rep.name}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-slate-505 truncate">{rep.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Edit Actions (restricted to self) or Manager info */}
        <div className="space-y-8">
          
          {/* Manager Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-855 dark:text-slate-200 text-sm pb-2 border-b border-slate-100 dark:border-slate-850 flex items-center gap-2">
              <Layers size={16} /> Direct Manager
            </h3>
            {profile.reportingManager ? (
              <div
                onClick={() => navigate(`/profile/${profile.reportingManager?._id}`)}
                className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-950/20 rounded-2xl"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-55/20 dark:bg-indigo-900/20 flex flex-shrink-0 items-center justify-center font-bold text-indigo-700 dark:text-indigo-455 text-xs">
                  {profile.reportingManager.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">{profile.reportingManager.name}</h4>
                  <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold block mt-0.5">{profile.reportingManager.employeeId}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-550 block">{profile.reportingManager.email}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-indigo-700 dark:text-indigo-400 font-bold italic bg-indigo-50/20 dark:bg-indigo-950/20 p-3 rounded-2xl">
                Organizational Root CEO (Unmanaged)
              </p>
            )}
          </div>

          {/* Form edit fields (Available to self only) */}
          {isSelf && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-855 dark:text-slate-200 text-sm pb-2 border-b border-slate-100 dark:border-slate-850">
                Update Demographics
              </h3>

              {success && (
                <div className="flex items-center space-x-2 border border-emerald-250 bg-emerald-50 dark:bg-emerald-955/20 p-3 rounded-2xl text-emerald-800 dark:text-emerald-350 text-xs animate-fade-in">
                  <CheckCircle size={16} />
                  <span className="font-semibold">Profile updated successfully!</span>
                </div>
              )}

              {editError && (
                <div className="flex items-center space-x-2 border border-rose-250 bg-rose-50 dark:bg-rose-955/20 p-3 rounded-2xl text-rose-800 dark:text-rose-455 text-xs animate-fade-in">
                  <AlertTriangle size={16} />
                  <span className="font-semibold">{editError}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Phone / Contact</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone size={14} />
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1-555-0999"
                      className="w-full pl-9 pr-3 py-2 border border-slate-205 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Upload profile Image</label>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center justify-center space-x-1.5 px-3 py-2 border border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-350 rounded-2xl font-bold cursor-pointer transition-colors text-[10px] w-full">
                      <Upload size={12} />
                      <span>Select Avatar</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {profileImage && (
                      <button
                        type="button"
                        onClick={() => setProfileImage('')}
                        className="text-[10px] text-rose-600 font-semibold px-2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Change Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (Leave blank to keep current)"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent text-slate-800 dark:text-slate-200 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={editLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl font-bold transition-all text-xs shadow-md shadow-indigo-150 dark:shadow-none"
                >
                  {editLoading ? 'Saving...' : 'Update Settings'}
                </button>

              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
