import React, { useEffect, useRef, useState } from 'react';

/**
 * خلية القراءة — العنصر المميّز في اللوحة
 *
 * الفكرة: كل رقم هنا هو قياس (مشاركون، جلسات نوم، دقائق استخدام).
 * فيُعرض كما يُعرض في جهاز قياس: أرقام أحادية العرض (tabular) على
 * خط أساس رفيع، بعلامة لكنة صغيرة عند طرفه.
 *
 * الأرقام أحادية العرض تعني أن الخانات تتحاذى رأسياً عبر الشبكة
 * كلها — الشيء الذي يجعل لوحة قياس تُقرأ كلوحة قياس.
 */
export default function StatsCard({
  label,
  value,
  unit,
  hint,
  icon,
  index = 0,
}) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const prev = useRef(target);

  // عدّاد تصاعدي هادئ — يوحي بأن القيمة قُرئت للتو
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce || target === prev.current) {
      setShown(target);
      prev.current = target;
      return;
    }

    const from = prev.current;
    prev.current = target;
    const dur = 520;
    const t0 = performance.now();
    let raf;

    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div
      className="panel p-5 rise"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="eyebrow">{label}</span>
        {icon && (
          <svg
            className="w-4 h-4 text-ink-30 shrink-0 mt-0.5"
            fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
          >
            <path d={icon} />
          </svg>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="readout-value">{shown.toLocaleString('en-US')}</span>
        {unit && <span className="text-sm text-ink-30 font-mono">{unit}</span>}
      </div>

      <div className="readout-rule" />

      {hint && <div className="mt-2.5 text-micro text-ink-50">{hint}</div>}
    </div>
  );
}
