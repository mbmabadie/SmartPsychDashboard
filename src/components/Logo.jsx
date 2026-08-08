import React from 'react';

/**
 * علامة Smart Psych — نفس المرسومة في التطبيق
 * (lib/shared/widgets/smart_psych_logo.dart)
 *
 * ظل جانبي لرأس + شبكة عصبية من 5 عُقد و6 وصلات.
 *
 * 📌 لو أردتم استخدام ملف أيقونة التطبيق الحقيقي بدلاً من المرسوم:
 *    1. انسخوا  assets/images/app_icon.png  إلى  dashboard/public/app-icon.png
 *    2. بدّلوا هذا المكوّن بـ:
 *         <img src="/app-icon.png" className="..." alt="Smart Psych" />
 *
 *    خليته مكوّناً مستقلاً لهذا السبب — التبديل في مكان واحد.
 */
export default function Logo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Smart Psych"
    >
      <circle cx="50" cy="50" r="50" fill="currentColor" />
      <g
        fill="none"
        stroke="#fff"
        strokeWidth="4.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* ظل الرأس */}
        <path d="M66 26 C52 18 33 24 28 40 C25 49 26 54 23 59 C21 62 24 64 28 64 C29 71 33 76 42 78 L42 86" />
        <path d="M42 86 L70 86" />
        {/* قوس النبض */}
        <path
          d="M50 12 A38 38 0 0 1 84 42"
          strokeOpacity="0.3"
          strokeWidth="2.6"
        />
        {/* الوصلات */}
        <g strokeOpacity="0.55" strokeWidth="2.4">
          <line x1="45" y1="36" x2="60" y2="44" />
          <line x1="45" y1="36" x2="42" y2="51" />
          <line x1="60" y1="44" x2="58" y2="60" />
          <line x1="42" y1="51" x2="58" y2="60" />
          <line x1="42" y1="51" x2="38" y2="64" />
          <line x1="58" y1="60" x2="38" y2="64" />
        </g>
        {/* العُقد */}
        <g fill="#fff" stroke="none">
          <circle cx="45" cy="36" r="3.8" />
          <circle cx="60" cy="44" r="5.2" />
          <circle cx="42" cy="51" r="5.2" />
          <circle cx="58" cy="60" r="3.8" />
          <circle cx="38" cy="64" r="3.8" />
        </g>
      </g>
    </svg>
  );
}
