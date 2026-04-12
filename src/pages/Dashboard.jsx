import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import StatsCard from '../components/StatsCard';
import { formatDate } from '../services/utils';

export default function Dashboard() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentSyncs, setRecentSyncs] = useState([]);

  useEffect(() => {
    api('/admin/dashboard').then((res) => {
      if (res.success) {
        setStats(res.data.stats);
        setRecentUsers(res.data.recent_users);
        setRecentSyncs(res.data.recent_syncs);
      }
    }).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">لوحة التحكم</h1>
      <p className="text-gray-500 mb-8">نظرة عامة على النظام</p>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatsCard label="إجمالي المستخدمين" value={stats.total_users || 0} color="blue"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatsCard label="نشطين اليوم" value={stats.active_users_today || 0} color="green"
          icon="M13 10V3L4 14h7v7l9-11h-7z" />
        <StatsCard label="جلسات نوم" value={stats.total_sleep_records || 0} color="purple"
          icon="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        <StatsCard label="اختبارات مكتملة" value={stats.total_assessments_completed || 0} color="orange"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">آخر المستخدمين المسجلين</h3>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                    <span className="text-primary-500 font-semibold">{user.full_name?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{user.full_name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <button onClick={() => navigate(`/users/${user.id}`)} className="text-primary-500 text-sm hover:underline">عرض</button>
              </div>
            ))}
            {recentUsers.length === 0 && <div className="text-center text-gray-400 py-4">لا يوجد مستخدمين</div>}
          </div>
        </div>

        {/* Recent Syncs */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">آخر عمليات المزامنة</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentSyncs.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                <div>
                  <div className="font-medium text-gray-700">{sync.full_name}</div>
                  <div className="text-xs text-gray-500">{formatDate(sync.synced_at)}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${sync.status === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {sync.records_synced} سجل
                </span>
              </div>
            ))}
            {recentSyncs.length === 0 && <div className="text-center text-gray-400 py-4">لا توجد عمليات</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
