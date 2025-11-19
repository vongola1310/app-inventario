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
  isCalibrationTool: boolean; // <-- Determina si mostramos el botón Renovar
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

  // --- Carga de Datos ---
  const fetchTools = async () => {
    setIsLoading(true);
    try {
      // Reutilizamos la API del dashboard que ya calcula los estados
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

  // --- Lógica de Renovación (Actualizar Fecha) ---
  const openRenewModal = (tool: InventoryRow) => {
    setSelectedTool(tool);
    setNewDate(''); // Limpiar fecha anterior
    setIsRenewModalOpen(true);
  };

  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !newDate) return;

    setRenewLoading(true);
    try {
        // Llamada a la API dinámica para actualizar solo la fecha
        const response = await fetch(`/api/tools/${selectedTool.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nextCalibrationDate: newDate }),
        });

        if (response.ok) {
            // Éxito: Recargar datos para ver el nuevo estado y cerrar modal
            await fetchTools();
            setIsRenewModalOpen(false);
            setSelectedTool(null);
        } else {
            alert('Error al actualizar la fecha. Intenta de nuevo.');
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión con el servidor.');
    }
    setRenewLoading(false);
  };

  // --- Lógica de Filtrado en Cliente ---
  const filteredTools = tools.filter((tool) => {
    // 1. Filtro por Texto
    const matchesSearch = 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.qrId.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtro por Estado
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

  return (
    <>
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden p-4 md:p-8">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white/5 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-xl">
          <div>
            <h1 className="text-3xl font-bold text-white">Inventario de Herramientas</h1>
            <p className="text-blue-200/70 text-sm mt-1">Gestión, búsqueda y renovación de vigencias</p>
          </div>
          <Link 
            href="/admin"
            className="px-5 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 font-medium shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Volver al Dashboard
          </Link>
        </div>

        {/* Barra de Herramientas (Filtros) */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between backdrop-blur-sm shadow-lg">
          {/* Buscador */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o QR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-xl leading-5 bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          {/* Tabs de Filtro */}
          <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-700 overflow-x-auto">
            <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'ALL' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Todos</button>
            <button onClick={() => setStatusFilter('AVAILABLE')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'AVAILABLE' ? 'bg-green-900/50 text-green-300 shadow border border-green-500/30' : 'text-slate-400 hover:text-green-300'}`}>Disponibles</button>
            <button onClick={() => setStatusFilter('IN_USE')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'IN_USE' ? 'bg-yellow-900/50 text-yellow-300 shadow border border-yellow-500/30' : 'text-slate-400 hover:text-yellow-300'}`}>En Uso</button>
            <button onClick={() => setStatusFilter('IN_CALIBRATION')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${statusFilter === 'IN_CALIBRATION' ? 'bg-red-900/50 text-red-300 shadow border border-red-500/30' : 'text-slate-400 hover:text-red-300'}`}>Vencidas</button>
          </div>
        </div>

        {/* Tabla Principal */}
        <div className="bg-slate-800/40 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-900/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/70 uppercase tracking-wider">Herramienta</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/70 uppercase tracking-wider">QR ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/70 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/70 uppercase tracking-wider">Vigencia Calibración</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/70 uppercase tracking-wider">Ubicación / Responsable</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/70 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 bg-transparent">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400 animate-pulse">Cargando inventario...</td></tr>
                ) : filteredTools.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No se encontraron herramientas con los filtros actuales.</td></tr>
                ) : (
                  filteredTools.map((row) => {
                    // Lógica de estilos según estado efectivo
                    let statusClasses = 'bg-green-500/10 text-green-400 border border-green-500/20';
                    let statusText = 'Disponible';
                    
                    if (row.effectiveStatus === 'IN_USE') {
                      statusClasses = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
                      statusText = 'En Uso';
                    } else if (row.effectiveStatus === 'IN_CALIBRATION') {
                      statusClasses = 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse font-bold';
                      statusText = 'VENCIDA';
                    }

                    return (
                      <tr key={row.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-white">{row.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-slate-300 bg-slate-900/50 px-2 py-1 rounded w-fit border border-slate-700">{row.qrId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {row.nextCalibrationDate ? (
                            <span className={row.effectiveStatus === 'IN_CALIBRATION' ? 'text-red-400 font-bold' : 'text-blue-300'}>
                              {new Date(row.nextCalibrationDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-xs italic">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          <div className="flex flex-col">
                            <span>{row.where || '---'}</span>
                            <span className="text-xs text-slate-500">{row.who}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {/* Botón de Renovar: Solo si es herramienta de calibración */}
                            {row.isCalibrationTool && (
                                <button 
                                    onClick={() => openRenewModal(row)}
                                    className="px-3 py-1.5 bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    Renovar
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
          {/* Pie de tabla */}
          <div className="bg-slate-900/40 px-6 py-3 border-t border-slate-700/50">
            <p className="text-xs text-slate-500">
              Mostrando {filteredTools.length} de {tools.length} herramientas totales
            </p>
          </div>
        </div>

      </div>
    </main>

    {/* --- MODAL DE RENOVACIÓN --- */}
    <Transition appear show={isRenewModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsRenewModalOpen(false)}>
          {/* Fondo Oscuro */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              {/* Contenido */}
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600 p-8 text-left align-middle shadow-2xl transition-all">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white mb-2 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Renovar Calibración
                  </Dialog.Title>
                  
                  <div className="mt-2">
                    <p className="text-sm text-slate-400">
                        Estás actualizando la fecha de vigencia para la herramienta:
                    </p>
                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <p className="text-lg font-bold text-white">{selectedTool?.name}</p>
                        <p className="text-xs font-mono text-slate-500 mt-1">{selectedTool?.qrId}</p>
                    </div>
                  </div>

                  <form onSubmit={handleRenewSubmit} className="mt-6">
                      <div className="mb-6">
                          <label className="block text-sm font-semibold text-blue-200 mb-2">Nueva Fecha de Vencimiento</label>
                          <input 
                            type="date" 
                            value={newDate} 
                            onChange={(e) => setNewDate(e.target.value)} 
                            required 
                            className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          />
                          <p className="text-xs text-slate-500 mt-2">Al guardar, la herramienta pasará a estado DISPONIBLE automáticamente.</p>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                          onClick={() => setIsRenewModalOpen(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={renewLoading}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                          {renewLoading ? (
                              <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Guardando...
                              </>
                          ) : 'Confirmar Renovación'}
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