"use client";

import { useState, useEffect, Fragment } from "react";
import { useSession, signOut } from "next-auth/react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";

// --- Tipos ---
type AdminMessage = {
  type: "success" | "error";
  message: string;
} | null;

type DashboardRow = {
  id: string;
  name: string;
  qrId: string;
  status: "AVAILABLE" | "IN_USE";
  effectiveStatus: "AVAILABLE" | "IN_USE" | "IN_CALIBRATION";
  who: string | null;
  where: string | null;
  timestamp: string | null;
  nextCalibrationDate: string | null;
  expectedReturnDate: string | null;
  isOverdue: boolean;
};

type HistoryRecord = {
  id: string;
  toolName: string;
  toolQrId: string;
  action: "CHECK_OUT" | "CHECK_IN";
  userName: string;
  userWorkerId: string;
  clientName: string | null;
  timestamp: string;
  comments: string | null;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function AdminPage() {
  const { data: session } = useSession();

  const [dashboardData, setDashboardData] = useState<DashboardRow[]>([]);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const [toolName, setToolName] = useState("");
  const [toolQrId, setToolQrId] = useState("");
  const [isCalibrationTool, setIsCalibrationTool] = useState(false);
  const [nextCalibrationDate, setNextCalibrationDate] = useState("");
  const [toolLoading, setToolLoading] = useState(false);
  const [toolMessage, setToolMessage] = useState<AdminMessage>(null);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userWorkerId, setUserWorkerId] = useState("");
  const [userRole, setUserRole] = useState("ENGINEER");
  const [userPassword, setUserPassword] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState<AdminMessage>(null);

  const fetchDashboardData = async () => {
    setIsLoadingData(true);
    try {
      const response = await fetch("/api/dashboard");
      if (!response.ok) throw new Error("Error al cargar datos");
      const data: DashboardRow[] = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error(error);
    }
    setIsLoadingData(false);
  };

  const fetchHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("Error al cargar historial");
      const data: HistoryRecord[] = await response.json();
      setHistoryData(data);
    } catch (error) {
      console.error(error);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchHistoryData();
  }, []);

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setToolLoading(true);
    setToolMessage(null);

    const response = await fetch("/api/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: toolName,
        qrId: toolQrId,
        isCalibrationTool,
        nextCalibrationDate:
          isCalibrationTool && nextCalibrationDate ? nextCalibrationDate : null,
      }),
    });
    setToolLoading(false);

    if (response.ok) {
      setToolMessage({ type: "success", message: "¡Herramienta creada exitosamente!" });
      setToolName("");
      setToolQrId("");
      setIsCalibrationTool(false);
      setNextCalibrationDate("");
      await fetchDashboardData();
      setTimeout(() => {
        setIsToolModalOpen(false);
        setToolMessage(null);
      }, 1500);
    } else {
      const data = await response.json();
      setToolMessage({ type: "error", message: `Error: ${data.error}` });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserLoading(true);
    setUserMessage(null);

    const requestBody = {
      name: userName,
      email: userEmail,
      workerId: userWorkerId,
      role: userRole,
      password: userRole === "ADMIN" ? userPassword : null,
    };
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    setUserLoading(false);

    if (response.ok) {
      setUserMessage({ type: "success", message: "¡Usuario creado exitosamente!" });
      setUserName("");
      setUserEmail("");
      setUserWorkerId("");
      setUserPassword("");
      setTimeout(() => {
        setIsUserModalOpen(false);
        setUserMessage(null);
      }, 1500);
    } else {
      const data = await response.json();
      setUserMessage({ type: "error", message: `Error: ${data.error}` });
    }
  };

  const closeToolModal = () => {
    setIsToolModalOpen(false);
    setToolMessage(null);
  };
  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setUserMessage(null);
  };

  // Stats
  const availableTools = dashboardData.filter((t) => t.status === "AVAILABLE").length;
  const inUseTools = dashboardData.filter((t) => t.status === "IN_USE").length;
  const overdueTools = dashboardData.filter((t) => t.isOverdue).length;
  const totalTools = dashboardData.length;

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
          {/* Header */}
          <header className="mb-8">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 tracking-tight">
                      Panel de Control
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-blue-200/80 font-medium">
                        {session?.user?.name || "Administrador"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setIsUserModalOpen(true)} className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/50 hover:scale-105 transition-all">
                    Nuevo Usuario
                  </button>
                  <button onClick={() => setIsToolModalOpen(true)} className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/50 hover:scale-105 transition-all">
                    Nueva Herramienta
                  </button>
                  <Link href="/admin/inventory">
                    <button className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow hover:bg-purple-700">
                      Ver Inventario Completo
                    </button>
                  </Link>
                  <Link href="/admin/agenda">
                    <button className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-md shadow hover:bg-cyan-700">
                      Agenda Diaria
                    </button>
                  </Link>
                  <button onClick={() => signOut({ callbackUrl: "/login" })} className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/50 hover:scale-105 transition-all">
                    Salir
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Stats (ahora 4 tarjetas) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5">
              <p className="text-xs font-semibold text-blue-200/70 mb-2 uppercase tracking-wider">Total</p>
              <p className="text-4xl font-black text-white">{totalTools}</p>
              <p className="text-xs text-blue-200/60 mt-1">Herramientas</p>
            </div>

            {/* Disponibles */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5">
              <p className="text-xs font-semibold text-green-200/70 mb-2 uppercase tracking-wider">Disponibles</p>
              <p className="text-4xl font-black text-white">{availableTools}</p>
              <p className="text-xs text-green-200/60 mt-1">Listas para usar</p>
            </div>

            {/* En Uso */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5">
              <p className="text-xs font-semibold text-amber-200/70 mb-2 uppercase tracking-wider">En Uso</p>
              <p className="text-4xl font-black text-white">{inUseTools}</p>
              <p className="text-xs text-amber-200/60 mt-1">Prestadas</p>
            </div>

            {/* Vencidas (NUEVA) */}
            <div className={`bg-gradient-to-br backdrop-blur-2xl rounded-2xl shadow-xl border p-5 ${overdueTools > 0
                ? "from-red-500/20 to-rose-500/10 border-red-400/40"
                : "from-white/10 to-white/5 border-white/20"
              }`}>
              <p className={`text-xs font-semibold mb-2 uppercase tracking-wider ${overdueTools > 0 ? "text-red-300" : "text-white/50"
                }`}>
                Vencidas
              </p>
              <p className={`text-4xl font-black ${overdueTools > 0 ? "text-red-300" : "text-white"
                }`}>
                {overdueTools}
              </p>
              <p className={`text-xs mt-1 ${overdueTools > 0 ? "text-red-300/80" : "text-white/40"
                }`}>
                {overdueTools > 0 ? "Requieren atención" : "Todo al día"}
              </p>
            </div>
          </div>

          {/* Tablas */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 md:p-8 border-b border-white/10">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl md:text-3xl font-black text-white">Gestión de Herramientas</h2>
              </div>
              <button
                onClick={() => {
                  fetchDashboardData();
                  fetchHistoryData();
                }}
                disabled={isLoadingData || isLoadingHistory}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/20 disabled:opacity-50 transition-all"
              >
                Actualizar
              </button>
            </div>

            <div className="flex border-b border-white/10 px-6 md:px-8">
              <button
                onClick={() => setActiveTab("current")}
                className={`relative px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${activeTab === "current" ? "text-white" : "text-white/50 hover:text-white/80"
                  }`}
              >
                Estado Actual
                {activeTab === "current" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`relative px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${activeTab === "history" ? "text-white" : "text-white/50 hover:text-white/80"
                  }`}
              >
                Historial
                {activeTab === "history" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full"></div>
                )}
              </button>
            </div>

            <div className="overflow-x-auto">
              {activeTab === "current" && (
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Herramienta</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">QR</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Próx. Calibración</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Vencimiento</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Última Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {isLoadingData ? (
                      <tr><td colSpan={8} className="p-6 text-center text-slate-400">Cargando...</td></tr>
                    ) : dashboardData.length === 0 ? (
                      <tr><td colSpan={8} className="p-6 text-center text-slate-400">No hay herramientas registradas.</td></tr>
                    ) : (
                      dashboardData.map((row) => (
                        <tr
                          key={row.id}
                          className={`hover:bg-white/5 transition-colors ${row.isOverdue ? "bg-red-500/5" : ""}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row.qrId}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${row.effectiveStatus === "AVAILABLE"
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : row.effectiveStatus === "IN_USE"
                                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                  : "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                              }`}>
                              {row.effectiveStatus === "AVAILABLE" ? "DISPONIBLE" : row.effectiveStatus === "IN_USE" ? "EN USO" : "EN CALIBRACIÓN"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.nextCalibrationDate ? new Date(row.nextCalibrationDate).toLocaleDateString("es-MX") : "---"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row.who || "---"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row.where || "---"}</td>
                          {/* COLUMNA NUEVA: VENCIMIENTO */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {row.expectedReturnDate ? (
                              <div className="flex items-center gap-2">
                                <span className={row.isOverdue ? "text-red-400 font-bold" : "text-slate-300"}>
                                  {new Date(row.expectedReturnDate).toLocaleDateString("es-MX")}
                                </span>
                                {row.isOverdue && (
                                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                                    VENCIDA
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">---</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.timestamp
                              ? new Date(row.timestamp).toLocaleString("es-MX", {
                                day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                              })
                              : "---"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {activeTab === "history" && (
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Fecha y Hora</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Acción</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Herramienta</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Usuario (ID)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">Notas / Reporte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {isLoadingHistory ? (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-400">Cargando...</td></tr>
                    ) : historyData.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-400">No hay historial.</td></tr>
                    ) : (
                      historyData.map((row) => (
                        <tr key={row.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {new Date(row.timestamp).toLocaleString("es-MX", {
                              day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`font-bold text-sm ${row.action === "CHECK_OUT" ? "text-yellow-400" : "text-green-400"}`}>
                              {row.action === "CHECK_OUT" ? "SALIDA" : "DEVOLUCIÓN"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.toolName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.userName} <span className="text-slate-500 text-xs">({row.userWorkerId})</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{row.clientName}</td>
                          <td className="px-6 py-4 text-sm max-w-xs">
                            {row.comments ? (
                              <span className="text-pink-300 bg-pink-500/10 px-2 py-1 rounded text-xs border border-pink-500/20 whitespace-normal block">
                                {row.comments}
                              </span>
                            ) : (
                              <span className="text-slate-600">---</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal crear herramienta */}
      <ModalBase isOpen={isToolModalOpen} onClose={closeToolModal} title="Crear Nueva Herramienta">
        <form onSubmit={handleCreateTool}>
          {toolMessage && (
            <div className={`p-3 mb-4 rounded ${toolMessage.type === "success" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {toolMessage.message}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="modalToolName" className="block text-sm font-medium text-slate-300">Nombre</label>
            <input id="modalToolName" type="text" value={toolName} onChange={(e) => setToolName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
          </div>
          <div className="mb-4">
            <label htmlFor="modalToolQrId" className="block text-sm font-medium text-slate-300">ID del QR</label>
            <input id="modalToolQrId" type="text" value={toolQrId} onChange={(e) => setToolQrId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
          </div>
          <div className="mb-6 border border-white/10 p-4 rounded-lg bg-white/5">
            <div className="flex items-center mb-4">
              <input id="isCalibrationTool" type="checkbox" checked={isCalibrationTool} onChange={(e) => { setIsCalibrationTool(e.target.checked); if (!e.target.checked) setNextCalibrationDate(""); }} className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded" />
              <label htmlFor="isCalibrationTool" className="ml-2 text-sm font-medium text-white">Es una Herramienta de Verificación</label>
            </div>
            {isCalibrationTool && (
              <div className="mt-4">
                <label htmlFor="nextCalibrationDate" className="block text-sm font-medium text-slate-300 mb-2">Próxima Fecha de Calibración</label>
                <input id="nextCalibrationDate" type="date" value={nextCalibrationDate} onChange={(e) => setNextCalibrationDate(e.target.value)} required={isCalibrationTool} className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={closeToolModal} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 font-medium">Cancelar</button>
            <button type="submit" disabled={toolLoading} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500">
              {toolLoading ? "Creando..." : "Crear Herramienta"}
            </button>
          </div>
        </form>
      </ModalBase>

      {/* Modal crear usuario */}
      <ModalBase isOpen={isUserModalOpen} onClose={closeUserModal} title="Crear Nuevo Usuario">
        <form onSubmit={handleCreateUser}>
          {userMessage && (
            <div className={`p-3 mb-4 rounded ${userMessage.type === "success" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {userMessage.message}
            </div>
          )}
          <div className="mb-4">
            <label htmlFor="modalUserName" className="block text-sm font-medium text-slate-300">Nombre Completo</label>
            <input id="modalUserName" type="text" value={userName} onChange={(e) => setUserName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
          </div>
          <div className="mb-4">
            <label htmlFor="modalUserEmail" className="block text-sm font-medium text-slate-300">Email</label>
            <input id="modalUserEmail" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
          </div>
          <div className="mb-4">
            <label htmlFor="modalUserWorkerId" className="block text-sm font-medium text-slate-300">ID de Trabajador</label>
            <input id="modalUserWorkerId" type="text" value={userWorkerId} onChange={(e) => setUserWorkerId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
          </div>
          <div className="mb-4">
            <label htmlFor="modalUserRole" className="block text-sm font-medium text-slate-300">Rol</label>
            <select id="modalUserRole" value={userRole} onChange={(e) => setUserRole(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white">
              <option value="ENGINEER">Ingeniero (Sin contraseña)</option>
              <option value="ADMIN">Administrador (Requiere contraseña)</option>
            </select>
          </div>
          {userRole === "ADMIN" && (
            <div className="mb-4">
              <label htmlFor="modalUserPassword" className="block text-sm font-medium text-slate-300">Contraseña</label>
              <input id="modalUserPassword" type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required={userRole === "ADMIN"} className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md bg-slate-700 text-white" />
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={closeUserModal} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 font-medium">Cancelar</button>
            <button type="submit" disabled={userLoading} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-500">
              {userLoading ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  );
}

function ModalBase({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 p-6 text-left align-middle shadow-2xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">{title}</Dialog.Title>
                <div className="mt-4 text-slate-300">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}