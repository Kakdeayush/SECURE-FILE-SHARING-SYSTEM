import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, Lock, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { publicAPI } from '../services/api';

const PublicDownload = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [fileData, setFileData] = useState(null);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        const res = await publicAPI.getFileInfo(token);
        const data = res.data.data;
        if (data.passwordProtected) {
          setRequiresPassword(true);
        } else {
          setFileData(data);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'This link is invalid, expired, or the download limit has been reached.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchFileInfo();
  }, [token]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPasswordError('');
    try {
      const res = await publicAPI.verifyPassword(token, password);
      setRequiresPassword(false);
      setFileData(res.data.data);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Incorrect password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    // Build download URL — browser handles the file download natively
    const downloadUrl = publicAPI.getDownloadUrl(token, requiresPassword ? null : password);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', fileData?.name || 'download');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  if (loading && !fileData && !requiresPassword) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-indigo-500 mb-4 animate-spin" />
          <p className="text-slate-500 font-medium">Verifying secure link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Link Unavailable</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <a href="/" className="inline-block bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition">
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-center items-center">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold text-slate-900 tracking-tight">SecureShare</h2>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl sm:rounded-2xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>

          {requiresPassword ? (
            <form onSubmit={handlePasswordSubmit}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600 mb-4">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Password Required</h3>
                <p className="text-sm text-slate-500 mt-2">This file is protected. Enter the password to access it.</p>
              </div>

              {passwordError && (
                <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center">
                  {passwordError}
                </div>
              )}

              <div className="mb-6">
                <input type="password" required placeholder="Enter Password"
                  className="block w-full text-center py-3 px-4 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition-colors">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock File'}
              </button>
            </form>
          ) : fileData && (
            <div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-slate-800">Ready to Download</h3>
                <p className="text-sm text-slate-500 mt-1">Shared securely via SecureShare</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
                <div className="flex items-start">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl mr-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate mb-1" title={fileData.name}>{fileData.name}</p>
                    <div className="flex flex-col space-y-1 text-sm text-slate-500">
                      <span>Size: <span className="font-medium text-slate-700">{fileData.size}</span></span>
                      <span>Shared by: <span className="font-medium text-slate-700">{fileData.owner}</span></span>
                      {fileData.expiresIn && fileData.expiresIn !== 'N/A' && (
                        <span className="text-amber-600">Expires in: {fileData.expiresIn}</span>
                      )}
                      {fileData.remainingDownloads != null && (
                        <span className="text-slate-500">{fileData.remainingDownloads} download(s) remaining</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleDownload} disabled={downloading}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition-all">
                {downloading ? (
                  <><Loader2 className="w-5 h-5 mr-3 animate-spin" />Downloading...</>
                ) : (
                  <><Download className="w-5 h-5 mr-3" />Download File</>
                )}
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-8">Report abuse or suspicious files</p>
      </div>
    </div>
  );
};

export default PublicDownload;
