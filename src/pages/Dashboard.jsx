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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/admin/dashboard')
      .then((res) => {
        if (res.success) {
          setStats(res.data.stats);
          setRecentUsers(res.data.recent_users);
          setRecentSyncs(res.data.recent_syncs);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const total = stats.total_users || 0;
  const active = stats.active_users_today || 0;
  const rate = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <div>
      {/* ── الترويسة ──
          التاريخ بارز لأن كل ما في هذه اللوحة قياس مؤرَّخ. */}
      <header className="mb-8 pb-5 border-b border-ink-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="eyebrow mb-1.5">نظرة عامة</div>
            <h1 className="text-2xl font-semibold text-ink">حالة الدراسة</h1>
          </div>
          <div className="text-left">
            <div className="font-mono text-sm text-ink-70 tabular">{today}</div>
            <div className="text-micro text-ink-30 mt-0.5">
              {loading ? 'جارِ القراءة…' : 'محدَّث الآن'}
            </div>
          </div>
        </div>
      </header>

      {/* ── خلايا القراءة ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          index={0}
          label="المشاركون"
          value={total}
          hint={total ? `${active} نشط اليوم` : 'لا مشاركين بعد'}
          icon="M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M12 3a4 4 0 100 8 4 4 0 000-8z"
        />
        <StatsCard
          index={1}
          label="نشطون اليوم"
          value={active}
          unit={total ? `/ ${total}` : ''}
          hint={total ? `معدّل المشاركة ${rate}%` : '—'}
          icon="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        />
        <StatsCard
          index={2}
          label="جلسات نوم"
          value={stats.total_sleep_records || 0}
          hint="مسجّلة ومكتملة"
          icon="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        />
        <StatsCard
          index={3}
          label="اختبارات مكتملة"
          value={stats.total_assessments_completed || 0}
          hint="إجابات مستلمة"
          icon="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
        />
      </div>

      {/* ── لوحتان ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* المشاركون الجدد */}
        <section className="panel lg:col-span-3 rise" style={{ animationDelay: '220ms' }}>
          <div className="px-5 h-12 flex items-center justify-between border-b border-ink-8">
            <span className="eyebrow">أحدث المشاركين</span>
            <button
              onClick={() => navigate('/users')}
              className="text-micro text-primary-500 hover:text-primary-600 font-mono"
            >
              عرض الكل ←
            </button>
          </div>

          {recentUsers.length === 0 ? (
            <Empty
              title={loading ? 'جارِ القراءة…' : 'لا مشاركين بعد'}
              body={loading ? '' : 'سيظهر المشاركون هنا بمجرّد تسجيلهم من التطبيق.'}
            />
          ) : (
            <ul>
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="t-row flex items-center gap-3 px-5 py-3
                             border-b border-ink-8/60 last:border-0 cursor-pointer"
                  onClick={() => navigate(`/users/${u.id}`)}
                >
                  <div className="w-9 h-9 rounded-full bg-primary-50 border border-primary-100
                                  flex items-center justify-center shrink-0">
                    <span className="text-primary-500 font-semibold text-sm">
                      {u.full_name?.trim()?.charAt(0) || '؟'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink truncate">{u.full_name}</div>
                    <div className="text-micro text-ink-30 truncate font-mono">{u.email}</div>
                  </div>
                  <svg className="w-4 h-4 text-ink-15 shrink-0" fill="none"
                       stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* سجلّ المزامنة */}
        <section className="panel lg:col-span-2 rise" style={{ animationDelay: '275ms' }}>
          <div className="px-5 h-12 flex items-center border-b border-ink-8">
            <span className="eyebrow">سجلّ المزامنة</span>
          </div>

          {recentSyncs.length === 0 ? (
            <Empty
              title={loading ? 'جارِ القراءة…' : 'لا عمليات مزامنة'}
              body={loading ? '' : 'يرفع التطبيق البيانات تلقائياً عند توفّر الإنترنت.'}
            />
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto">
              {recentSyncs.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-5 py-2.5
                             border-b border-ink-8/60 last:border-0"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      s.status === 'success' ? 'bg-signal-ok' : 'bg-signal-stop'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-ink-70 truncate">{s.full_name}</div>
                    <div className="text-micro text-ink-30 font-mono tabular">
                      {formatDate(s.synced_at)}
                    </div>
                  </div>
                  <span className="font-mono text-sm text-ink tabular shrink-0">
                    {Number(s.records_synced || 0).toLocaleString('en-US')}
                  </span>
                  <span className="text-micro text-ink-30 shrink-0">سجل</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/** حالة فارغة: دعوة للفعل أو تفسير، لا مجرّد "لا يوجد" */
function Empty({ title, body }) {
  return (
    <div className="px-5 py-12 text-center">
      <div className="text-sm text-ink-50">{title}</div>
      {body && <div className="text-micro text-ink-30 mt-1.5 max-w-xs mx-auto">{body}</div>}
    </div>
  );
}
