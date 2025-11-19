"use client";

import { useState, useEffect, Fragment } from "react";
import { useSession, signOut } from "next-auth/react";
import { Dialog, Transition } from "@headlessui/react";
import Link from "next/link";

// --- Tipos de Datos (ACTUALIZADOS) ---

type AdminMessage = {
  type: "success" | "error";
  message: string;
} | null;

// TIPO DE LA FILA DEL DASHBOARD (AHORA INCLUYE CALIBRACIÓN)
type DashboardRow = {
  id: string;
  name: string;
  qrId: string;
  status: "AVAILABLE" | "IN_USE";
  effectiveStatus: "AVAILABLE" | "IN_USE" | "IN_CALIBRATION"; // <-- Nuevo estado visual
  who: string | null;
  where: string | null;
  timestamp: string | null;
  nextCalibrationDate: string | null; // <-- Nueva fecha
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

// --- Componente Principal ---

export default function AdminPage() {
  const { data: session } = useSession();

  // --- Estados de Datos y Visualización ---
  const [dashboardData, setDashboardData] = useState<DashboardRow[]>([]);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");

  // --- Estados de Modales y Formularios ---
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // ESTADOS DE HERRAMIENTAS (NUEVOS CAMPOS)
  const [toolName, setToolName] = useState("");
  const [toolQrId, setToolQrId] = useState("");
  const [isCalibrationTool, setIsCalibrationTool] = useState(false); // <-- Nuevo: Checkbox
  const [nextCalibrationDate, setNextCalibrationDate] = useState(""); // <-- Nuevo: Date
  const [toolLoading, setToolLoading] = useState(false);
  const [toolMessage, setToolMessage] = useState<AdminMessage>(null);

  // Estados de Formulario de Usuarios (sin cambios)
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userWorkerId, setUserWorkerId] = useState("");
  const [userRole, setUserRole] = useState("ENGINEER");
  const [userPassword, setUserPassword] = useState("");
  const [userLoading, setUserLoading] = useState(false);
  const [userMessage, setUserMessage] = useState<AdminMessage>(null);

  // --- Lógica de Carga de Datos ---

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

  // Carga inicial
  useEffect(() => {
    fetchDashboardData();
    fetchHistoryData();
  }, []);

  // --- Lógica de Envío de Formularios ---

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
        // ENVIANDO NUEVOS CAMPOS
        isCalibrationTool,
        nextCalibrationDate:
          isCalibrationTool && nextCalibrationDate ? nextCalibrationDate : null,
      }),
    });
    setToolLoading(false);

    if (response.ok) {
      setToolMessage({
        type: "success",
        message: "¡Herramienta creada exitosamente!",
      });
      // Limpiar estados
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
      setUserMessage({
        type: "success",
        message: "¡Usuario creado exitosamente!",
      });
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

  // Cierra modales y limpia mensajes
  const closeToolModal = () => {
    setIsToolModalOpen(false);
    setToolMessage(null);
  };
  const closeUserModal = () => {
    setIsUserModalOpen(false);
    setUserMessage(null);
  };

  // --- Cálculos para las Tarjetas de Stats ---
  const availableTools = dashboardData.filter(
    (t) => t.status === "AVAILABLE"
  ).length;
  const inUseTools = dashboardData.filter((t) => t.status === "IN_USE").length;
  const totalTools = dashboardData.length;

  // --- Renderizado de la Interfaz ---
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
        {/* Fondos animados y Patrón de grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

        {/* Contenido Principal */}
        <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
          {/* --- Cabecera y Botones de Acción --- */}
          <header className="mb-8">
            <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 tracking-tight">
                      Panel de Control
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <p className="text-blue-200/80 flex items-center gap-2 font-medium">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {session?.user?.name || "Administrador"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsUserModalOpen(true)}
                    className="group relative px-5 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/80 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        />
                      </svg>
                      Nuevo Usuario
                    </div>
                  </button>

                  <button
                    onClick={() => setIsToolModalOpen(true)}
                    className="group relative px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/50 hover:shadow-blue-500/80 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Nueva Herramienta
                    </div>
                  </button>

                  <Link href="/admin/inventory">
                    <button className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow hover:bg-purple-700">
                      Ver Inventario Completo
                    </button>
                  </Link>

                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="group relative px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/50 hover:shadow-red-500/80 hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-rose-400 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                    <div className="relative flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Salir
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* --- Tarjetas de Stats --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total */}
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-200/70 mb-2 uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-4xl md:text-5xl font-black text-white mb-1">
                    {totalTools}
                  </p>
                  <p className="text-xs text-blue-200/60">
                    Herramientas registradas
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-blue-400/30">
                    <svg
                      className="w-8 h-8 text-blue-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            {/* Disponibles */}
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-200/70 mb-2 uppercase tracking-wider">
                    Disponibles
                  </p>
                  <p className="text-4xl md:text-5xl font-black text-white mb-1">
                    {availableTools}
                  </p>
                  <p className="text-xs text-green-200/60">Listas para usar</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-green-400/30">
                    <svg
                      className="w-8 h-8 text-green-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            {/* En Uso */}
            <div className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-6 hover:scale-105 transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-amber-200/70 mb-2 uppercase tracking-wider">
                    En Uso
                  </p>
                  <p className="text-4xl md:text-5xl font-black text-white mb-1">
                    {inUseTools}
                  </p>
                  <p className="text-xs text-amber-200/60">
                    Actualmente prestadas
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl blur-xl opacity-50"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-amber-400/30">
                    <svg
                      className="w-8 h-8 text-amber-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- Tablas de Datos --- */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Cabecera de Pestañas */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 md:p-8 border-b border-white/10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-50"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center border border-blue-400/30">
                    <svg
                      className="w-6 h-6 text-blue-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    Gestión de Herramientas
                  </h2>
                  <p className="text-blue-200/60 text-sm mt-1">
                    Vista completa y historial
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  fetchDashboardData();
                  fetchHistoryData();
                }}
                disabled={isLoadingData || isLoadingHistory}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold backdrop-blur-xl border border-white/20 disabled:opacity-50 transition-all flex items-center gap-2 group"
              >
                <svg
                  className={`w-5 h-5 ${
                    isLoadingData || isLoadingHistory
                      ? "animate-spin"
                      : "group-hover:rotate-180"
                  } transition-transform duration-500`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualizar
              </button>
            </div>

            {/* Pestañas */}
            <div className="flex border-b border-white/10 px-6 md:px-8">
              <button
                onClick={() => setActiveTab("current")}
                className={`relative px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${
                  activeTab === "current"
                    ? "text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Estado Actual
                </span>
                {activeTab === "current" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`relative px-6 py-4 font-bold text-sm uppercase tracking-wider transition-all ${
                  activeTab === "history"
                    ? "text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Historial
                </span>
                {activeTab === "history" && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-full"></div>
                )}
              </button>
            </div>

            {/* --- Contenido de Pestañas --- */}
            <div className="overflow-x-auto">
              {/* --- Pestaña 1: ESTADO ACTUAL --- */}
              {activeTab === "current" && (
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Herramienta
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        QR
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Próx. Calibración
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Última Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {isLoadingData ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-slate-400"
                        >
                          Cargando estado actual...
                        </td>
                      </tr>
                    ) : dashboardData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="p-6 text-center text-slate-400"
                        >
                          No hay herramientas registradas.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {row.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.qrId}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                row.effectiveStatus === "AVAILABLE"
                                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                  : row.effectiveStatus === "IN_USE"
                                  ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                                  : "bg-pink-500/20 text-pink-300 border border-pink-500/30"
                              }`}
                            >
                              {row.effectiveStatus === "AVAILABLE"
                                ? "DISPONIBLE"
                                : row.effectiveStatus === "IN_USE"
                                ? "EN USO"
                                : "EN CALIBRACIÓN"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.nextCalibrationDate
                              ? new Date(
                                  row.nextCalibrationDate
                                ).toLocaleDateString("es-MX")
                              : "---"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.who || "---"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.where || "---"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.timestamp
                              ? new Date(row.timestamp).toLocaleString(
                                  "es-MX",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )
                              : "---"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* --- Pestaña 2: HISTORIAL --- */}
              {activeTab === "history" && (
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-white/5 to-transparent border-b border-white/10">
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Acción
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Herramienta
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Usuario (ID)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-blue-200/80 uppercase tracking-wider">
                        Notas / Reporte
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {isLoadingHistory ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-6 text-center text-slate-400"
                        >
                          Cargando historial...
                        </td>
                      </tr>
                    ) : historyData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-6 text-center text-slate-400"
                        >
                          No hay historial de movimientos.
                        </td>
                      </tr>
                    ) : (
                      historyData.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {new Date(row.timestamp).toLocaleString("es-MX", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`font-bold text-sm ${
                                row.action === "CHECK_OUT"
                                  ? "text-yellow-400"
                                  : "text-green-400"
                              }`}
                            >
                              {row.action === "CHECK_OUT"
                                ? "SALIDA"
                                : "DEVOLUCIÓN"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {row.toolName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.userName}{" "}
                            <span className="text-slate-500 text-xs">
                              ({row.userWorkerId})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {row.clientName}
                          </td>
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

      {/* --- MODAL PARA CREAR HERRAMIENTA --- */}
      <ModalBase
        isOpen={isToolModalOpen}
        onClose={closeToolModal}
        title="Crear Nueva Herramienta"
      >
        <form onSubmit={handleCreateTool}>
          {toolMessage && (
            <div
              className={`p-3 mb-4 rounded ${
                toolMessage.type === "success"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {" "}
              {toolMessage.message}{" "}
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="modalToolName"
              className="block text-sm font-medium text-slate-300"
            >
              Nombre
            </label>
            <input
              id="modalToolName"
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="modalToolQrId"
              className="block text-sm font-medium text-slate-300"
            >
              ID del QR (Ej: T-001)
            </label>
            <input
              id="modalToolQrId"
              type="text"
              value={toolQrId}
              onChange={(e) => setToolQrId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* --- CAMPOS DE CALIBRACIÓN --- */}
          <div className="mb-6 border border-white/10 p-4 rounded-lg bg-white/5">
            <div className="flex items-center mb-4">
              <input
                id="isCalibrationTool"
                type="checkbox"
                checked={isCalibrationTool}
                onChange={(e) => {
                  setIsCalibrationTool(e.target.checked);
                  if (!e.target.checked) setNextCalibrationDate("");
                }}
                className="w-4 h-4 text-pink-600 bg-gray-700 border-gray-600 rounded focus:ring-pink-500"
              />
              <label
                htmlFor="isCalibrationTool"
                className="ml-2 text-sm font-medium text-white"
              >
                Es una Herramienta de Verificación
              </label>
            </div>
            {isCalibrationTool && (
              <div className="mt-4">
                <label
                  htmlFor="nextCalibrationDate"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Próxima Fecha de Calibración
                </label>
                <input
                  id="nextCalibrationDate"
                  type="date"
                  value={nextCalibrationDate}
                  onChange={(e) => setNextCalibrationDate(e.target.value)}
                  required={isCalibrationTool}
                  className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeToolModal}
              className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={toolLoading}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-500"
            >
              {toolLoading ? "Creando..." : "Crear Herramienta"}
            </button>
          </div>
        </form>
      </ModalBase>

      {/* --- MODAL PARA CREAR USUARIO --- */}
      <ModalBase
        isOpen={isUserModalOpen}
        onClose={closeUserModal}
        title="Crear Nuevo Usuario"
      >
        <form onSubmit={handleCreateUser}>
          {userMessage && (
            <div
              className={`p-3 mb-4 rounded ${
                userMessage.type === "success"
                  ? "bg-green-500/20 text-green-300"
                  : "bg-red-500/20 text-red-300"
              }`}
            >
              {" "}
              {userMessage.message}{" "}
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="modalUserName"
              className="block text-sm font-medium text-slate-300"
            >
              Nombre Completo
            </label>
            <input
              id="modalUserName"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="modalUserEmail"
              className="block text-sm font-medium text-slate-300"
            >
              Email
            </label>
            <input
              id="modalUserEmail"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="modalUserWorkerId"
              className="block text-sm font-medium text-slate-300"
            >
              ID de Trabajador (Ej: E-123)
            </label>
            <input
              id="modalUserWorkerId"
              type="text"
              value={userWorkerId}
              onChange={(e) => setUserWorkerId(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="modalUserRole"
              className="block text-sm font-medium text-slate-300"
            >
              Rol
            </label>
            <select
              id="modalUserRole"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ENGINEER">Ingeniero (Sin contraseña)</option>
              <option value="ADMIN">Administrador (Requiere contraseña)</option>
            </select>
          </div>
          {userRole === "ADMIN" && (
            <div className="mb-4">
              <label
                htmlFor="modalUserPassword"
                className="block text-sm font-medium text-slate-300"
              >
                Contraseña para Admin
              </label>
              <input
                id="modalUserPassword"
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
                required={userRole === "ADMIN"}
                className="mt-1 block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm bg-slate-700 text-white focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeUserModal}
              className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={userLoading}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-500"
            >
              {userLoading ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </form>
      </ModalBase>
    </>
  );
}

// --- Componente Reutilizable para el Modal ---
function ModalBase({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 p-6 text-left align-middle shadow-2xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-4 text-slate-300">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
