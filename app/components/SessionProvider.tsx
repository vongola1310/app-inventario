'use client';
import { SessionProvider } from 'next-auth/react';

type Props = {
  children: React.ReactNode;
};

// Este es un componente simple que solo envuelve a los hijos
// con el provider de Next-Auth
export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}