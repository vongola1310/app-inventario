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
        {/* 2. Envolver a los 'children' con el Provider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}