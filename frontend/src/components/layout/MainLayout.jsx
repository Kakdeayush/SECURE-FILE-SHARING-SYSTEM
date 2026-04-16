import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Folder, UploadCloud, BarChart2, User, LogOut, Menu } from 'lucide-react';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState({ name: 'Loading...', role: '...' });
  const location = useLocation();

  React.useEffect(() => {
    // Fetch profile
    import('../../services/api').then(({ default: api }) => {
      api.get('/profile')
        .then(res => {
          if (res.data && res.data.data) {
            setUserProfile(res.data.data);
          }
        })
        .catch(err => console.error("Failed to load profile", err));
    });
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Files', href: '/files', icon: Folder },
    { name: 'Upload', href: '/upload', icon: UploadCloud },
    { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-inter">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-200 px-4">
          <Folder className="w-8 h-8 text-indigo-600 mr-2" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-800">SecureShare</span>
        </div>
        <nav className="flex flex-col p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-200 bg-slate-50/50">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white/80 backdrop-blur-md border-b border-slate-200 lg:px-8 shadow-sm">
          <div className="flex items-center flex-1">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 mr-4 text-slate-500 rounded-md lg:hidden hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 capitalize hidden sm:block">
              {location.pathname.replace('/', '') || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-slate-900">{userProfile.name}</div>
              <div className="text-xs text-slate-500">{userProfile.role || 'User'}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:shadow-lg transition-shadow uppercase">
              {userProfile.name ? userProfile.name.charAt(0) : 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto animation-fade-in">
            <Outlet context={{ userProfile, setUserProfile }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
