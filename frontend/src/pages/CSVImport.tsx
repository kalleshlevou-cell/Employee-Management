import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileDown,
} from 'lucide-react';

export const CSVImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    recordsCreated: number;
    managerLinksConnected: number;
    errors?: string[];
  } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please upload a valid CSV file.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else if (selectedFile) {
      setError('Please select a valid CSV file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Use apiRequest directly for form data upload
      const data = await apiRequest('/employees/csv-import', {
        method: 'POST',
        body: formData,
      });

      setResult(data);
      setFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to complete CSV import.');
    } finally {
      setLoading(false);
    }
  };

  // CSV template string for mockup download
  const handleDownloadTemplate = () => {
    const headers = 'employeeId,name,email,phone,department,designation,salary,joiningDate,status,role,reportingManagerId\n';
    const row1 = 'EMP-050,Alex Mercer,alex@ems.com,+1-555-5020,Engineering,Software Engineer II,102000,2024-04-10,Active,Employee,EMP-004\n';
    const row2 = 'EMP-051,Diana Prince,diana@ems.com,+1-555-5021,Marketing,Marketing Lead,94000,2024-05-15,Active,Employee,EMP-001\n';
    const blob = new Blob([headers + row1 + row2], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employee_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="text-indigo-650" size={24} /> Batch CSV Import
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Mass upload system profiles and reporting tree relations</p>
      </div>

      {/* Main Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Container Box */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                  file
                    ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/10'
                    : 'border-slate-300 dark:border-slate-800 hover:border-slate-450 dark:hover:border-slate-650'
                }`}
              >
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" id="csv-file-input" />
                <label htmlFor="csv-file-input" className="cursor-pointer space-y-4 block">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <UploadCloud size={24} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-250">
                      {file ? file.name : 'Drag & drop your CSV file here'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Or click to browse from files'}
                    </p>
                  </div>
                </label>
              </div>

              {/* Upload trigger button */}
              {file && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-2xl font-bold transition-colors text-sm shadow-md shadow-indigo-150 dark:shadow-none"
                >
                  {loading ? 'Uploading and Processing batch...' : 'Execute CSV Import'}
                </button>
              )}
            </form>

            {/* Error notifications */}
            {error && (
              <div className="flex items-center space-x-2 border border-rose-250 bg-rose-50 dark:bg-rose-955/20 p-4 rounded-2xl text-rose-800 dark:text-rose-300 text-xs animate-fade-in">
                <AlertTriangle size={16} />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Response Statistics Results */}
            {result && (
              <div className="border border-slate-150 dark:border-slate-800 p-6 rounded-3xl space-y-5 animate-fade-in">
                <div className="flex items-center space-x-2.5 text-emerald-600 dark:text-emerald-450 border-b border-slate-100 dark:border-slate-850 pb-3">
                  <CheckCircle size={22} className="flex-shrink-0" />
                  <h4 className="font-bold text-sm">Batch processed successfully!</h4>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <span className="text-slate-400 dark:text-slate-500 block uppercase mb-1">PROFILES CREATED</span>
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{result.recordsCreated}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
                    <span className="text-slate-400 dark:text-slate-500 block uppercase mb-1">MANAGER LINKS BOUND</span>
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{result.managerLinksConnected}</span>
                  </div>
                </div>

                {/* Import warnings lists */}
                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-slate-555 dark:text-slate-400 block border-t border-slate-100 dark:border-slate-850 pt-3">Warnings & Error logs ({result.errors.length}):</span>
                    <div className="max-h-[160px] overflow-y-auto bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-850 p-4">
                      <ul className="list-disc list-inside text-[11px] text-rose-800 dark:text-rose-400 space-y-1">
                        {result.errors.map((msg, idx) => (
                          <li key={idx}>{msg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documentation Sidebar Info panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 h-fit shrink-0">
          <div className="flex items-center space-x-2 text-indigo-650 dark:text-indigo-400">
            <HelpCircle size={20} />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Requirements Guideline</h3>
          </div>

          <div className="space-y-4 text-xs font-medium text-slate-600 dark:text-slate-400">
            <p>Your CSV file should match our schema. Invalid lines are automatically skipped and logged without breaking the bulk transaction.</p>
            
            <div className="bg-slate-50 dark:bg-slate-805/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 block uppercase tracking-wider text-[10px]">Expected Schema Fields</span>
              <ul className="list-decimal list-inside space-y-1 text-[11px] text-slate-500">
                <li><code className="text-indigo-500">employeeId</code> (Unique, required)</li>
                <li><code className="text-indigo-500">name</code> (Required)</li>
                <li><code className="text-indigo-500">email</code> (Unique, required)</li>
                <li><code className="text-indigo-500">phone</code> (Optional)</li>
                <li><code className="text-indigo-500">department</code> (Required)</li>
                <li><code className="text-indigo-500">designation</code> (Required)</li>
                <li><code className="text-indigo-500">salary</code> (Numeric, required)</li>
                <li><code className="text-indigo-500">joiningDate</code> (YYYY-MM-DD)</li>
                <li><code className="text-indigo-500">status</code> (Active/Inactive)</li>
                <li><code className="text-indigo-500">role</code> (Employee/HR Manager)</li>
                <li><code className="text-indigo-505">reportingManagerId</code> (Employee ID)</li>
              </ul>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center space-x-2 py-2.5 border border-indigo-250 dark:border-indigo-900 hover:bg-indigo-50/20 hover:text-indigo-600 text-slate-700 dark:text-slate-350 rounded-2xl font-bold transition-all text-xs"
            >
              <FileDown size={14} />
              <span>Download Schema Sample</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
