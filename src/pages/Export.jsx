import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

// ═══════════════════════════════════════════════════════════
// صفحة التصدير + تصنيف التطبيقات
//
// التصدير يفتح رابطاً مباشراً بدل fetch، لأن المتصفح يتولى
// حفظ الملف. والتوكن يُمرَّر في الـ query string لأن التنزيل
// المباشر لا يرسل ترويسة Authorization.
// ═══════════════════════════════════════════════════════════

const datasets = [
  { key: 'users',          label: 'المستخدمون',        desc: 'كل الحسابات مع ملخص نشاطها',        icon: '👥', dated: false },
  { key: 'activities',     label: 'النشاط',            desc: 'الخطوات والمسافة والسعرات يومياً',  icon: '🚶', dated: true },
  { key: 'sleep',          label: 'النوم',             desc: 'جلسات النوم ومدتها وجودتها',        icon: '😴', dated: true },
  { key: 'phone-usage',    label: 'استخدام الهاتف',    desc: 'صف لكل تطبيق يومياً مع التصنيف',    icon: '📱', dated: true },
  { key: 'app-categories', label: 'ملخص التصنيفات',    desc: 'مجموع الاستخدام لكل تصنيف',         icon: '📊', dated: true },
  { key: 'assessments',    label: 'إجابات الاختبارات', desc: 'صف لكل إجابة مع الدرجة',            icon: '📝', dated: false },
];

export default function Export() {
  const { api, apiUrl, token } = useAuth();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [cats, setCats] = useState([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [days, setDays] = useState(30);

  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState(null);

  const loadCategories = async () => {
    setCatsLoading(true);
    try {
      const res = await api(`/admin/stats/app-categories?days=${days}`);
      if (res.success) setCats(res.data);
    } catch (e) {
      console.error(e);
    }
    setCatsLoading(false);
  };

  useEffect(() => { loadCategories(); }, [days]);

  const download = (key, dated) => {
    const params = new URLSearchParams({ token });
    if (dated && from) params.set('from', from);
    if (dated && to) params.set('to', to);
    window.open(`${apiUrl}/export/${key}?${params}`, '_blank');
  };

  const runBackfill = async () => {
    if (!confirm('سيتم تصنيف كل السجلات غير المصنّفة. متابعة؟')) return;
    setBackfilling(true);
    setBackfillMsg(null);
    try {
      const res = await api('/admin/maintenance/backfill-categories', { method: 'POST' });
      setBackfillMsg(
        res.success
          ? { ok: true, text: res.message }
          : { ok: false, text: res.message || 'فشل التصنيف' }
      );
      if (res.success) loadCategories();
    } catch (e) {
      setBackfillMsg({ ok: false, text: 'خطأ: ' + e.message });
    }
    setBackfilling(false);
  };

  const maxMinutes = Math.max(...cats.map((c) => c.total_minutes), 1);

  const fmtHours = (m) => {
    const h = Math.floor(m / 60);
    if (h >= 24) return `${(h / 24).toFixed(1)} يوم`;
    return h >= 1 ? `${h} س ${Math.round(m % 60)} د` : `${Math.round(m)} د`;
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">التصدير والتحليل</h1>
        <p className="text-sm text-gray-500">تنزيل البيانات كملفات CSV تفتح مباشرة في Excel</p>
      </div>

      {/* ═══ تصنيف التطبيقات ═══ */}
      <div className="panel p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-gray-800">تصنيف التطبيقات</h2>
            <p className="text-xs text-gray-500">إجمالي الاستخدام لكل تصنيف عبر جميع المستخدمين</p>
          </div>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value={7}>آخر 7 أيام</option>
            <option value={30}>آخر 30 يوم</option>
            <option value={90}>آخر 90 يوم</option>
            <option value={365}>آخر سنة</option>
          </select>
        </div>

        {catsLoading && <div className="text-center text-gray-400 py-8">جاري التحميل...</div>}

        {!catsLoading && cats.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
            <div className="font-semibold mb-1">لا توجد بيانات مصنّفة</div>
            <p className="text-xs mb-3">
              عمود <code className="bg-amber-100 px-1 rounded">category</code> كان
              يبقى فارغاً لأن التطبيق لم يكن يرسله إطلاقاً. اضغط الزر لتصنيف
              كل السجلات المتراكمة من أسماء الحزم.
            </p>
            <button onClick={runBackfill} disabled={backfilling}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
              {backfilling ? 'جاري التصنيف...' : 'تصنيف السجلات القديمة'}
            </button>
          </div>
        )}

        {!catsLoading && cats.length > 0 && (
          <>
            <div className="space-y-3">
              {cats.map((c) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{c.category}</span>
                    <span className="text-gray-500 text-xs">
                      {fmtHours(c.total_minutes)} · {c.percentage}% · {c.apps_count} تطبيق
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${(c.total_minutes / maxMinutes) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={runBackfill} disabled={backfilling}
              className="mt-4 text-xs text-gray-500 hover:text-gray-700 underline">
              {backfilling ? 'جاري التصنيف...' : 'إعادة تصنيف السجلات غير المصنّفة'}
            </button>
          </>
        )}

        {backfillMsg && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${backfillMsg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {backfillMsg.ok ? '✅ ' : '⚠️ '}{backfillMsg.text}
          </div>
        )}
      </div>

      {/* ═══ نطاق التاريخ ═══ */}
      <div className="panel p-5 mb-6">
        <h2 className="font-bold text-gray-800 mb-1">نطاق التاريخ</h2>
        <p className="text-xs text-gray-500 mb-4">
          اتركه فارغاً لتصدير كل البيانات. لا ينطبق على المستخدمين وإجابات الاختبارات.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">من</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-600 block mb-1">إلى</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {(from || to) && (
            <div className="flex items-end">
              <button onClick={() => { setFrom(''); setTo(''); }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-paper">
                مسح
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ ملفات التصدير ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((d) => (
          <div key={d.key}
            className="panel p-5 hover:border-primary-300 hover:shadow-md transition-all">
            <div className="text-3xl mb-2">{d.icon}</div>
            <h3 className="font-bold text-gray-800">{d.label}</h3>
            <p className="text-xs text-gray-500 mb-1 h-8">{d.desc}</p>
            {d.dated && (from || to) && (
              <div className="text-xs text-primary-600 mb-2">
                {from || '...'} ← {to || 'اليوم'}
              </div>
            )}
            <button onClick={() => download(d.key, d.dated)}
              className="w-full mt-2 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg text-sm font-medium">
              تنزيل CSV
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900">
        <div className="font-semibold mb-1">💡 حول ملفات CSV</div>
        الملفات تحتوي علامة BOM فتفتح في Excel بعربي سليم مباشرة بدون
        خطوات استيراد. لو ظهرت الحروف مشوّهة، افتح Excel أولاً ثم
        بيانات ← من نص/CSV ← اختر الترميز UTF-8.
      </div>
    </div>
  );
}
