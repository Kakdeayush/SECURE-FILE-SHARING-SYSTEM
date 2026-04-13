import React, { useState } from 'react';
import { User, Mail, Shield, Key, Save, Loader2, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@secureshare.com',
    role: 'Administrator',
    organization: 'Acme Corp'
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      // Mock API delay
      await new Promise(r => setTimeout(r, 800));
      setSuccessMsg('Profile updated successfully.');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Account Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your profile and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md mb-4">
              {profileData.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{profileData.name}</h3>
            <p className="text-sm text-slate-500 mb-4">{profileData.role}</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              Active Account
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-sm font-semibold text-slate-800 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-indigo-600" /> Security
              </h4>
            </div>
            <div className="p-4 space-y-4">
              <button className="w-full text-left text-sm text-slate-700 hover:text-indigo-600 flex items-center transition-colors">
                <Key className="w-4 h-4 mr-2 text-slate-400" /> Change Password
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left text-sm text-red-600 hover:text-red-700 flex items-center transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2 text-red-400" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Personal Information</h3>
            
            {successMsg && (
              <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-lg text-sm border border-emerald-100 flex items-center">
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 focus:bg-white"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                      value={profileData.email}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-slate-50 focus:bg-white"
                    value={profileData.organization}
                    onChange={(e) => setProfileData({...profileData, organization: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                    value={profileData.role}
                    disabled
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all shadow-sm"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
