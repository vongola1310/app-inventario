'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Dialog, Transition } from '@headlessui/react';

// --- Tipos de Datos ---
type InventoryRow = {
  id: string;
  name: string;
  qrId: string;
  status: 'AVAILABLE' | 'IN_USE';
  effectiveStatus: 'AVAILABLE' | 'IN_USE' | 'IN_CALIBRATION';
  isCalibrationTool: boolean;
  who: string | null;
  where: string | null;
  timestamp: string | null;
  nextCalibrationDate: string | null;
};

export default function InventoryPage() {
  const { data: session } = useSession();

  // --- Estados Principales ---
  const [tools, setTools] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'IN_USE' | 'IN_CALIBRATION'>('ALL');

  // --- Estados del Modal de Renovación ---
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<InventoryRow | null>(null);
  const [newDate, setNewDate] = useState('');
  const [renewLoading, setRenewLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // --- Carga de Datos ---
  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Error al cargar inventario');
      const data = await response.json();
      setTools(data);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTools();
  }, []);

  // --- Lógica de Renovación ---
  const openRenewModal = (tool: InventoryRow) => {
    setSelectedTool(tool);
    setNewDate('');
    setSuccessMessage('');
    setIsRenewModalOpen(true);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !newDate) return;

    setRenewLoading(true);
    try {
        const response = await fetch(`/api/tools/${selectedTool.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nextCalibrationDate: newDate }),
        });

        if (response.ok) {
            setSuccessMessage('¡Calibración renovada exitosamente!');
            await fetchTools();
            setTimeout(() => {
              setIsRenewModalOpen(false);
              setSelectedTool(null);
              setSuccessMessage('');
            }, 1500);
        } else {
            alert('Error al actualizar la fecha. Intenta de nuevo.');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor.');
    }
    setRenewLoading(false);
  };

  // --- Lógica de Filtrado ---
  const filteredTools = tools.filter((tool) => {
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.qrId.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'IN_CALIBRATION') {
         matchesStatus = tool.effectiveStatus === 'IN_CALIBRATION';
      } else {
         matchesStatus = tool.effectiveStatus === statusFilter;
      }
    }
    return matchesSearch && matchesStatus;
  });

  // Cálculos de estadísticas
  const stats = {
    total: tools.length,
    available: tools.filter(t => t.effectiveStatus === 'AVAILABLE').length,
    inUse: tools.filter(t => t.effectiveStatus === 'IN_USE').length,
    expired: tools.filter(t => t.effectiveStatus === 'IN_CALIBRATION').length,
  };

  // Función para obtener días restantes
  const getDaysUntilExpiration = (date: string | null) => {
    if (!date) return null;
    const today = new Date();
    const expDate = new Date(date);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Fondos decorativos animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Cabecera mejorada */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 tracking-tight">
                    Inventario de Herramientas
                  </h1>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-blue-200/80 text-sm font-medium">
                      Sistema de gestión y control de vigencias
                    </p>
                  </div>
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

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-200/60 uppercase tracking-wider mb-1">Total</p>
                <p className="text-3xl font-black text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-200/60 uppercase tracking-wider mb-1">Disponibles</p>
                <p className="text-3xl font-black text-white">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-yellow-200/60 uppercase tracking-wider mb-1">En Uso</p>
                <p className="text-3xl font-black text-white">{stats.inUse}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-200/60 uppercase tracking-wider mb-1">Vencidas</p>
                <p className="text-3xl font-black text-white">{stats.expired}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Herramientas mejorada */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl border border-white/20 p-6 mb-6 shadow-xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Buscador mejorado */}
            <div className="relative w-full lg:w-96">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar herramienta o código QR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-12 pr-4 py-3 border-2 border-white/10 rounded-xl bg-white/5 text-white placeholder-white/40 focus:border-blue-400/50 focus:bg-white/10 focus:outline-none transition-all backdrop-blur-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300/50 hover:text-blue-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Tabs de filtro mejorados */}
            <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10 overflow-x-auto backdrop-blur-sm">
              <button 
                onClick={() => setStatusFilter('ALL')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'ALL' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Todos ({stats.total})
              </button>
              <button 
                onClick={() => setStatusFilter('AVAILABLE')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'AVAILABLE' 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-green-300 hover:bg-white/5'
                }`}
              >
                Disponibles ({stats.available})
              </button>
              <button 
                onClick={() => setStatusFilter('IN_USE')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'IN_USE' 
                    ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-yellow-300 hover:bg-white/5'
                }`}
              >
                En Uso ({stats.inUse})
              </button>
              <button 
                onClick={() => setStatusFilter('IN_CALIBRATION')} 
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  statusFilter === 'IN_CALIBRATION' 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-red-300 hover:bg-white/5'
                }`}
              >
                Vencidas ({stats.expired})
              </button>
            </div>
          </div>
        </div>

        {/* Tabla mejorada */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Herramienta</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Código QR</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Vigencia</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Ubicación</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <svg className="w-12 h-12 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-slate-400 font-medium">Cargando inventario...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTools.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <svg className="w-16 h-16 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-400 font-medium">No se encontraron herramientas</p>
                        <p className="text-slate-600 text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTools.map((row) => {
                    const daysLeft = getDaysUntilExpiration(row.nextCalibrationDate);
                    let statusClasses = 'bg-green-500/20 text-green-300 border border-green-500/30';
                    let statusText = 'Disponible';
                    let statusIcon = (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    );
                    
                    if (row.effectiveStatus === 'IN_USE') {
                      statusClasses = 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
                      statusText = 'En Uso';
                      statusIcon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      );
                    } else if (row.effectiveStatus === 'IN_CALIBRATION') {
                      statusClasses = 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse';
                      statusText = 'VENCIDA';
                      statusIcon = (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      );
                    }

                    return (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-400/30">
                              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white">{row.name}</div>
                              {row.isCalibrationTool && (
                                <div className="text-xs text-pink-400 flex items-center gap-1 mt-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                  </svg>
                                  Verificación
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-slate-300 bg-slate-900/50 px-3 py-1.5 rounded-lg w-fit border border-slate-700/50">
                            {row.qrId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 inline-flex items-center gap-2 text-xs leading-5 font-bold rounded-full ${statusClasses}`}>
                            {statusIcon}
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {row.nextCalibrationDate ? (
                            <div className="flex flex-col gap-1">
                              <span className={`text-sm font-bold ${
                                row.effectiveStatus === 'IN_CALIBRATION' 
                                  ? 'text-red-400' 
                                  : daysLeft && daysLeft <= 7 
                                    ? 'text-yellow-400' 
                                    : 'text-blue-300'
                              }`}>
                                {new Date(row.nextCalibrationDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              {daysLeft !== null && (
                                <span className={`text-xs ${
                                  row.effectiveStatus === 'IN_CALIBRATION'
                                    ? 'text-red-400/70'
                                    : daysLeft <= 7
                                      ? 'text-yellow-400/70'
                                      : 'text-slate-500'
                                }`}>
                                  {daysLeft < 0 
                                    ? `Vencida hace ${Math.abs(daysLeft)} días` 
                                    : daysLeft === 0
                                      ? 'Vence hoy'
                                      : `${daysLeft} días restantes`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-xs italic">No aplica</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {row.where ? (
                              <span className="text-sm text-slate-300 flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {row.where}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-sm">---</span>
                            )}
                            {row.who && (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {row.who}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {row.isCalibrationTool && (
                            <button 
                              onClick={() => openRenewModal(row)}
                              className="group/btn relative px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 hover:shadow-blue-900/50 transition-all transform hover:scale-105 active:scale-95 overflow-hidden"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover/btn:opacity-30 transition-opacity"></div>
                              <div className="relative flex items-center gap-2">
                                <svg className="w-4 h-4 group-hover/btn:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Renovar
                              </div>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pie de tabla mejorado */}
          <div className="bg-gradient-to-r from-white/5 to-transparent px-6 py-4 border-t border-white/10">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Mostrando <span className="font-bold text-white">{filteredTools.length}</span> de <span className="font-bold text-white">{tools.length}</span> herramientas
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>

    {/* --- MODAL DE RENOVACIÓN MEJORADO --- */}
    <Transition appear show={isRenewModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsRenewModalOpen(false)}>
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
                  
                  {/* Mensaje de éxito */}
                  {successMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 animate-pulse">
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-green-300 font-bold">{successMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Cabecera del modal */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50"></div>
                      <div className="relative w-14 h-14 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center border border-blue-400/30">
                        <svg className="w-7 h-7 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-2xl font-black text-white">
                        Renovar Calibración
                      </Dialog.Title>
                      <p className="text-sm text-slate-400 mt-1">Actualizar fecha de vigencia</p>
                    </div>
                  </div>
                  
                  {/* Información de la herramienta */}
                  <div className="mb-6 p-5 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl border border-white/20 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-400/30">
                        <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-bold text-white">{selectedTool?.name}</p>
                        <p className="text-sm font-mono text-slate-400 mt-1">{selectedTool?.qrId}</p>
                      </div>
                    </div>
                    
                    {selectedTool?.nextCalibrationDate && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-slate-500 mb-1">Fecha actual de vencimiento:</p>
                        <p className="text-sm font-bold text-red-400">
                          {new Date(selectedTool.nextCalibrationDate).toLocaleDateString('es-MX', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Formulario */}
                  <form onSubmit={handleRenewSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-blue-200 mb-3">
                        Nueva Fecha de Vencimiento
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-blue-300/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input 
                          type="date" 
                          value={newDate} 
                          onChange={(e) => setNewDate(e.target.value)} 
                          required 
                          className="w-full pl-12 pr-4 py-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-white focus:border-blue-400/50 focus:bg-white/10 focus:outline-none transition-all backdrop-blur-sm"
                        />
                      </div>
                      <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-xs text-blue-300">
                            Al confirmar, la herramienta volverá automáticamente al estado <span className="font-bold">DISPONIBLE</span> si estaba vencida.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                        onClick={() => setIsRenewModalOpen(false)}
                        disabled={renewLoading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={renewLoading || !newDate}
                        className="flex-1 relative px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                        <div className="relative flex items-center justify-center gap-2">
                          {renewLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirmar Renovación
                            </>
                          )}
                        </div>
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