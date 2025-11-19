'use client';

import { signIn } from 'next-auth/react'; // Hook de cliente para iniciar sesión
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Llamar a la función signIn de Next-Auth
      const result = await signIn('credentials', {
        // Estos son los 'credentials' que nuestra API espera
        redirect: false, // Le decimos que no redirija automáticamente
        email: email,
        password: password,
      });

      setIsLoading(false);

      // 2. Revisar el resultado
      if (result?.error) {
        // Si hay un error (ej. contraseña incorrecta), mostrarlo
        setError('Email o contraseña incorrectos. (Solo Admins)');
      } else if (result?.ok) {
        // ¡Éxito! Redirigir al panel de admin
        router.push('/admin');
      }
    } catch (err) {
      setIsLoading(false);
      setError('Ocurrió un error inesperado');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Admin Login
        </h1>
        
        {error && (
          <div className="p-3 mb-4 rounded bg-red-100 text-red-700 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-600">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-800"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-800"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}