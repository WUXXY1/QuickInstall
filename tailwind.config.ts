import type { Config } from 'tailwindcss';

const config: Config = {
  // ── Paths que o Tailwind deve escanear para purge de classes não usadas
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',   // compatibilidade com Pages Router se necessário
  ],

  // Força o dark mode via classe 'dark' no <html> (controlado pelo layout.tsx)
  // Isso evita flashes e é necessário para SSR correto com Next.js
  darkMode: 'class',

  theme: {
    extend: {
      // ── Paleta de cores do tema "Terminal Dark"
      // Todos os valores são variáveis CSS para consistência total
      colors: {
        terminal: {
          // Fundos em camadas — do mais escuro ao mais claro
          bg:      '#0a0c0a',   // fundo raiz da página
          panel:   '#0f120f',   // painéis e cards
          surface: '#131713',   // superfícies secundárias
          raised:  '#1a1f1a',   // elementos elevados (hover states)

          // Verdes do terminal — hierarchy de brilho
          green:   '#00e57a',   // cor principal (texto, ícones ativos)
          bright:  '#00ff8a',   // destaque máximo (logo, cursor)
          muted:   '#00b85e',   // verde médio (bordas ativas, prompts)
          dark:    '#004d29',   // verde muito escuro (bg de badges, switches on)
          faint:   '#1e2a1e',   // verde quase invisível (bordas padrão)

          // Cores de suporte
          dim:     '#888888',   // texto desabilitado / placeholder
          border:  '#1e2a1e',   // borda padrão dos painéis
          border2: '#2a3d2a',   // borda hover

          // Semânticas
          error:   '#ff4d4d',
          warn:    '#f5a623',
          info:    '#6ba3ff',
        },
      },

      // ── Família de fontes mapeada às variáveis CSS do next/font
      fontFamily: {
        mono:    ['var(--font-mono)',    'JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['var(--font-display)', 'Syne',           'system-ui', 'sans-serif'],
        sans:    ['var(--font-mono)',    'JetBrains Mono', 'monospace'], // app é todo mono
      },

      // ── Tamanhos de fonte customizados para hierarquia legível em terminal
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        xs:    ['11px', { lineHeight: '1.5' }],
        sm:    ['12px', { lineHeight: '1.5' }],
        base:  ['13px', { lineHeight: '1.6' }],
        md:    ['14px', { lineHeight: '1.6' }],
        lg:    ['16px', { lineHeight: '1.5' }],
        xl:    ['20px', { lineHeight: '1.3' }],
        '2xl': ['26px', { lineHeight: '1.2' }],
      },

      // ── Border radius: cantos levemente arredondados, feel mais industrial
      borderRadius: {
        none: '0',
        sm:   '3px',
        DEFAULT: '4px',
        md:   '6px',
        lg:   '8px',
        xl:   '12px',
        full: '9999px',
      },

      // ── Espaçamento extra para layouts de painel
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
      },

      // ── Sombras inspiradas em terminais (outline glow sutil)
      boxShadow: {
        // Glow verde muito suave para elementos focados
        'glow-sm': '0 0 8px rgba(0, 229, 122, 0.15)',
        'glow':    '0 0 16px rgba(0, 229, 122, 0.20)',
        'glow-lg': '0 0 32px rgba(0, 229, 122, 0.25)',
        // Inset para estados hover de drop zones
        'inset-glow': 'inset 0 0 20px rgba(0, 229, 122, 0.04)',
        // Focus ring acessível
        'focus':   '0 0 0 2px rgba(0, 229, 122, 0.40)',
        none: 'none',
      },

      // ── Transições padrão (rápidas para feel de terminal)
      transitionDuration: {
        fast:    '100ms',
        DEFAULT: '150ms',
        slow:    '250ms',
      },

      // ── Animações customizadas
      keyframes: {
        // Cursor piscando (para efeito de prompt ativo)
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
        // Aparecer de baixo para cima (entrada de painéis)
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        // Progress bar indeterminado (loading de upload)
        'progress-indeterminate': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        // Fade in simples
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        // Typewriter cursor
        'cursor-blink': {
          '0%, 49%':   { borderColor: 'transparent' },
          '50%, 100%': { borderColor: '#00e57a' },
        },
      },
      animation: {
        blink:       'blink 1s step-end infinite',
        'slide-up':  'slide-up 0.2s ease-out both',
        'fade-in':   'fade-in 0.15s ease-out both',
        progress:    'progress-indeterminate 1.2s ease-in-out infinite',
        cursor:      'cursor-blink 1s step-end infinite',
      },

      // ── Largura máxima do container principal
      maxWidth: {
        app: '720px',
      },

      // ── Opacidade extras para os estados de overlay de scanlines
      opacity: {
        2:  '0.02',
        3:  '0.03',
        15: '0.15',
        35: '0.35',
        85: '0.85',
      },

      // ── Typography plugin config (prose para eventual documentação)
      typography: {
        terminal: {
          css: {
            '--tw-prose-body':       '#888888',
            '--tw-prose-headings':   '#00e57a',
            '--tw-prose-code':       '#00ff8a',
            '--tw-prose-pre-code':   '#00e57a',
            '--tw-prose-pre-bg':     '#0f120f',
            '--tw-prose-links':      '#6ba3ff',
            '--tw-prose-bold':       '#00e57a',
            maxWidth: 'none',
            fontFamily: 'var(--font-mono)',
          },
        },
      },
    },
  },

  plugins: [
    // ── Plugin utilitário: adiciona variante 'group-data-*' para toggles
    // Não requer instalação extra no Next.js 14 com Tailwind 3.4+
    require('@tailwindcss/typography'),
  ],
};

export default config;
