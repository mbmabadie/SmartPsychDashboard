import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Modal from '../components/Modal';

function Stat({ n, label, tone = 'text-ink' }) {
  return (
    <div className="text-center">
      <div className={`font-mono text-xl font-medium tabular ${tone}`}>
        {Number(n || 0).toLocaleString('en-US')}
      </div>
      <div className="text-micro text-ink-30 mt-0.5">{label}</div>
    </div>
  );
}

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
      <header className="mb-6 pb-5 border-b border-ink-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-1.5">الاختبارات</div>
            <h1 className="text-2xl font-semibold text-ink">الاختبارات النفسية</h1>
            <p className="text-micro text-ink-50 mt-1">
              اضغط على اختبار لإدارة أسئلته ودوراته
            </p>
          </div>
          <button onClick={() => { setShowCreate(true); setErrorMsg(''); }}
            className="btn-primary whitespace-nowrap">
            اختبار جديد
          </button>
        </div>
      </header>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="panel p-5 space-y-3">
              <div className="skel h-4 w-3/5" />
              <div className="skel h-3 w-2/5" />
              <div className="skel h-10 w-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && assessments.length === 0 && (
        <div className="panel px-5 py-20 text-center">
          <div className="text-sm text-ink-50">لا اختبارات بعد</div>
          <div className="text-micro text-ink-30 mt-1.5 mb-5">
            الاختبار يحمل الأسئلة، والدورة تحدّد متى تظهر للمشاركين.
          </div>
          <button onClick={() => { setShowCreate(true); setErrorMsg(''); }}
            className="btn-primary">
            إنشاء أول اختبار
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assessments.map((a, i) => (
          <div key={a.id}
            onClick={() => navigate(`/assessments/${a.id}`)}
            className="panel p-5 hover:border-primary-300 transition-colors cursor-pointer rise"
            style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-ink truncate">{a.title_ar || a.title}</h3>
                <span className="badge badge-mute mt-1.5">
                  {categoryLabels[a.category] || a.category}
                </span>
              </div>
              <span className={`badge ${a.is_active ? 'badge-ok' : 'badge-mute'}`}>
                {a.is_active ? 'نشط' : 'معطّل'}
              </span>
            </div>

            {a.description_ar && (
              <p className="text-sm text-ink-50 mb-3 line-clamp-2">{a.description_ar}</p>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-ink-8">
              <Stat n={a.questions_count} label="سؤال" />
              <Stat n={a.rotations_count} label="دورة" />
              <Stat n={a.active_rotations_count || 0} label="نشطة الآن"
                    tone={a.active_rotations_count > 0 ? 'text-signal-ok' : 'text-ink-30'} />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 pt-3 border-t border-gray-100">
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
