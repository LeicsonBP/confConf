import type { Metadata } from "next";
import Link from "next/link";
import { Alfa_Slab_One, IBM_Plex_Mono, Spline_Sans } from "next/font/google";
import "./globals.css";

const display = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Spline_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "confConf",
    template: "%s · confConf",
  },
  description: "Organize confraternizações e amigos secretos sem dor de cabeça.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border-2 focus:border-ink focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Pular para o conteúdo
        </a>
        <div id="conteudo" tabIndex={-1}>
          {children}
        </div>
        <footer className="border-t-2 border-ink bg-paper-2 px-6 py-4 text-center text-xs text-ink-soft print:hidden">
          <Link href="/privacidade" className="underline decoration-2 underline-offset-4">
            Privacidade e dados
          </Link>
          <span aria-hidden="true"> · </span>
          confConf
        </footer>
      </body>
    </html>
  );
}
