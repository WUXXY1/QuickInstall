import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        terminal: {
          bg:      '#0a0c0a',
          panel:   '#0f120f',
          surface: '#131713',
          raised:  '#1a1f1a',
          green:   '#00e57a',
          bright:  '#00ff8a',
          muted:   '#00b85e',
          dark:    '#004d29',
          faint:   '#1e2a1e',
          dim:     '#888888',
          border:  '#1e2a1e',
          border2: '#2a3d2a',
          error:   '#ff4d4d',
          warn:    '#f5a623',
          info:    '#6ba3ff',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  // Removido @tailwindcss/typography — requer instalação separada
  plugins: [],
};

export default config;
