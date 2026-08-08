import React, { useState } from 'react';
import { useAuth } from '../App';
import Logo from '../components/Logo';

export default function Login() {
  const { login, apiUrl } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.data.user.role === 'admin') {
        // ✅ نمرّر بيانات المشرف كذلك — كانت تُهمَل، فبقي الشريط
        //    الجانبي بلا اسم ولا بريد.
        login(data.data.token, data.data.user);
      } else if (data.success) {
        setError('هذا الحساب لا يملك صلاحية إدارة');
      } else {
        setError(data.message || 'تعذّر الدخول. تحقّق من البريد وكلمة المرور.');
      }
    } catch {
      setError('تعذّر الوصول إلى الخادم. تحقّق من اتصالك ثم أعد المحاولة.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      {/* شبكة خفيفة في الخلفية — إيحاء بورق القياس، بلا صخب */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.55]"
        style={{
          backgroundImage:
            'linear-gradient(#E2E9ED 1px, transparent 1px), linear-gradient(90deg, #E2E9ED 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 72%)',
        }}
      />

      <div className="relative w-full max-w-[380px] rise">
        {/* الهوية */}
        <div className="flex flex-col items-center mb-7">
          <Logo size={54} className="text-primary-400" />
          <h1 className="mt-4 text-xl font-semibold text-ink">Smart Psych</h1>
          <p className="text-micro text-ink-50 font-mono mt-1">لوحة الإدارة</p>
        </div>

        <div className="panel p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                dir="ltr"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field font-mono"
              />
            </div>

            <div>
              <label className="label" htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field"
              />
            </div>

            {error && (
              <div className="flex gap-2 px-3 py-2.5 rounded-md bg-signal-stop/8
                              border border-signal-stop/20">
                <svg className="w-4 h-4 text-signal-stop shrink-0 mt-0.5" fill="none"
                     stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path strokeLinecap="round" d="M12 8v5M12 16h.01" />
                </svg>
                <span className="text-sm text-signal-stop leading-snug">{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full h-10">
              {loading ? 'جارِ الدخول…' : 'دخول'}
            </button>
          </form>
        </div>

        {/* ⚠️ أُزيل "إعدادات السيرفر" — عنوان الخادم بنية تحتية،
            ولا يُعرض ولا يُعدّل من واجهة الدخول. */}
        <p className="text-center text-micro text-ink-30 mt-5">
          الدخول للمشرفين المصرّح لهم فقط
        </p>
      </div>
    </div>
  );
}
