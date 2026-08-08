/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── الحبر: أزرق-رمادي عميق بدل gray-800 المحايد ──
        ink: {
          DEFAULT: '#0E1F2A',
          70: '#3C5462',
          50: '#64798A',
          30: '#98A9B5',
          15: '#C9D3DA',
          8:  '#E2E9ED',
        },
        // ── السطح: ورق بارد، لا أبيض ناصع ──
        paper: '#F5F8FA',
        panel: '#FFFFFF',
        // ── اللكنة: نفس أزرق التطبيق ──
        primary: {
          50:'#E8F5FB', 100:'#C7E8F5', 200:'#95D3EC', 300:'#5CBAE0',
          400:'#28A1D1', 500:'#1189B7', 600:'#0E7096', 700:'#0B5674',
          800:'#083D53', 900:'#052836',
        },
        // ── إعادة تعريف رمادي Tailwind على سلّم الحبر ──
        //
        // الصفحات الأخرى (المستخدمون، الاختبارات، الإحصائيات…) مكتوبة
        // بـ gray-400/500/800 و shadow-sm و rounded-xl. بدل إعادة
        // كتابتها كلها — وهو ما كان سيخاطر بوظائف بُنيت في إصلاح #7 —
        // نعيد تعريف هذه الرموز نفسها. فتتبنّى كل الصفحات لغة التصميم
        // الجديدة دون تعديل سطر واحد في JSX.
        gray: {
          50:'#F5F8FA', 100:'#E2E9ED', 200:'#C9D3DA', 300:'#98A9B5',
          400:'#98A9B5', 500:'#64798A', 600:'#3C5462', 700:'#243B48',
          800:'#0E1F2A', 900:'#08151D',
        },

        // ── إشارات الحالة ──
        signal: {
          ok:   '#1E9E6A',
          warn: '#C77B1E',
          stop: '#C4433E',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"IBM Plex Sans Arabic"', 'monospace'],
      },
      fontSize: {
        // مقياس ضيق ومقصود
        micro: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.06em' }],
        read:  ['2.25rem',   { lineHeight: '1',    letterSpacing: '-0.02em' }],
        readLg:['3rem',      { lineHeight: '1',    letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        panel: '10px',
        // rounded-xl/2xl المستخدمة في الصفحات الأخرى تُشدّ إلى نفس النصف قطر
        xl: '10px',
        '2xl': '12px',
      },
      // ── بلا ظلال ──
      // أجهزة القياس لا ترمي ظلالاً. الظلال المستخدمة في الصفحات
      // الأخرى تُستبدل بخط شعري، فيبقى الفصل البصري بلا ضبابية.
      boxShadow: {
        none: 'none',
        sm: '0 0 0 1px #E2E9ED',
        DEFAULT: '0 0 0 1px #E2E9ED',
        md: '0 0 0 1px #E2E9ED',
        lg: '0 0 0 1px #C9D3DA',
        xl: '0 0 0 1px #C9D3DA',
      },
    },
  },
  plugins: [],
};
