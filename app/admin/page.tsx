"use client";

import { useState, useEffect, Fragment } from "react";
import { useSession, signOut } from "next-auth/react";
import { Dialog } from "@headlessui/react";
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
  effectiveStatus: "AVAILABLE" | "IN_USE" | "IN_CALIBRATION" | "EXPIRED";
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

    try {
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
    } catch {
      setToolMessage({ type: "error", message: "No se pudo completar la operación. Comprueba la conexión y actualiza los datos antes de reintentar." });
    } finally {
      setToolLoading(false);
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
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

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
    } catch {
      setUserMessage({ type: "error", message: "No se pudo completar la operación. Comprueba la conexión y actualiza los datos antes de reintentar." });
    } finally {
      setUserLoading(false);
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

  const availableTools = dashboardData.filter(
    (tool) => tool.effectiveStatus === "AVAILABLE"
  ).length;
  const inUseTools = dashboardData.filter((tool) => tool.effectiveStatus === "IN_USE").length;
  const inCalibrationTools = dashboardData.filter(
    (tool) => tool.effectiveStatus === "IN_CALIBRATION"
  ).length;
  const overdueTools = dashboardData.filter((tool) => tool.isOverdue || tool.effectiveStatus === "EXPIRED").length;
  const totalTools = dashboardData.length;

  return (
    <>
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <header className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl shadow-slate-950/40">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-2xl shadow-lg shadow-emerald-900/50">
                  🛠️
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-emerald-300/80">Administración</p>
                  <h1 className="mt-1 text-3xl font-black md:text-4xl">Panel de Control</h1>
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span>{session?.user?.name || "Administrador"}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-[1.02]"
                >
                  Nuevo Usuario
                </button>
                <button
                  onClick={() => setIsToolModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
                >
                  Nueva Herramienta
                </button>
                <Link href="/admin/inventory" className="rounded-xl bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-700">
                  Inventario
                </Link>
                <Link href="/admin/calendar" className="rounded-xl bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-700">
                  Calendario
                </Link>
                <Link href="/admin/agenda" className="rounded-xl bg-slate-800 px-4 py-3 font-semibold text-slate-100 transition hover:bg-slate-700">
                  Agenda
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 font-bold text-white shadow-lg shadow-red-500/30 transition hover:scale-[1.02]"
                >
                  Salir
                </button>
              </div>
            </div>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Total" value={totalTools} helper="Herramientas registradas" tone="slate" />
            <StatCard label="Disponibles" value={availableTools} helper="Listas para usar" tone="emerald" />
            <StatCard label="En uso" value={inUseTools} helper="Actualmente prestadas" tone="amber" />
            <StatCard label="Calibración" value={inCalibrationTools} helper="En revisión" tone="cyan" />
            <StatCard label="Vencidas" value={overdueTools} helper="Con fecha vencida" tone="rose" />
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/20">
            <div className="mb-4 flex gap-2 border-b border-white/10 pb-2">
              <button
                onClick={() => setActiveTab("current")}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                  activeTab === "current" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Inventario actual
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`rounded-lg px-4 py-2 font-semibold transition ${
                  activeTab === "history" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Historial
              </button>
            </div>

            {activeTab === "current" ? (
              <div className="overflow-x-auto">
                {isLoadingData ? (
                  <div className="py-10 text-center text-slate-300">Cargando inventario...</div>
                ) : dashboardData.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">No hay herramientas registradas.</div>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-3 pr-4 font-medium">Herramienta</th>
                        <th className="pb-3 pr-4 font-medium">QR</th>
                        <th className="pb-3 pr-4 font-medium">Estado</th>
                        <th className="pb-3 pr-4 font-medium">Responsable</th>
                        <th className="pb-3 pr-4 font-medium">Ubicación</th>
                        <th className="pb-3 pr-4 font-medium">Próxima calibración</th>
                        <th className="pb-3 pr-4 font-medium">Entrega esperada</th>
                        <th className="pb-3 pr-4 font-medium">Último cambio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.map((tool) => (
                        <tr key={tool.id} className="border-b border-white/5 align-top text-slate-200">
                          <td className="py-3 pr-4">
                            <div className="font-bold text-white">{tool.name}</div>
                            <div className="text-xs text-slate-400">{tool.effectiveStatus}</div>
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-slate-300">{tool.qrId}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                tool.effectiveStatus === "AVAILABLE"
                                  ? "bg-emerald-500/20 text-emerald-200"
                                  : tool.effectiveStatus === "IN_USE"
                                    ? "bg-amber-500/20 text-amber-200"
                                    : tool.effectiveStatus === "IN_CALIBRATION"
                                      ? "bg-cyan-500/20 text-cyan-200"
                                      : "bg-rose-500/20 text-rose-200"
                              }`}
                            >
                              {tool.effectiveStatus === "AVAILABLE"
                                ? "Disponible"
                                : tool.effectiveStatus === "IN_USE"
                                  ? "En uso"
                                  : tool.effectiveStatus === "IN_CALIBRATION"
                                    ? "En calibración"
                                    : "Vencida"}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-300">{tool.who || "—"}</td>
                          <td className="py-3 pr-4 text-slate-300">{tool.where || "—"}</td>
                          <td className="py-3 pr-4 text-slate-300">{formatDate(tool.nextCalibrationDate)}</td>
                          <td className="py-3 pr-4 text-slate-300">{formatDate(tool.expectedReturnDate)}</td>
                          <td className="py-3 pr-4 text-slate-300">{formatDateTime(tool.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {isLoadingHistory ? (
                  <div className="py-10 text-center text-slate-300">Cargando historial...</div>
                ) : historyData.length === 0 ? (
                  <div className="py-10 text-center text-slate-400">No hay historial disponible.</div>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="pb-3 pr-4 font-medium">Herramienta</th>
                        <th className="pb-3 pr-4 font-medium">Acción</th>
                        <th className="pb-3 pr-4 font-medium">Usuario</th>
                        <th className="pb-3 pr-4 font-medium">Trabajador</th>
                        <th className="pb-3 pr-4 font-medium">Cliente/Proyecto</th>
                        <th className="pb-3 pr-4 font-medium">Comentario</th>
                        <th className="pb-3 pr-4 font-medium">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((record) => (
                        <tr key={record.id} className="border-b border-white/5 align-top text-slate-200">
                          <td className="py-3 pr-4">
                            <div className="font-bold text-white">{record.toolName}</div>
                            <div className="text-xs text-slate-400">{record.toolQrId}</div>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                record.action === "CHECK_OUT"
                                  ? "bg-amber-500/20 text-amber-200"
                                  : "bg-emerald-500/20 text-emerald-200"
                              }`}
                            >
                              {record.action === "CHECK_OUT" ? "Salida" : "Entrada"}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-slate-300">{record.userName}</td>
                          <td className="py-3 pr-4 text-slate-300">{record.userWorkerId}</td>
                          <td className="py-3 pr-4 text-slate-300">{record.clientName || "—"}</td>
                          <td className="py-3 pr-4 text-slate-300">{record.comments || "—"}</td>
                          <td className="py-3 pr-4 text-slate-300">{formatDateTime(record.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </section>
        </div>

        <Dialog as="div" className="relative z-50" open={isToolModalOpen} onClose={closeToolModal}>
          <div className="fixed inset-0 bg-slate-950/80" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
                <Dialog.Title as="h3" className="text-2xl font-bold text-white">Nueva herramienta</Dialog.Title>
                <form onSubmit={handleCreateTool} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">Nombre</label>
                    <input value={toolName} onChange={(e) => setToolName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none placeholder:text-slate-400 focus:border-emerald-500" placeholder="Taladro, llave, etc." required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">QR</label>
                    <input value={toolQrId} onChange={(e) => setToolQrId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none placeholder:text-slate-400 focus:border-emerald-500" placeholder="QR-001" required />
                  </div>
                  <label className="flex items-center gap-3 text-sm text-slate-200">
                    <input type="checkbox" checked={isCalibrationTool} onChange={(e) => setIsCalibrationTool(e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-slate-800 text-emerald-500" />
                    Es herramienta de calibración
                  </label>
                  {isCalibrationTool && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-200">Fecha de calibración</label>
                      <input type="date" value={nextCalibrationDate} onChange={(e) => setNextCalibrationDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500" />
                    </div>
                  )}
                  {toolMessage && (
                    <div className={`rounded-xl border px-3 py-2 text-sm ${toolMessage.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>
                      {toolMessage.message}
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={closeToolModal} className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 font-semibold text-slate-200">Cancelar</button>
                    <button type="submit" disabled={toolLoading} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{toolLoading ? "Guardando..." : "Guardar"}</button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>

        <Dialog as="div" className="relative z-50" open={isUserModalOpen} onClose={closeUserModal}>
          <div className="fixed inset-0 bg-slate-950/80" />
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
                <Dialog.Title as="h3" className="text-2xl font-bold text-white">Nuevo usuario</Dialog.Title>
                <form onSubmit={handleCreateUser} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">Nombre</label>
                    <input value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">Correo</label>
                    <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">ID de trabajador</label>
                    <input value={userWorkerId} onChange={(e) => setUserWorkerId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-200">Rol</label>
                    <select value={userRole} onChange={(e) => setUserRole(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500">
                      <option value="ENGINEER">ENGINEER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  {userRole === "ADMIN" && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-200">Contraseña</label>
                      <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none focus:border-emerald-500" />
                    </div>
                  )}
                  {userMessage && (
                    <div className={`rounded-xl border px-3 py-2 text-sm ${userMessage.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-rose-500/30 bg-rose-500/10 text-rose-200"}`}>
                      {userMessage.message}
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={closeUserModal} className="rounded-xl border border-white/10 bg-slate-800 px-4 py-2 font-semibold text-slate-200">Cancelar</button>
                    <button type="submit" disabled={userLoading} className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{userLoading ? "Guardando..." : "Guardar"}</button>
                  </div>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: number;
  helper: string;
  tone: "slate" | "emerald" | "amber" | "cyan" | "rose";
}) {
  const toneClasses = {
    slate: "border-white/10 bg-slate-900/80 text-slate-400",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    rose: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-xl shadow-slate-950/30 ${toneClasses[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-4 text-4xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-200/80">{helper}</p>
    </div>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
