import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1e3a5f',
}

export const metadata: Metadata = {
  title: 'App Arjun | Inventario Profecional',
  description: 'Sistema de gestión de inventario para Bodegas y Módulos Zofri.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent' },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn(mono.variable, "font-sans", geist.variable)}>
      <body suppressHydrationWarning className="antialiased">
        {children}
      </body>
    </html>
  );
}
