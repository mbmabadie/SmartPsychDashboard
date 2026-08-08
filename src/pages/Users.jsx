import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { formatDate } from '../services/utils';

const SORTS = [
  { key: 'recent',      label: 'الأحدث' },
  { key: 'name',        label: 'الاسم' },
  { key: 'activity',    label: 'الأكثر نشاطاً' },
  { key: 'assessments', label: 'الاختبارات' },
];

const fmtNum = (n) => Number(n || 0).toLocaleString('en-US');

export default function Users() {
  const { api } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [onlyActive, setOnlyActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // البحث على الخادم مع تأخير — لا نُرسل طلباً مع كل حرف
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      setLoading(true);
      api(`/admin/users?limit=200${search ? `&search=${encodeURIComponent(search)}` : ''}`)
        .then((res) => {
          if (!alive || !res.success) return;
          setUsers(res.data || []);
          setTotal(res.pagination?.total ?? (res.data || []).length);
        })
        .catch(console.error)
        .finally(() => { if (alive) setLoading(false); });
    }, search ? 300 : 0);

    return () => { alive = false; clearTimeout(t); };
  }, [search]);

  const shown = useMemo(() => {
    let list = onlyActive ? users.filter((u) => u.is_active) : [...users];

    const num = (v) => Number(v || 0);
    if (sort === 'name') {
      list.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'ar'));
    } else if (sort === 'activity') {
      list.sort((a, b) => num(b.activity_records) - num(a.activity_records));
    } else if (sort === 'assessments') {
      list.sort((a, b) => num(b.assessments_completed) - num(a.assessments_completed));
    }
    return list;
  }, [users, sort, onlyActive]);

  return (
    <div>
      <header className="mb-6 pb-5 border-b border-ink-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-1.5">المشاركون</div>
            <h1 className="text-2xl font-semibold text-ink">
              {loading ? '—' : fmtNum(total)}
              <span className="text-base font-normal text-ink-50 mr-2">مسجّل</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <svg
                className="w-4 h-4 text-ink-30 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو البريد"
                className="field pr-9 w-full sm:w-64"
              />
            </div>
            <label className="flex items-center gap-2 px-3 h-10 rounded-md border
                              border-ink-15 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="w-3.5 h-3.5 accent-primary-400"
              />
              <span className="text-sm text-ink-70">النشطون فقط</span>
            </label>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-1 -mx-1 px-1">
          <div className="seg">
            {SORTS.map((s) => (
              <button
                key={s.key}
                data-on={sort === s.key}
                onClick={() => setSort(s.key)}
                className="seg-item"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="panel overflow-hidden rise">
        {/* ترويسة الأعمدة — تختفي على الشاشات الضيقة */}
        <div className="hidden md:flex items-center gap-3 px-5 h-10 border-b border-ink-8">
          <span className="eyebrow flex-1">المشارك</span>
          <span className="eyebrow w-20 text-center">نشاط</span>
          <span className="eyebrow w-20 text-center">نوم</span>
          <span className="eyebrow w-20 text-center">اختبارات</span>
          <span className="eyebrow w-28">آخر دخول</span>
          <span className="w-4" />
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skel w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="skel h-3 w-40" />
                  <div className="skel h-2.5 w-56" />
                </div>
                <div className="skel h-3 w-12" />
              </div>
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="px-5 py-20 text-center">
            <div className="text-sm text-ink-50">
              {search ? 'لا نتائج مطابقة' : 'لا مشاركين بعد'}
            </div>
            <div className="text-micro text-ink-30 mt-1.5">
              {search
                ? 'جرّب اسماً أو بريداً آخر.'
                : 'سيظهر المشاركون هنا بمجرّد تسجيلهم من التطبيق.'}
            </div>
          </div>
        ) : (
          <ul className="scroll-y" style={{ maxHeight: '34rem' }}>
            {shown.map((u) => (
              <li
                key={u.id}
                onClick={() => navigate(`/users/${u.id}`)}
                className="drow cursor-pointer"
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-100
                                  flex items-center justify-center">
                    <span className="text-primary-500 font-semibold text-sm">
                      {u.full_name?.trim()?.charAt(0) || '؟'}
                    </span>
                  </div>
                  {!u.is_active && (
                    <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full
                                     bg-ink-30 border-2 border-panel" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink truncate">{u.full_name}</div>
                  <div className="font-mono text-micro text-ink-30 truncate">{u.email}</div>
                  {/* أرقام مضغوطة على الموبايل */}
                  <div className="md:hidden flex gap-3 mt-1 font-mono text-micro text-ink-50 tabular">
                    <span>{fmtNum(u.activity_records)} نشاط</span>
                    <span>{fmtNum(u.sleep_records)} نوم</span>
                    <span>{fmtNum(u.assessments_completed)} اختبار</span>
                  </div>
                </div>

                <span className="hidden md:block dnum w-20 text-center">
                  {fmtNum(u.activity_records)}
                </span>
                <span className="hidden md:block dnum w-20 text-center">
                  {fmtNum(u.sleep_records)}
                </span>
                <span className="hidden md:block dnum w-20 text-center">
                  {fmtNum(u.assessments_completed)}
                </span>
                <span className="hidden md:block font-mono text-micro text-ink-50 w-28 tabular">
                  {u.last_login_at ? formatDate(u.last_login_at) : '—'}
                </span>

                <svg className="w-4 h-4 text-ink-15 shrink-0" fill="none"
                     stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loading && shown.length > 0 && (
        <div className="mt-3 text-micro text-ink-30 font-mono tabular">
          يُعرض {fmtNum(shown.length)} من {fmtNum(total)}
        </div>
      )}
    </div>
  );
}
