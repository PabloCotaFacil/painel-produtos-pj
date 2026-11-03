import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Header from '@/components/Header';
import NavigationProgressBar from '@/components/NavigationProgressBar';

export const metadata: Metadata = {
  title: 'Painel Operacional PJ | CotaFácil',
  description: 'Portal de conhecimento, regras de crédito PJ, esteiras operacionais bancárias e materiais de treinamento.',
  icons: {
    icon: '/painel-icon.png',
    shortcut: '/painel-icon.png',
    apple: '/painel-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preconnect para carregamento instantâneo de vídeos Vimeo e YouTube */}
        <link rel="preconnect" href="https://player.vimeo.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://i.vimeocdn.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://f.vimeocdn.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vod-progressive.akamaized.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vumbnail.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.youtube.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
        <link rel="dns-prefetch" href="https://i.vimeocdn.com" />
        <link rel="dns-prefetch" href="https://f.vimeocdn.com" />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col justify-between transition-colors">
        <Suspense fallback={null}>
          <NavigationProgressBar />
        </Suspense>
        <div>
          <Header />
          <main className="max-w-[1440px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>
        </div>

        {/* Footer */}
        <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-extrabold text-white text-sm">CotaFácil — Painel Operacional PJ</p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Plataforma de regras de crédito PJ, manuais operacionais e esteiras de produtos empresariais.
              </p>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
              © {new Date().getFullYear()} CotaFácil Soluções Financeiras. Todos os direitos reservados.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
