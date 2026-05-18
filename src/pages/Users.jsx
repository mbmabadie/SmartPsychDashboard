import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { formatDate } from '../services/utils';

export default function Users() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    try {
      const q = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await api(`/admin/users?page=1&limit=50${q}`);
      if (res.success) {
        setUsers(res.data);
        setTotal(res.pagination?.total || 0);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div>
      {/* Header - flex-col على الموبايل */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">المستخدمين</h1>
          <p className="text-sm text-gray-500">إجمالي {total} مستخدم</p>
        </div>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو البريد..."
          className="px-4 py-2 border border-gray-200 rounded-lg w-full sm:w-72 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      {/* ✅ بطاقات على الموبايل */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div key={user.id}
            onClick={() => navigate(`/users/${user.id}`)}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-primary-300 cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-500 font-semibold">{user.full_name?.charAt(0) || '?'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 truncate">{user.full_name}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {user.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2 pt-2 border-t border-gray-100">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">{user.activity_records || 0}</div>
                <div className="text-xs text-gray-500">نشاط</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">{user.sleep_records || 0}</div>
                <div className="text-xs text-gray-500">نوم</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">{user.assessments_completed || 0}</div>
                <div className="text-xs text-gray-500">اختبارات</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {user.last_login_at ? formatDate(user.last_login_at) : 'لم يدخل'}
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center text-gray-400 py-8 bg-white rounded-xl border-2 border-dashed border-gray-200">
            لا يوجد مستخدمين
          </div>
        )}
      </div>

      {/* ✅ جدول على md فأكثر */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">المستخدم</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">النشاط</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">النوم</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">اختبارات</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">آخر دخول</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-700">الحالة</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/users/${user.id}`)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                        <span className="text-primary-500 font-semibold">{user.full_name?.charAt(0) || '?'}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{user.full_name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.activity_records || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.sleep_records || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.assessments_completed || 0}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{user.last_login_at ? formatDate(user.last_login_at) : 'لم يدخل'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded ${user.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {user.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-primary-500 text-sm">عرض ←</span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">لا يوجد مستخدمين</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
