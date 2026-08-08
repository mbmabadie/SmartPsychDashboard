import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { formatDate } from '../services/utils';

const SECTIONS = [
  { key: 'activities',  label: 'النشاط',    path: 'activities',      code: 'ACT' },
  { key: 'sleep',       label: 'النوم',     path: 'sleep',           code: 'SLP' },
  { key: 'phone',       label: 'الهاتف',    path: 'phone-usage',     code: 'PHN' },
  { key: 'categories',  label: 'التصنيفات', path: 'app-categories',  code: 'CAT' },
  { key: 'locations',   label: 'المواقع',   path: 'locations',       code: 'LOC' },
  { key: 'assessments', label: 'الاختبارات', path: 'assessments',    code: 'ASM' },
];

const fmtNum = (n) => Number(n || 0).toLocaleString('en-US');

const fmtMinutes = (m) => {
  const t = Math.round(Number(m) || 0);
  if (t < 60) return `${t} د`;
  const h = Math.floor(t / 60);
  const r = t % 60;
  return r ? `${h} س ${r} د` : `${h} س`;
};

const fmtTime = (ms) => {
  if (!ms) return '—';
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
};

const fmtDay = (ms) => {
  if (!ms) return '—';
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
};

export default function UserDetails() {
  const { id } = useParams();
  const { api } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [active, setActive] = useState('activities');

  // كل الأقسام تُحمَّل معاً عند الفتح، فالتنقّل بينها فوري بلا انتظار
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const load = async () => {
      try {
        const profile = await api(`/admin/users/${id}`);
        if (alive && profile.success) setUser(profile.data);

        const results = await Promise.allSettled(
          SECTIONS.map((s) => api(`/admin/users/${id}/${s.path}`))
        );

        if (!alive) return;
        const next = {};
        results.forEach((r, i) => {
          next[SECTIONS[i].key] =
            r.status === 'fulfilled' && r.value?.success ? (r.value.data || []) : [];
        });
        setData(next);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => { alive = false; };
  }, [id]);

  const generatePassword = () => {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const rnd = new Uint32Array(12);
    crypto.getRandomValues(rnd);
    let out = '';
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
          ? { ok: true, text: 'تم التعيين. أوصل كلمة المرور للمستخدم بطريقة آمنة.' }
          : { ok: false, text: res.message || 'تعذّر التعيين' }
      );
    } catch (e) {
      setResetMsg({ ok: false, text: 'تعذّر الاتصال بالخادم' });
    }
    setResetting(false);
  };

  const toggleUser = async () => {
    const res = await api(`/admin/users/${id}/toggle`, { method: 'PUT' });
    if (res.success) {
      const r = await api(`/admin/users/${id}`);
      if (r.success) setUser(r.data);
    }
  };

  // ملخص سريع من البيانات المحمَّلة
  const summary = useMemo(() => {
    const acts = data.activities || [];
    const sleeps = data.sleep || [];
    const phone = data.phone || [];

    const steps = acts.reduce((s, a) => s + Number(a.total_steps || 0), 0);
    const avgSteps = acts.length ? Math.round(steps / acts.length) : 0;

    const hours = sleeps.reduce((s, x) => s + Number(x.duration || 0), 0) / 3600000;
    const avgSleep = sleeps.length ? hours / sleeps.length : 0;

    const mins = phone.reduce((s, p) => s + Number(p.total_usage_minutes || 0), 0);

    return {
      avgSteps,
      avgSleep,
      phoneMins: mins,
      assessments: (data.assessments || []).length,
    };
  }, [data]);

  const counts = SECTIONS.reduce((acc, s) => {
    acc[s.key] = (data[s.key] || []).length;
    return acc;
  }, {});

  return (
    <div>
      <button
        onClick={() => navigate('/users')}
        className="text-micro text-ink-50 hover:text-ink font-mono mb-4
                   inline-flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        المشاركون
      </button>

      {/* ── الهوية ── */}
      <section className="panel p-5 mb-4 rise">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-full bg-primary-50 border border-primary-100
                            flex items-center justify-center shrink-0">
              <span className="text-primary-500 text-xl font-semibold">
                {user?.full_name?.trim()?.charAt(0) || '؟'}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-ink truncate">
                {user?.full_name || (loading ? '…' : 'مستخدم')}
              </h1>
              <div className="font-mono text-micro text-ink-50 truncate">
                {user?.email || ''}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`badge ${user?.is_active ? 'badge-ok' : 'badge-mute'}`}>
                  {user?.is_active ? 'نشط' : 'معطّل'}
                </span>
                {user?.age ? <span className="badge badge-mute">{user.age} سنة</span> : null}
                {user?.gender ? <span className="badge badge-mute">{user.gender}</span> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setShowReset(!showReset); setResetMsg(null); }}
              className="btn-quiet"
            >
              كلمة المرور
            </button>
            <button
              onClick={toggleUser}
              className={user?.is_active ? 'btn-danger' : 'btn-quiet'}
            >
              {user?.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}
            </button>
          </div>
        </div>

        {showReset && (
          <div className="mt-4 pt-4 border-t border-ink-8">
            <div className="text-sm font-medium text-ink mb-1">تعيين كلمة مرور جديدة</div>
            <p className="text-micro text-ink-50 mb-3">
              لا يوجد نظام بريد، فالاستعادة تتم من هنا. أوصل كلمة المرور
              للمستخدم بطريقة آمنة واطلب منه تغييرها من التطبيق.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                dir="ltr"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setResetMsg(null); }}
                placeholder="8 أحرف على الأقل"
                className="field font-mono flex-1"
              />
              <button onClick={generatePassword} className="btn-quiet">توليد</button>
              <button onClick={resetPassword} disabled={resetting} className="btn-primary">
                {resetting ? 'جارٍ…' : 'تعيين'}
              </button>
            </div>
            {resetMsg && (
              <div className={`mt-3 text-sm px-3 py-2 rounded-md border ${
                resetMsg.ok
                  ? 'bg-signal-ok/8 text-signal-ok border-signal-ok/20'
                  : 'bg-signal-stop/8 text-signal-stop border-signal-stop/20'
              }`}>
                {resetMsg.text}
                {resetMsg.ok && (
                  <div className="mt-2 font-mono text-sm bg-panel px-2 py-1 rounded
                                  border border-ink-8 select-all" dir="ltr">
                    {newPassword}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── ملخص ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Mini label="متوسط الخطوات" value={fmtNum(summary.avgSteps)} hint="يومياً" i={0} />
        <Mini label="متوسط النوم" value={summary.avgSleep.toFixed(1)} unit="ساعة" i={1} />
        <Mini label="استخدام الهاتف" value={fmtMinutes(summary.phoneMins)} i={2} />
        <Mini label="اختبارات" value={fmtNum(summary.assessments)} hint="مكتملة" i={3} />
      </div>

      {/* ── الأقسام ── */}
      <div className="overflow-x-auto pb-1 mb-3 -mx-1 px-1">
        <div className="seg">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              data-on={active === s.key}
              onClick={() => setActive(s.key)}
              className="seg-item"
            >
              {s.label}
              <span className="seg-count">{loading ? '·' : counts[s.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="panel overflow-hidden rise" style={{ animationDelay: '120ms' }}>
        {loading ? (
          <Skeleton />
        ) : (
          <div className="scroll-y" style={{ maxHeight: '32rem' }}>
            <Section name={active} rows={data[active] || []} />
          </div>
        )}
      </section>
    </div>
  );
}

function Mini({ label, value, unit, hint, i = 0 }) {
  return (
    <div className="panel p-4 rise" style={{ animationDelay: `${i * 50}ms` }}>
      <div className="eyebrow">{label}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-medium text-ink tabular">{value}</span>
        {unit && <span className="text-micro text-ink-30 font-mono">{unit}</span>}
      </div>
      {hint && <div className="text-micro text-ink-30 mt-1">{hint}</div>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-5 space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skel h-3 w-24" />
          <div className="skel h-3 flex-1" />
          <div className="skel h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="px-5 py-16 text-center">
      <div className="text-sm text-ink-50">{text}</div>
      <div className="text-micro text-ink-30 mt-1.5">
        تظهر البيانات هنا بعد أن يزامنها التطبيق.
      </div>
    </div>
  );
}

function Section({ name, rows }) {
  if (!rows.length) {
    const labels = {
      activities: 'لا سجلات نشاط',
      sleep: 'لا جلسات نوم',
      phone: 'لا بيانات استخدام',
      categories: 'لا تصنيفات',
      locations: 'لا زيارات مسجّلة',
      assessments: 'لا اختبارات مكتملة',
    };
    return <Empty text={labels[name] || 'لا بيانات'} />;
  }

  if (name === 'activities') {
    const max = Math.max(...rows.map((r) => Number(r.total_steps || 0)), 1);
    return (
      <ul>
        {rows.map((r, i) => (
          <li key={i} className="drow">
            <span className="font-mono text-micro text-ink-50 w-20 shrink-0 tabular">
              {r.date}
            </span>
            <div className="flex-1 min-w-0">
              <div className="meter">
                <i style={{ width: `${(Number(r.total_steps || 0) / max) * 100}%` }} />
              </div>
              <div className="text-micro text-ink-30 mt-1.5">
                {Number(r.total_distance || 0).toFixed(2)} كم ·{' '}
                {fmtNum(Math.round(r.total_calories))} سعرة ·{' '}
                {fmtNum(r.active_minutes)} د نشاط
              </div>
            </div>
            <span className="dnum w-16 text-left">{fmtNum(r.total_steps)}</span>
            <span className="text-micro text-ink-30 shrink-0">خطوة</span>
          </li>
        ))}
      </ul>
    );
  }

  if (name === 'sleep') {
    return (
      <ul>
        {rows.map((r, i) => {
          const hrs = Number(r.duration || 0) / 3600000;
          const q = Number(r.quality_score || 0);
          return (
            <li key={i} className="drow">
              <span className="font-mono text-micro text-ink-50 w-16 shrink-0">
                {fmtDay(r.start_time)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm text-ink-70 tabular">
                  {fmtTime(r.start_time)} ← {fmtTime(r.end_time)}
                </div>
                {q > 0 && (
                  <div className="text-micro text-ink-30 mt-0.5">جودة {Math.round(q)}%</div>
                )}
              </div>
              <span className={`dnum ${hrs >= 7 ? 'text-signal-ok' : hrs >= 5 ? 'text-signal-warn' : 'text-signal-stop'}`}>
                {hrs.toFixed(1)}
              </span>
              <span className="text-micro text-ink-30 shrink-0">ساعة</span>
            </li>
          );
        })}
      </ul>
    );
  }

  if (name === 'phone') {
    const max = Math.max(...rows.map((r) => Number(r.total_usage_minutes || 0)), 1);
    return (
      <ul>
        {rows.map((r, i) => (
          <li key={i} className="drow">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink truncate">{r.app_name}</span>
                {r.category && <span className="badge badge-mute">{r.category}</span>}
              </div>
              <div className="meter mt-1.5">
                <i style={{ width: `${(Number(r.total_usage_minutes || 0) / max) * 100}%` }} />
              </div>
              <div className="text-micro text-ink-30 mt-1 font-mono">
                {r.date} · {fmtNum(r.open_count)} فتحة
              </div>
            </div>
            <span className="dnum w-16 text-left">{fmtMinutes(r.total_usage_minutes)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (name === 'categories') {
    const max = Math.max(...rows.map((r) => Number(r.total_minutes || 0)), 1);
    return (
      <ul>
        {rows.map((r, i) => (
          <li key={i} className="drow">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-ink">{r.category}</span>
                <span className="text-micro text-ink-30 font-mono tabular">
                  {r.percentage}% · {r.apps_count} تطبيق
                </span>
              </div>
              <div className="meter mt-1.5">
                <i style={{ width: `${(Number(r.total_minutes || 0) / max) * 100}%` }} />
              </div>
            </div>
            <span className="dnum w-16 text-left">{fmtMinutes(r.total_minutes)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (name === 'locations') {
    return (
      <ul>
        {rows.map((r, i) => (
          <li key={i} className="drow">
            <span className="font-mono text-micro text-ink-50 w-16 shrink-0">
              {fmtDay(r.arrival_time)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink truncate">
                  {r.place_name || 'مكان غير مسمّى'}
                </span>
                {r.is_home ? <span className="badge badge-ok">المنزل</span> : null}
                {r.is_work ? <span className="badge badge-warn">العمل</span> : null}
              </div>
              <div className="text-micro text-ink-30 mt-0.5 font-mono tabular">
                {fmtTime(r.arrival_time)}
                {r.departure_time ? ` ← ${fmtTime(r.departure_time)}` : ' · مستمرة'}
              </div>
            </div>
            {r.duration ? (
              <span className="dnum">{fmtMinutes(Number(r.duration) / 60000)}</span>
            ) : null}
          </li>
        ))}
      </ul>
    );
  }

  if (name === 'assessments') {
    return (
      <ul>
        {rows.map((r, i) => {
          const pct = r.max_possible_score
            ? Math.round((Number(r.total_score) / Number(r.max_possible_score)) * 100)
            : null;
          const tone = pct === null ? 'text-ink'
            : pct >= 75 ? 'text-signal-ok'
            : pct >= 50 ? 'text-signal-warn'
            : 'text-signal-stop';
          return (
            <li key={i} className="drow">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink truncate">
                  {r.title_ar || r.title}
                </div>
                <div className="text-micro text-ink-30 mt-0.5 font-mono">
                  {formatDate(r.completed_at)}
                  {r.responses?.length ? ` · ${r.responses.length} إجابة` : ''}
                </div>
              </div>
              <div className="text-left shrink-0">
                <div className={`font-mono text-lg font-medium tabular ${tone}`}>
                  {pct !== null ? `${pct}%` : fmtNum(r.total_score)}
                </div>
                <div className="text-micro text-ink-30 font-mono tabular">
                  {fmtNum(r.total_score)} / {fmtNum(r.max_possible_score)}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return <Empty text="لا بيانات" />;
}
