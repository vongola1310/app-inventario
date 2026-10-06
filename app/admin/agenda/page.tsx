"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AgendaItem = {
  id: string;
  timestamp: string;
  toolName: string;
  toolQrId: string;
  userName: string;
  userWorkerId: string;
  clientName: string | null;
  comments: string | null;
  expectedReturnDate: string | null;
};

type AgendaResponse = {
  date: string;
  salidas: AgendaItem[];
  entradas: AgendaItem[];
  totalSalidas: number;
  totalEntradas: number;
};

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayString());
  const [data, setData] = useState<AgendaResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAgenda = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agenda?date=${date}`);
      if (!response.ok) throw new Error("Error al cargar agenda");
      const json: AgendaResponse = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
      setData(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAgenda(selectedDate);
  }, [selectedDate]);

  // Navegación rápida
  const shiftDay = (offset: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const newDate = new Date(y, m - 1, d + offset);
    const ny = newDate.getFullYear();
    const nm = String(newDate.getMonth() + 1).padStart(2, "0");
    const nd = String(newDate.getDate()).padStart(2, "0");
    setSelectedDate(`${ny}-${nm}-${nd}`);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatHumanDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-2xl">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-200 tracking-tight">
                    Agenda Diaria
                  </h1>
                  <p className="text-blue-200/70 text-sm mt-2 capitalize">
                    {formatHumanDate(selectedDate)}
                  </p>
                </div>
              </div>

              <Link href="/admin">
                <button className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all">
                  ← Volver al Panel
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Selector de fecha */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/20 p-5 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => shiftDay(-1)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold border border-white/20 transition-all"
            >
              ← Día anterior
            </button>

            <div className="flex-1 w-full">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-all text-center font-semibold"
              />
            </div>

            <button
              onClick={() => shiftDay(1)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold border border-white/20 transition-all"
            >
              Día siguiente →
            </button>

            <button
              onClick={() => setSelectedDate(todayString())}
              className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-bold shadow-lg shadow-cyan-500/40 hover:scale-105 transition-all"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Stats del día */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 backdrop-blur-2xl rounded-2xl border border-yellow-400/30 p-5">
            <p className="text-xs font-bold text-yellow-200/80 uppercase tracking-wider mb-2">
              Salidas del día
            </p>
            <p className="text-4xl font-black text-yellow-300">
              {data?.totalSalidas ?? 0}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-2xl rounded-2xl border border-green-400/30 p-5">
            <p className="text-xs font-bold text-green-200/80 uppercase tracking-wider mb-2">
              Devoluciones del día
            </p>
            <p className="text-4xl font-black text-green-300">
              {data?.totalEntradas ?? 0}
            </p>
          </div>
        </div>

        {/* Dos columnas: Salidas y Entradas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SALIDAS */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-transparent">
              <h2 className="text-xl font-black text-yellow-300 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Salidas
              </h2>
            </div>
            <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <p className="p-6 text-center text-slate-400">Cargando...</p>
              ) : !data || data.salidas.length === 0 ? (
                <p className="p-6 text-center text-slate-500">
                  Sin salidas en este día
                </p>
              ) : (
                data.salidas.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">{item.toolName}</p>
                        <p className="text-xs text-slate-400 font-mono">QR: {item.toolQrId}</p>
                      </div>
                      <span className="text-xs font-bold text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-full">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-300">
                        <span className="text-slate-500">Por:</span> {item.userName}{" "}
                        <span className="text-slate-500 text-xs">({item.userWorkerId})</span>
                      </p>
                      <p className="text-slate-300">
                        <span className="text-slate-500">Cliente:</span>{" "}
                        {item.clientName || "---"}
                      </p>
                      {item.expectedReturnDate && (
                        <p className="text-cyan-300 text-xs mt-2">
                          Retorno esperado:{" "}
                          {new Date(item.expectedReturnDate).toLocaleDateString("es-MX")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ENTRADAS */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            <div className="p-5 border-b border-white/10 bg-gradient-to-r from-green-500/10 to-transparent">
              <h2 className="text-xl font-black text-green-300 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Devoluciones
              </h2>
            </div>
            <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <p className="p-6 text-center text-slate-400">Cargando...</p>
              ) : !data || data.entradas.length === 0 ? (
                <p className="p-6 text-center text-slate-500">
                  Sin devoluciones en este día
                </p>
              ) : (
                data.entradas.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-white/5 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">{item.toolName}</p>
                        <p className="text-xs text-slate-400 font-mono">QR: {item.toolQrId}</p>
                      </div>
                      <span className="text-xs font-bold text-green-300 bg-green-500/20 px-2 py-1 rounded-full">
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-slate-300">
                        <span className="text-slate-500">Devuelto por:</span>{" "}
                        {item.userName}{" "}
                        <span className="text-slate-500 text-xs">({item.userWorkerId})</span>
                      </p>
                      {item.comments && (
                        <div className="mt-2 p-2 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                          <p className="text-xs text-pink-300/80 font-bold mb-1">
                            REPORTE:
                          </p>
                          <p className="text-xs text-pink-200">{item.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}