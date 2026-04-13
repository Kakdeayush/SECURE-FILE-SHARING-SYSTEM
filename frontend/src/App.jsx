import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Files from './pages/Files';
import Upload from './pages/Upload';
import PublicDownload from './pages/PublicDownload';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

// Placeholder Pages - To be split into their respective files





// Simple auth check component
const ProtectedRoute = ({ children }) => {
  // In a real app we'd check context/localStorage
  const isAuthenticated = !!localStorage.getItem('token');
  
  // For development without a backend, we'll temporarly bypass the redirect 
  // if you want to see the UI. Remove `|| true` to enforce auth lock.
  if (!isAuthenticated && !window.location.host.includes('localhost')) { 
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected Dashboard Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="files" element={<Files />} />
          <Route path="upload" element={<Upload />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Public File Download Route */}
        <Route path="/file/:token" element={<PublicDownload />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
