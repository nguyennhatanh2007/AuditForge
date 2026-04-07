import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg))',
        fg: 'hsl(var(--fg))',
        panel: 'hsl(var(--panel))',
        panelFg: 'hsl(var(--panel-fg))',
        accent: 'hsl(var(--accent))',
        accentFg: 'hsl(var(--accent-fg))',
        border: 'hsl(var(--border))',
        muted: 'hsl(var(--muted))',
        mutedFg: 'hsl(var(--muted-fg))',
        danger: 'hsl(var(--danger))',
      },
      boxShadow: {
        soft: '0 12px 50px rgba(15, 23, 42, 0.14)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
