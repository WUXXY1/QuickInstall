import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Syne } from 'next/font/google';
import './globals.css';

// ── Tipografia principal: monospace para o feel de terminal
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '700'],
  display: 'swap',
});

// ── Display font para o logotipo e headings
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '700', '800'],
  display: 'swap',
});

// ── Metadados do site (SEO + PWA)
export const metadata: Metadata = {
  title: {
    default: 'QuickInstall — Upload · Host · Install',
    template: '%s | QuickInstall',
  },
  description:
    'Hospede pacotes .deb e .tar.gz na nuvem e gere comandos curl | bash para instalação local sem sudo.',
  keywords: [
    'install without sudo',
    'deb installer',
    'curl bash install',
    'local bin installer',
    'linux package host',
  ],
  authors: [{ name: 'QuickInstall' }],
  // Open Graph — compartilhamento em redes sociais
  openGraph: {
    title: 'QuickInstall',
    description: 'Upload, hospede e instale pacotes Linux sem root.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'QuickInstall',
  },
  // Twitter Card
  twitter: {
    card: 'summary',
    title: 'QuickInstall',
    description: 'Upload · Host · Install · sem sudo',
  },
  // Ícone minimalista inline (evita arquivo extra para projetos simples)
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%230a0c0a'/><text y='24' x='4' font-size='22'>📦</text></svg>",
  },
  // Impede indexação de URLs de upload temporário
  robots: {
    index: true,
    follow: false,
  },
};

// ── Viewport separado do metadata (Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0c0a', // barra do browser no mobile = cor do tema dark
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      // Força dark mode no nível do HTML; evita flash de tema claro
      className={`dark ${jetbrainsMono.variable} ${syne.variable}`}
    >
      <head>
        {/*
          Preconnect para as fontes do Google reduz latência de ~300ms.
          Next/font já lida com isso automaticamente, mas deixamos explícito
          para o caso de SSR com cache frio.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`
          bg-terminal-bg text-terminal-green
          font-mono antialiased
          min-h-screen
          selection:bg-terminal-green/20 selection:text-terminal-bright
        `}
      >
        {/*
          Efeito de scanlines sutil — camada decorativa puramente CSS,
          sem impacto de acessibilidade (aria-hidden).
          O pseudo-elemento ::before no globals.css cuida disso.
        */}
        <div aria-hidden="true" className="scanlines" />

        {/* Container principal com largura máxima centralizada */}
        <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 md:px-6">
          {children}
        </div>

        {/* Rodapé discreto */}
        <footer className="relative z-10 border-t border-terminal-border mt-12 py-4 text-center">
          <p className="text-xs text-terminal-dim font-mono">
            <span className="text-terminal-green/50">~/</span>
            {' '}QuickInstall · arquivos expiram em 1h ·{' '}
            <a
              href="https://litterbox.catbox.moe"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-terminal-green transition-colors"
            >
              powered by litterbox.moe
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
