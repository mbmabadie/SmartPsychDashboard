import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../App';
import Logo from './Logo';

// الترتيب يتبع رحلة الباحث: من العام إلى الفرد إلى الأداة إلى المخرجات
const navItems = [
  { to: '/',            label: 'نظرة عامة',  code: 'OVR', icon: 'M4 5h6v6H4zM14 5h6v4h-6zM14 13h6v6h-6zM4 15h6v4H4z' },
  { to: '/users',       label: 'المشاركون',  code: 'PPL', icon: 'M16 19v-1a4 4 0 00-4-4H8a4 4 0 00-4 4v1M12 3a4 4 0 100 8 4 4 0 000-8zM17 11a3 3 0 100-6M20 19v-1a4 4 0 00-3-3.87' },
  { to: '/assessments', label: 'الاختبارات', code: 'ASM', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-6 4h6' },
  { to: '/stats',       label: 'الإحصائيات', code: 'STA', icon: 'M18 20V10M12 20V4M6 20v-6' },
  { to: '/export',      label: 'التصدير',    code: 'EXP', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
];

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth();

  const handleNavClick = () => {
    if (window.innerWidth < 768 && onClose) onClose();
  };

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-30"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 w-60 bg-panel border-l border-ink-8
          flex flex-col z-40 transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}
      >
        {/* ── الهوية ── */}
        <div className="px-5 h-16 flex items-center justify-between border-b border-ink-8">
          <div className="flex items-center gap-3">
            <Logo size={30} className="text-primary-400 shrink-0" />
            <div className="leading-tight">
              <div className="font-semibold text-ink text-[15px]">Smart Psych</div>
              <div className="text-micro text-ink-50 font-mono">لوحة الإدارة</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-ink-50 hover:text-ink p-1 -m-1"
            aria-label="إغلاق القائمة"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── التنقّل ──
            كل عنصر يحمل رمزاً من ثلاثة أحرف: يعطي إيقاعاً بصرياً
            ثابتاً ويجعل الشريط يُقرأ كفهرس أداة، لا كقائمة تطبيق. */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 h-11 px-5 text-sm transition-colors
                 ${isActive
                   ? 'text-primary-500 font-medium bg-primary-50/60'
                   : 'text-ink-70 hover:text-ink hover:bg-ink-8/40'}`
              }
            >
              {({ isActive }) => (
                <>
                  {/* مؤشر نشط: شريط رفيع على الحافة، لا خلفية صاخبة */}
                  <span
                    className={`absolute right-0 inset-y-1.5 w-[3px] rounded-l
                      ${isActive ? 'bg-primary-400' : 'bg-transparent'}`}
                  />
                  <svg
                    className="w-[18px] h-[18px] shrink-0"
                    fill="none" stroke="currentColor" strokeWidth="1.6"
                    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
                  >
                    <path d={item.icon} />
                  </svg>
                  <span className="flex-1">{item.label}</span>
                  <span
                    className={`font-mono text-[10px] tracking-wider
                      ${isActive ? 'text-primary-300' : 'text-ink-15 group-hover:text-ink-30'}`}
                  >
                    {item.code}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── الحساب ── */}
        <div className="border-t border-ink-8 p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100
                            flex items-center justify-center shrink-0">
              <span className="text-primary-500 text-sm font-semibold">
                {user?.full_name?.trim()?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-ink truncate">
                {user?.full_name || 'مشرف'}
              </div>
              <div className="text-micro text-ink-30 truncate font-mono">
                {user?.email || ''}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full mt-1 flex items-center gap-2.5 px-2 h-9 rounded-md
                       text-sm text-ink-50 hover:text-signal-stop hover:bg-signal-stop/5
                       transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
