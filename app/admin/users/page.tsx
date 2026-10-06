'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';

type UserRow = {
  id: string;
  name: string;
  email: string;
  workerId: string;
  role: 'ADMIN' | 'ENGINEER';
};

export default function UsersPage() {
  const { data: session } = useSession();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Modal Editar Usuario ---
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editWorkerId, setEditWorkerId] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'ENGINEER'>('ENGINEER');
  const [editPassword, setEditPassword] = useState('');
  
  const [editLoading, setEditLoading] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState('');
  const [editSuccessMessage, setEditSuccessMessage] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Error al cargar usuarios');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: UserRow) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditWorkerId(user.workerId);
    setEditRole(user.role);
    setEditPassword('');
    setEditErrorMessage('');
    setEditSuccessMessage('');
    setIsEditUserModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditLoading(true);
    setEditErrorMessage('');
    
    try {
        const response = await fetch(`/api/users/${selectedUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name: editName,
                email: editEmail,
                workerId: editWorkerId,
                role: editRole,
                password: editPassword || undefined,
            }),
        });

        if (response.ok) {
            setEditSuccessMessage('Usuario actualizado correctamente');
            await fetchUsers();
            setTimeout(() => {
                setIsEditUserModalOpen(false);
                setSelectedUser(null);
            }, 1000);
        } else {
            const data = await response.json();
            setEditErrorMessage(data.error || 'Error al editar el usuario.');
        }
    } catch (error) {
        setEditErrorMessage('Error de conexión.');
    }
    setEditLoading(false);
  };

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.workerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <main className="min-h-screen bg-transparent text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-green/20 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-green-dark/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        
        <div className="mb-8">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-green to-brand-green-dark rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-brand-green via-brand-green-dark to-brand-green-light rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-green-light to-white tracking-tight">
                    Gestión de Usuarios
                  </h1>
                  <p className="text-white/80 text-sm font-medium mt-2">
                    Administra los accesos y roles del sistema
                  </p>
                </div>
              </div>
              
              <Link 
                href="/admin"
                className="group relative px-5 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-bold rounded-xl shadow-lg shadow-slate-900/50 hover:shadow-slate-900/80 hover:scale-105 transition-all duration-300 overflow-hidden border border-white/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-2">
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Dashboard
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl border border-white/20 p-6 mb-6 shadow-xl">
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-brand-green-light/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 border-2 border-white/10 rounded-xl bg-white/5 text-white placeholder-white/40 focus:border-brand-green/50 focus:bg-white/10 focus:outline-none transition-all backdrop-blur-sm"
            />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">ID Empleado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <svg className="w-12 h-12 text-brand-green animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-slate-400 font-medium">Cargando usuarios...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-400">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{u.name}</span>
                          <span className="text-sm text-slate-400">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">{u.workerId}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => openEditModal(u)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg shadow-sm hover:scale-105 transition-all"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>

    {/* MODAL DE EDICIÓN DE USUARIOS */}
    <Transition appear show={isEditUserModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => setIsEditUserModalOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 p-8 text-left shadow-2xl transition-all">
                
                {editErrorMessage && (
                  <div className="mb-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 font-bold">
                    {editErrorMessage}
                  </div>
                )}
                {editSuccessMessage && (
                  <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 font-bold">
                    {editSuccessMessage}
                  </div>
                )}

                <Dialog.Title as="h3" className="text-2xl font-black text-white mb-6">
                  Editar Usuario
                </Dialog.Title>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Nombre</label>
                    <input 
                      type="text" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      required 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Email</label>
                    <input 
                      type="email" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)} 
                      required 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">ID Empleado</label>
                    <input 
                      type="text" 
                      value={editWorkerId} 
                      onChange={(e) => setEditWorkerId(e.target.value)} 
                      required 
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-green/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Rol</label>
                    <select 
                      value={editRole} 
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-brand-green/50 focus:outline-none"
                    >
                      <option value="ENGINEER">Ingeniero (ENGINEER)</option>
                      <option value="ADMIN">Administrador (ADMIN)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Nueva Contraseña (opcional)</label>
                    <input 
                      type="password" 
                      value={editPassword} 
                      onChange={(e) => setEditPassword(e.target.value)} 
                      placeholder="Dejar en blanco para mantener la actual"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-green/50 focus:outline-none placeholder:text-white/30"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all"
                      onClick={() => setIsEditUserModalOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green-dark text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                      {editLoading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
    </>
  );
}
