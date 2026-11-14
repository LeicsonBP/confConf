import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Alfa_Slab_One, IBM_Plex_Mono, Spline_Sans } from "next/font/google";
import { IconTicket } from "@/design-system/icons";
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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "confConf",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4ecdc",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border-2 focus:border-ink focus:bg-paper focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
        >
          Pular para o conteúdo
        </a>
        <div id="conteudo" className="flex flex-1 flex-col" tabIndex={-1}>
          {children}
        </div>
        <footer className="border-t-2 border-ink bg-paper-2 px-6 py-5 text-center text-ink-soft print:hidden">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-display text-ink">
              <IconTicket size={15} />
              confConf
            </span>
            <span aria-hidden="true">·</span>
            <span>Feito para reunir gente querida.</span>
            <span aria-hidden="true">·</span>
            <Link href="/privacidade" className="underline decoration-2 underline-offset-4">
              Privacidade e dados
            </Link>
          </p>
          <p className="mt-1.5 text-sm font-bold text-ink">
            Programado por DeepSeek, sob o julgamento, pressão, chicotadas e supervisão do Leicson.
          </p>
        </footer>
      </body>
    </html>
  );
}
