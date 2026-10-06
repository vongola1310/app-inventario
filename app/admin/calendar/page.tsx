"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import { Dialog, Transition } from "@headlessui/react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  eachDayOfInterval,
  parseISO
} from "date-fns";
import { es } from "date-fns/locale";

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

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<HistoryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (evt: HistoryRecord) => {
    setSelectedEvent(evt);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/history");
        if (response.ok) {
          const data = await response.json();
          setHistoryData(data);
        }
      } catch (error) {
        console.error("Error fetching history", error);
      }
      setIsLoading(false);
    };
    fetchHistory();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(historyData.map((h) => h.userName)));

  // Filter history
  const filteredHistory = historyData.filter((h) => 
    selectedUser === "ALL" || h.userName === selectedUser
  );

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-green-light">
            Calendario de Historial
          </h1>
          <p className="text-brand-green-light/70 text-sm mt-1">
            Visualiza los movimientos de herramientas por fecha
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <button className="glass-button-outline flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver al Panel
            </button>
          </Link>
        </div>
      </div>

      <div className="glass-panel p-6 flex flex-col gap-6">
        {/* Toolbar: Month Navigation & Filter */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-full transition text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-white min-w-[200px] text-center capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-full transition text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-sm font-semibold text-brand-green-light">Filtrar Usuario:</label>
            <select 
              className="glass-input !w-auto"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="ALL" className="bg-slate-900">Todos</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u} className="bg-slate-900">{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <svg className="w-10 h-10 animate-spin text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center font-bold text-brand-green-light py-2 bg-white/5 rounded-lg border border-white/5">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  // Get events for this day
                  const dayEvents = filteredHistory.filter((h) => {
                    return format(parseISO(h.timestamp), "yyyy-MM-dd") === dateStr;
                  });

                  const isCurrentMonth = isSameMonth(day, monthStart);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div 
                      key={day.toString()} 
                      className={`min-h-[120px] p-2 rounded-xl border transition-all ${
                        !isCurrentMonth ? "bg-white/5 border-transparent opacity-40" : 
                        isToday ? "bg-brand-green/10 border-brand-green shadow-[0_0_15px_rgba(119,191,86,0.2)]" : "bg-white/5 border-white/10 hover:border-brand-green/50 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? "bg-brand-green text-white" : "text-white/80"}`}>
                          {format(day, dateFormat)}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-xs font-bold text-white/50 bg-black/30 px-2 py-0.5 rounded-full">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayEvents.map((evt) => {
                          const isCalibrationSend = evt.action === "CHECK_OUT" && evt.clientName === "CALIBRACION";
                          const isCalibrationReturn = evt.action === "CHECK_IN" && evt.clientName === "REGRESO_CALIBRACION";
                          let colorClass = "";
                          if (isCalibrationSend) colorClass = "bg-amber-500/20 border-amber-400/30 text-amber-100 hover:border-amber-400";
                          else if (isCalibrationReturn) colorClass = "bg-purple-500/20 border-purple-400/30 text-purple-100 hover:border-purple-400";
                          else if (evt.action === "CHECK_OUT") colorClass = "bg-blue-500/20 border-blue-400/30 text-blue-100 hover:border-blue-400";
                          else colorClass = "bg-brand-green-dark/20 border-brand-green/30 text-brand-green-light hover:border-brand-green";

                          return (
                            <button 
                              key={evt.id} 
                              onClick={() => openModal(evt)}
                              className={`text-[10px] text-left p-1.5 rounded-md flex flex-col gap-0.5 border transition-all hover:scale-105 cursor-pointer ${colorClass}`}
                              title="Ver detalles"
                            >
                              <span className="font-bold truncate">
                                {isCalibrationSend ? "⚠️ Envío a Calib." : isCalibrationReturn ? "✅ Regreso Calib." : evt.action === "CHECK_OUT" ? "↗ Sacó" : "↙ Devolvió"}
                              </span>
                              <span className="truncate">{evt.toolName}</span>
                              <span className="truncate opacity-70 text-[9px]">{evt.userName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 p-8 text-left shadow-2xl transition-all">
                  {selectedEvent && (
                    <>
                      <Dialog.Title as="h3" className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl shadow-inner">
                          {selectedEvent.action === "CHECK_OUT" && selectedEvent.clientName === "CALIBRACION" ? "🔬" : 
                           selectedEvent.action === "CHECK_IN" && selectedEvent.clientName === "REGRESO_CALIBRACION" ? "✅" :
                           selectedEvent.action === "CHECK_OUT" ? "↗️" : "↙️"}
                        </div>
                        Detalles del Movimiento
                      </Dialog.Title>

                      <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <p className="text-xs text-brand-green-light font-bold uppercase tracking-wider mb-1">Herramienta</p>
                          <p className="text-lg text-white font-bold">{selectedEvent.toolName}</p>
                          <p className="text-xs text-slate-400 mt-1 font-mono">QR: {selectedEvent.toolQrId}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-brand-green-light font-bold uppercase tracking-wider mb-1">Responsable</p>
                            <p className="text-sm text-white font-bold">{selectedEvent.userName}</p>
                          </div>
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-brand-green-light font-bold uppercase tracking-wider mb-1">Hora Exacta</p>
                            <p className="text-sm text-white font-bold">{format(parseISO(selectedEvent.timestamp), "HH:mm a")}</p>
                          </div>
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                          <p className="text-xs text-brand-green-light font-bold uppercase tracking-wider mb-1">Tipo de Movimiento</p>
                          <p className="text-sm text-white font-bold">
                            {selectedEvent.action === "CHECK_OUT" && selectedEvent.clientName === "CALIBRACION" ? "Mandar a Calibración" : 
                             selectedEvent.action === "CHECK_IN" && selectedEvent.clientName === "REGRESO_CALIBRACION" ? "Regreso de Calibración" :
                             selectedEvent.action === "CHECK_OUT" ? "Salida a Proyecto" : "Devolución a Inventario"}
                          </p>
                          {selectedEvent.clientName && !["CALIBRACION", "REGRESO_CALIBRACION"].includes(selectedEvent.clientName) && (
                             <p className="text-xs text-slate-300 mt-2">Proyecto / Destino: <span className="font-bold text-white">{selectedEvent.clientName}</span></p>
                          )}
                        </div>
                      </div>

                      <div className="mt-8">
                        <button
                          type="button"
                          className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95"
                          onClick={closeModal}
                        >
                          Cerrar Detalles
                        </button>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(119, 191, 86, 0.5);
        }
      `}</style>
    </div>
  );
}
