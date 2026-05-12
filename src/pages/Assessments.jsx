import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Modal from '../components/Modal';

export default function Assessments() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    title_ar: '',
    description_ar: '',
    category: 'mental_health',
  });

  useEffect(() => { loadAssessments(); }, []);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await api('/assessments/all');
      if (res.success) setAssessments(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const createAssessment = async () => {
    setErrorMsg('');
    if (!form.title_ar?.trim()) {
      setErrorMsg('العنوان مطلوب');
      return;
    }

    setCreating(true);
    try {
      const res = await api('/assessments/create', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          title: form.title_ar.trim(),
          description: form.description_ar?.trim() || '',
          questions: [],
        }),
      });

      if (res.success) {
        setShowCreate(false);
        setForm({ title_ar: '', description_ar: '', category: 'mental_health' });
        navigate(`/assessments/${res.data.id}`);
      } else {
        setErrorMsg(res.message || 'فشل الإنشاء');
      }
    } catch (e) {
      setErrorMsg('خطأ: ' + e.message);
    } finally {
      setCreating(false);
    }
  };

  const deleteAssessment = async (id, e) => {
    e.stopPropagation();
    if (!confirm('حذف الاختبار وكل أسئلته ودوراته؟')) return;
    try {
      const res = await api(`/assessments/${id}`, { method: 'DELETE' });
      if (res.success) loadAssessments();
    } catch (e) { console.error(e); }
  };

  const categoryLabels = {
    mental_health: 'صحة نفسية',
    anxiety: 'قلق',
    depression: 'اكتئاب',
    stress: 'ضغط نفسي',
    general: 'عام',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">الاختبارات</h1>
          <p className="text-gray-500">إدارة الاختبارات النفسية - اضغط على اختبار لإدارة أسئلته ودوراته</p>
        </div>
        <button onClick={() => { setShowCreate(true); setErrorMsg(''); }}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium">
          + اختبار جديد
        </button>
      </div>

      {loading && <div className="text-center text-gray-400 py-12">جاري التحميل...</div>}

      {!loading && assessments.length === 0 && (
        <div className="text-center text-gray-400 py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <div className="text-4xl mb-2">📋</div>
          <div>لا يوجد اختبارات بعد</div>
          <div className="text-sm">ابدأ بإنشاء اختبار جديد</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessments.map((a) => (
          <div key={a.id}
            onClick={() => navigate(`/assessments/${a.id}`)}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg">{a.title_ar || a.title}</h3>
                <span className="inline-block mt-1 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                  {categoryLabels[a.category] || a.category}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${a.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {a.is_active ? 'نشط' : 'معطل'}
              </span>
            </div>

            {a.description_ar && (
              <div className="text-sm text-gray-600 mb-3 line-clamp-2">{a.description_ar}</div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-800">{a.questions_count}</div>
                <div className="text-xs text-gray-500">سؤال</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-800">{a.rotations_count}</div>
                <div className="text-xs text-gray-500">دورة</div>
              </div>
              <div className="text-center">
                <div className={`text-xl font-bold ${a.active_rotations_count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  {a.active_rotations_count || 0}
                </div>
                <div className="text-xs text-gray-500">نشطة الآن</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 py-2 rounded-lg font-medium">
                إدارة →
              </button>
              <button onClick={(e) => deleteAssessment(a.id, e)}
                className="text-sm text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg">
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal — مبسط جداً، بس العنوان والفئة */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="إنشاء اختبار جديد">
        <div className="space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
              ⚠️ {errorMsg}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-600 block mb-1">عنوان الاختبار *</label>
            <input type="text" value={form.title_ar}
              onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
              placeholder="مثل: اختبار القلق العام"
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">الوصف (اختياري)</label>
            <textarea value={form.description_ar}
              onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500" />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">الفئة</label>
            <select value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg outline-none">
              <option value="mental_health">صحة نفسية</option>
              <option value="anxiety">قلق</option>
              <option value="depression">اكتئاب</option>
              <option value="stress">ضغط نفسي</option>
              <option value="general">عام</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm">
            💡 بعد إنشاء الاختبار رح تنتقل لصفحة التفاصيل لإضافة الأسئلة والدورات
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={createAssessment} disabled={creating}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50">
              {creating ? 'جاري الإنشاء...' : 'إنشاء الاختبار'}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
