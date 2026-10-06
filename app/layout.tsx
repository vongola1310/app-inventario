import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from './components/SessionProvider'; // <-- 1. Importar

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Control de Herramientas',
  description: 'App de inventario',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {/* Logo Global */}
          <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 pointer-events-none opacity-90 drop-shadow-2xl">
            <span className="text-sm md:text-lg font-bold text-white">Euroimmun · Revvity</span>
          </div>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}