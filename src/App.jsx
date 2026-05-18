import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import Stats from './pages/Stats';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const PRODUCTION_API_URL = 'https://api.smartpsych.cloud/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');

  const defaultApiUrl = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : PRODUCTION_API_URL;

  const savedApiUrl = localStorage.getItem('admin_api_url');
  const isStaleUrl = savedApiUrl && (
    savedApiUrl.includes('dashboard.smartpsych.cloud') ||
    savedApiUrl.includes('YOUR_SERVER_IP')
  );

  if (isStaleUrl) localStorage.removeItem('admin_api_url');

  const [apiUrl, setApiUrl] = useState((isStaleUrl ? null : savedApiUrl) || defaultApiUrl);
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
      <AppShell />
    </AuthContext.Provider>
  );
}

// ✅ shell منفصل ليستخدم useLocation و state
function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // إغلاق الـ sidebar عند تغيير الـ route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ✅ Top bar فقط على الموبايل (لزر الـ menu) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-20 bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -m-2 text-gray-700">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="p-1 bg-primary-50 rounded">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-sm">Smart Psych</span>
        </div>
        <div className="w-10" /> {/* spacer للموازنة */}
      </header>

      {/* ✅ Main - بدون margin على الموبايل، مع mr-64 على md فأكثر */}
      <main className="flex-1 md:mr-64 pt-14 md:pt-0 p-4 md:p-8 overflow-x-hidden min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetails />} />
          <Route path="/assessments" element={<Assessments />} />
          <Route path="/assessments/:id" element={<AssessmentDetail />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
