import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Assessments from './pages/Assessments';
import Stats from './pages/Stats';

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const defaultApiUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : `${window.location.origin}/api`;
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('admin_api_url') || defaultApiUrl);

  const isAuth = !!token;

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('admin_token', newToken);
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('admin_token');
  };

  const updateApiUrl = (url) => {
    setApiUrl(url);
    localStorage.setItem('admin_api_url', url);
  };

  // API helper
  const api = async (path, options = {}) => {
    const res = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
    return res.json();
  };

  const authValue = { token, apiUrl, isAuth, login, logout, updateApiUrl, api };

  if (!isAuth) {
    return (
      <AuthContext.Provider value={authValue}>
        <Login />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 mr-64 p-8 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthContext.Provider>
  );
}
