import React, { useState, useEffect, createContext, useContext } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Logo from './components/Logo';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetails from './pages/UserDetails';
import Assessments from './pages/Assessments';
import AssessmentDetail from './pages/AssessmentDetail';
import Stats from './pages/Stats';
import Export from './pages/Export';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const PRODUCTION_API_URL = 'https://api.smartpsych.cloud/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');

  // ✅ بيانات المشرف — السيرفر يرجعها عند الدخول لكنها كانت تُهمَل
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || 'null');
    } catch {
      return null;
    }
  });

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

  const login = (newToken, adminUser = null) => {
    setToken(newToken);
    localStorage.setItem('admin_token', newToken);
    if (adminUser) {
      setUser(adminUser);
      localStorage.setItem('admin_user', JSON.stringify(adminUser));
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
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

  const authValue = { token, user, apiUrl, isAuth, login, logout, updateApiUrl, api };

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

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* شريط علوي على الموبايل فقط */}
      <header className="md:hidden fixed top-0 inset-x-0 z-20 bg-panel border-b border-ink-8
                         h-14 px-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -m-2 text-ink-70"
          aria-label="فتح القائمة"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <Logo size={22} className="text-primary-400" />
          <span className="font-semibold text-ink text-sm">Smart Psych</span>
        </div>
        <div className="w-9" />
      </header>

      <main className="md:mr-60 pt-14 md:pt-0 px-4 md:px-8 py-5 md:py-8
                       min-w-0 overflow-x-hidden">
        <div className="max-w-[1180px] mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/assessments" element={<Assessments />} />
            <Route path="/assessments/:id" element={<AssessmentDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/export" element={<Export />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
