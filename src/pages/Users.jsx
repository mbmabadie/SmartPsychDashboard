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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">المستخدمين</h1>
          <p className="text-gray-500">إجمالي {total} مستخدم</p>
        </div>
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو البريد..."
          className="px-4 py-2 border border-gray-200 rounded-lg w-72 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
  );
}
