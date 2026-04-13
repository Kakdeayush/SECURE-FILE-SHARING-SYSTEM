import React from 'react';
import { Outlet } from 'react-router-dom';
import { Folder } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-inter">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-center items-center">
          <div className="bg-gradient-to-tr from-indigo-600 to-indigo-800 p-3 rounded-2xl shadow-xl">
            <Folder className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          SecureShare
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Enterprise-grade secure file sharing
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-100 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 hover:to-purple-500 to-indigo-600"></div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
