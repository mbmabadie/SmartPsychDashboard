import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { formatDate } from '../services/utils';

const tabs = ['نشاط', 'نوم', 'هاتف', 'مواقع', 'اختبارات'];
const tabEndpoints = { 'نشاط': 'activities', 'نوم': 'sleep', 'هاتف': 'phone-usage', 'مواقع': 'locations', 'اختبارات': 'assessments' };

export default function UserDetails() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('نشاط');
  const [tabData, setTabData] = useState([]);

  useEffect(() => {
    api(`/admin/users/${id}`).then((res) => {
      if (res.success) setDetails(res.data);
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    api(`/admin/users/${id}/${tabEndpoints[activeTab]}`).then((res) => {
      if (res.success) setTabData(res.data);
    }).catch(console.error);
  }, [id, activeTab]);

  // ✅ إعادة تعيين كلمة المرور
  //
  // بديل عملي لـ "نسيت كلمة المرور" بالبريد — المشروع ما فيه
  // خدمة SMTP، فالحوار القديم في التطبيق كان وهمياً بالكامل.
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    const rnd = new Uint32Array(12);
    crypto.getRandomValues(rnd);
    for (let i = 0; i < 12; i++) out += chars[rnd[i] % chars.length];
    setNewPassword(out);
    setResetMsg(null);
  };

  const resetPassword = async () => {
    if (newPassword.length < 8) {
      setResetMsg({ ok: false, text: 'كلمة المرور 8 أحرف على الأقل' });
      return;
    }
    setResetting(true);
    setResetMsg(null);
    try {
      const res = await api(`/admin/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: newPassword }),
      });
      setResetMsg(
        res.success
          ? { ok: true, text: 'تم التعيين. أرسل كلمة المرور للمستخدم بطريقة آمنة.' }
          : { ok: false, text: res.message || 'فشل التعيين' }
      );
    } catch (e) {
      setResetMsg({ ok: false, text: 'خطأ: ' + e.message });
    } finally {
      setResetting(false);
    }
  };

  const toggleUser = async () => {
    if (!confirm('هل أنت متأكد؟')) return;
    const res = await api(`/admin/users/${id}/toggle`, { method: 'PUT' });
    if (res.success) {
      const r = await api(`/admin/users/${id}`);
      if (r.success) setDetails(r.data);
    }
  };

  if (!details) return <div className="text-center py-12 text-gray-400">جاري التحميل...</div>;

  const { user, stats } = details;

  return (
    <div>
      <button onClick={() => navigate('/users')} className="mb-4 text-primary-500 hover:underline flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        العودة للقائمة
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
            <span className="text-primary-500 text-2xl font-bold">{user.full_name?.charAt(0) || '?'}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{user.full_name}</h2>
            <div className="text-gray-500">{user.email}</div>
            <div className="text-xs text-gray-400 mt-1">
              العمر: {user.age || 'غير محدد'} · سُجّل: {formatDate(user.created_at)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => { setShowReset(!showReset); setResetMsg(null); }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition whitespace-nowrap">
              إعادة تعيين كلمة المرور
            </button>
            <button onClick={toggleUser}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${user.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
              {user.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
            </button>
          </div>
        </div>

        {/* لوحة إعادة تعيين كلمة المرور */}
        {showReset && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-amber-900 mb-1">
                تعيين كلمة مرور جديدة لـ {user.full_name}
              </div>
              <p className="text-xs text-amber-800 mb-3">
                لا يوجد نظام بريد في المشروع، فالاستعادة تتم من هنا.
                بعد التعيين، أوصل كلمة المرور للمستخدم بطريقة آمنة واطلب
                منه تغييرها من التطبيق: الإعدادات ← الخصوصية والأمان.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setResetMsg(null); }}
                  placeholder="كلمة مرور جديدة (8 أحرف على الأقل)"
                  dir="ltr"
                  className="flex-1 px-3 py-2 border border-amber-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                />
                <button onClick={generatePassword}
                  className="px-3 py-2 text-sm border border-amber-300 rounded-lg hover:bg-amber-100 whitespace-nowrap">
                  توليد
                </button>
                <button onClick={resetPassword} disabled={resetting}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 whitespace-nowrap">
                  {resetting ? 'جاري...' : 'تعيين'}
                </button>
              </div>

              {resetMsg && (
                <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${resetMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {resetMsg.ok ? '✅ ' : '⚠️ '}{resetMsg.text}
                  {resetMsg.ok && (
                    <div className="mt-2 font-mono text-xs bg-white px-2 py-1 rounded border select-all" dir="ltr">
                      {newPassword}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatBox label="متوسط الخطوات" value={Math.round(stats.avg_steps || 0)} />
        <StatBox label="جلسات نوم" value={stats.total_sleep_sessions || 0} />
        <StatBox label="متوسط النوم" value={`${((stats.avg_sleep_minutes || 0) / 60).toFixed(1)} س`} />
        <StatBox label="اختبارات" value={stats.assessments_completed || 0} />
        <StatBox label="متوسط النتيجة" value={`${(stats.avg_assessment_score || 0).toFixed(0)}%`} />
      </div>

      {/* Tabs + Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 flex">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 border-b-2 font-medium text-sm transition ${activeTab === tab ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tabData.length === 0 ? (
            <div className="text-center text-gray-400 py-8">لا توجد بيانات</div>
          ) : (
            <div className="space-y-2">
              {activeTab === 'نشاط' && tabData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <div className="font-medium">{item.date}</div>
                    <div className="text-xs text-gray-500">
                      {item.total_steps} خطوة · {(item.distance_km || 0).toFixed(1)} كم · {Math.round(item.calories_burned || 0)} سعرة
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${((item.total_steps || 0) / (item.goal_steps || 10000)) >= 1 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {Math.round(((item.total_steps || 0) / (item.goal_steps || 10000)) * 100)}%
                  </span>
                </div>
              ))}

              {activeTab === 'نوم' && tabData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <div className="font-medium">{formatDate(item.start_time)}</div>
                    <div className="text-xs text-gray-500">
                      {((item.duration_minutes || 0) / 60).toFixed(1)} ساعات · جودة: {(item.quality_score || 0).toFixed(1)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.confidence === 'confirmed' ? 'bg-green-50 text-green-600' :
                    item.confidence === 'probable' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-gray-50 text-gray-600'
                  }`}>{item.confidence}</span>
                </div>
              ))}

              {activeTab === 'هاتف' && tabData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <div className="font-medium">{item.app_name || item.package_name}</div>
                    <div className="text-xs text-gray-500">{item.date}</div>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-800">{item.total_usage_minutes} د</div>
                    <div className="text-xs text-gray-500">{item.open_count} فتحة</div>
                  </div>
                </div>
              ))}

              {activeTab === 'مواقع' && tabData.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <div className="font-medium">{item.place_name || 'موقع غير معروف'}</div>
                    <div className="text-xs text-gray-500">{item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</div>
                  </div>
                  <div className="flex gap-1">
                    {item.is_home ? <span className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-600">منزل</span> : null}
                    {item.is_work ? <span className="px-2 py-1 rounded text-xs bg-purple-50 text-purple-600">عمل</span> : null}
                  </div>
                </div>
              ))}

              {activeTab === 'اختبارات' && tabData.map((item, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{item.title_ar || item.title}</div>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      item.score_percentage >= 75 ? 'bg-green-50 text-green-700' :
                      item.score_percentage >= 50 ? 'bg-yellow-50 text-yellow-700' :
                      'bg-red-50 text-red-700'
                    }`}>{(item.score_percentage || 0).toFixed(0)}%</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {formatDate(item.completed_at)} · {item.total_score}/{item.max_possible_score} نقطة
                  </div>
                  {item.responses?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {item.responses.map((r, ri) => (
                        <div key={ri} className="text-xs flex justify-between">
                          <span className="text-gray-600">{r.question_text_ar || r.question_text}</span>
                          <span className="text-gray-800 font-medium">{r.option_text_ar || r.option_text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
    </div>
  );
}
