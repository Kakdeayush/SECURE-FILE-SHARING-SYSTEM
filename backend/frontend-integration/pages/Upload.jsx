import React, { useState, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, CheckCircle, Copy, Loader2, AlertCircle } from 'lucide-react';
import { filesAPI } from '../services/api';
import { Link } from 'react-router-dom';

const MAX_FILE_SIZE_MB = 50;

const Upload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [settings, setSettings] = useState({ expiryDays: '7', downloadLimit: '', password: '' });
  const inputRef = useRef(null);

  const validateFile = (selectedFile) => {
    setError('');
    if (!selectedFile) return false;
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return false;
    }
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      const f = e.dataTransfer.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      if (validateFile(f)) setFile(f);
    }
  };

  const clearFile = () => {
    setFile(null); setUploadSuccess(false); setShareLink(''); setProgress(0); setError('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('expiryDays', settings.expiryDays);
    if (settings.downloadLimit) formData.append('downloadLimit', settings.downloadLimit);
    if (settings.password) formData.append('password', settings.password);

    try {
      const res = await filesAPI.upload(formData, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(pct);
      });

      const { token } = res.data.data;
      const generatedLink = `${window.location.origin}/file/${token}`;
      setShareLink(generatedLink);
      setUploadSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Secure File Upload</h2>
        <p className="text-sm text-slate-500 mt-1">Upload a file to generate a secure, shareable link.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {uploadSuccess ? (
          <div className="p-8 pb-10 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Upload Successful!</h3>
            <p className="text-slate-600 mb-8 max-w-md">Your file <span className="font-semibold">{file.name}</span> has been securely uploaded and encrypted.</p>
            <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
              <input type="text" readOnly value={shareLink}
                className="flex-1 w-full bg-white border border-slate-300 rounded-lg py-2 px-3 text-sm text-slate-600 focus:outline-none" />
              <button onClick={copyToClipboard}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                <Copy className="w-4 h-4 mr-2" /> Copy Link
              </button>
            </div>
            <div className="mt-8 flex gap-4">
              <button onClick={clearFile}
                className="px-6 py-2 border border-slate-300 bg-white text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition">
                Upload Another
              </button>
              <Link to="/files" className="px-6 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition">
                View My Files
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            {error && (
              <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" /><span>{error}</span>
              </div>
            )}

            {!file ? (
              <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                  dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}>
                <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
                <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full mb-4">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-slate-500">Maximum file size {MAX_FILE_SIZE_MB}MB</p>
              </div>
            ) : (
              <div className="space-y-8 mt-2">
                <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                  {uploading && (
                    <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  )}
                  <div className="flex items-center overflow-hidden">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-4 flex-shrink-0">
                      <FileIcon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!uploading && (
                    <button onClick={clearFile} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4">Security & Sharing Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Link Expiry</label>
                      <select
                        className="w-full text-sm border-slate-300 rounded-lg py-2 pl-3 pr-8 border bg-white focus:ring-indigo-500 focus:border-indigo-500"
                        value={settings.expiryDays}
                        onChange={(e) => setSettings({ ...settings, expiryDays: e.target.value })}
                        disabled={uploading}>
                        <option value="1">24 Hours</option>
                        <option value="7">7 Days</option>
                        <option value="30">30 Days</option>
                        <option value="never">Never</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Max Downloads (Optional)</label>
                      <input type="number" placeholder="e.g. 10"
                        className="w-full text-sm border-slate-300 rounded-lg py-2 px-3 border bg-white focus:ring-indigo-500 focus:border-indigo-500"
                        value={settings.downloadLimit}
                        onChange={(e) => setSettings({ ...settings, downloadLimit: e.target.value })}
                        disabled={uploading} />
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Password Protection (Optional)</label>
                      <input type="password" placeholder="Leave blank for public access"
                        className="w-full text-sm border-slate-300 rounded-lg py-2 px-3 border bg-white focus:ring-indigo-500 focus:border-indigo-500"
                        value={settings.password}
                        onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                        disabled={uploading} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button onClick={handleUpload} disabled={uploading}
                    className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-sm">
                    {uploading ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Uploading {progress}%</>
                    ) : (
                      <><UploadCloud className="w-5 h-5 mr-2" />Generate Secure Link</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
