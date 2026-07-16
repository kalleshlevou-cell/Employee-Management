import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ChevronDown,
  ChevronRight,
  Users,
  Network,
  AlertTriangle,
} from 'lucide-react';

interface TreeItem {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  role: string;
  profileImage: string;
  status: string;
  children: TreeItem[];
}

export const OrgTree: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [treeData, setTreeData] = useState<TreeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/organization/tree');
      setTreeData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to construct reporting tree.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-6 rounded-3xl text-center space-y-4 animate-fade-in">
        <AlertTriangle className="mx-auto text-rose-600" size={36} />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Hierarchy Error</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        <button onClick={fetchTree} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Network className="text-indigo-650" size={24} /> Reporting Structure
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Interactive manager hierarchy maps showing lines of operations</p>
        </div>
      </div>

      {treeData.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
          <Users className="mx-auto text-slate-350 dark:text-slate-655" size={48} />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Hierarchy map is empty</h3>
          <p className="text-xs text-slate-450 dark:text-slate-550">Create employee profiles with manager assignments to design curves</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm overflow-x-auto min-w-0">
          <div className="max-w-2xl">
            {treeData.map((node) => (
              <TreeNode key={node.id} node={node} currentUserId={currentUser?._id || ''} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Recursive Tree Node Component
const TreeNode: React.FC<{ node: TreeItem; currentUserId: string }> = ({ node, currentUserId }) => {
  const [expanded, setExpanded] = useState<boolean>(true);
  const hasChildren = node.children && node.children.length > 0;
  const isSelf = node.id === currentUserId;

  return (
    <div className="relative pl-6 select-none mt-2 transition-all">
      {/* Node Connection Lines */}
      <div className="absolute left-2.5 top-0 bottom-0 border-l border-slate-200 dark:border-slate-850"></div>
      
      {/* Current item container */}
      <div className="flex items-start space-x-2 pb-2">
        {/* Connection anchor */}
        <div className="absolute left-[3px] top-6 w-[14px] border-t border-slate-200 dark:border-slate-850"></div>

        {/* Expand / Collapse Control */}
        <div className="z-10 mt-3 flex-shrink-0">
          {hasChildren ? (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-555 dark:text-slate-400 transition-colors"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            </div>
          )}
        </div>

        {/* Card Component */}
        <div
          className={`flex-1 flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-sm max-w-lg transition-all duration-200 ${
            isSelf
              ? 'ring-2 ring-indigo-600 dark:ring-indigo-500 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-indigo-950/10'
              : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            {/* profile img */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-indigo-55/10 dark:bg-indigo-900/20 flex flex-shrink-0 items-center justify-center font-bold text-indigo-700 dark:text-indigo-400 text-xs">
              {node.profileImage ? (
                <img src={node.profileImage} alt={node.name} className="w-full h-full object-cover" />
              ) : (
                node.name.split(' ').map((n) => n[0]).join('').toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{node.name}</h4>
                {isSelf && (
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-755 dark:text-indigo-400 font-extrabold text-[9px] px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{node.designation} • <span className="text-[10px] text-slate-400 dark:text-slate-500">{node.department}</span></p>
            </div>
          </div>

          <div className="mt-2 md:mt-0 flex items-center space-x-2 text-right">
            <div className="flex flex-col text-[10px] font-medium">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold block">{node.role}</span>
              <span
                className={`font-semibold ${
                  node.status === 'Active' ? 'text-emerald-650 dark:text-emerald-500' : 'text-slate-400 dark:text-slate-550'
                }`}
              >
                {node.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recurse Children */}
      {hasChildren && expanded && (
        <div className="animate-fade-in">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
};
