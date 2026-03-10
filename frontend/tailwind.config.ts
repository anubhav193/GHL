import type { Config } from 'tailwindcss';

// Tailwind theme derived from design.json (Valora Dashboard Theme).
// Dark mode is intentionally not configured; only a light theme is supported.
const config: Config = {
  content: ['./index.html', './src/**/*.{vue,ts,tsx,js,jsx}'],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Google Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace',
        ],
      },
      colors: {
        // Text
        'text-primary': '#101827',
        'text-secondary': '#4B5563',
        'text-muted': '#6B7280',
        'text-subtle': '#9CA3AF',
        'text-on-primary': '#FFFFFF',
        'text-on-accent': '#FFFFFF',
        'text-on-soft': '#111827',

        // Backgrounds
        'bg-page': '#F3F4F6',
        'bg-surface': '#FFFFFF',
        'bg-surface-subtle': '#F9FAFB',
        'bg-surface-elevated': '#FFFFFF',
        'bg-sidebar': '#FFFFFF',
        'bg-sidebar-rail': '#F3F4F6',

        // Borders
        'border-subtle': '#E5E7EB',
        'border-medium': '#D1D5DB',
        'border-strong': '#9CA3AF',
        'border-divider': '#E5E7EB',

        // Brand
        primary: '#2563EB',
        'primary-soft': '#EEF2FF',
        'primary-strong': '#1D4ED8',
        accent: '#6366F1',

        // State
        success: '#16A34A',
        'success-soft': '#DCFCE7',
        warning: '#F59E0B',
        'warning-soft': '#FEF3C7',
        danger: '#DC2626',
        'danger-soft': '#FEE2E2',
        info: '#0EA5E9',
        'info-soft': '#E0F2FE',

        // Charts
        'chart-blue': '#2563EB',
        'chart-green': '#22C55E',
        'chart-orange': '#F97316',
        'chart-red': '#EF4444',
        'chart-muted': '#E5E7EB',
        'chart-gauge-neutral': '#E5E7EB',
      },
      spacing: {
        // Spacing scale based on 4px unit from design.json
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '40px',
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        pill: '999px',
      },
      boxShadow: {
        none: 'none',
        card: '0 10px 25px rgba(15, 23, 42, 0.04)',
        popover: '0 18px 40px rgba(15, 23, 42, 0.10)',
        'focus-raised':
          '0 0 0 1px rgba(37, 99, 235, 0.65), 0 10px 25px rgba(15, 23, 42, 0.08)',
      },
      maxWidth: {
        'page-content': '1440px',
      },
    },
  },
  plugins: [],
};

export default config;

