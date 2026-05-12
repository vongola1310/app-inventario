'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { RESPONSIVA } from './lib/responsiva';

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

export default function Home() {
  // --- Estados de React ---
  const [scannedQrId, setScannedQrId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [workerId, setWorkerId] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);

  // --- Carta Responsiva ---
  const [responsivaAccepted, setResponsivaAccepted] = useState<boolean>(false);
  const [showResponsivaModal, setShowResponsivaModal] = useState<boolean>(false);

  // --- Configuración del Lector QR ---
  useEffect(() => {
    const scannerReaderId = 'qr-reader';
    const qrScanner = new Html5QrcodeScanner(
      scannerReaderId,
      { qrbox: { width: 250, height: 250 }, fps: 10 },
      false
    );

    function onScanSuccess(decodedText: string) {
      setScannedQrId(decodedText);
    }
    function onScanError(_errorMessage: string) {
      /* no hacer nada */
    }
    qrScanner.render(onScanSuccess, onScanError);

    return () => {
      qrScanner.clear();
    };
  }, []);

  // --- Lógica de la API ---

  // Función para manejar el CHECK-OUT
  const handleCheckOut = async () => {
    if (!scannedQrId || !workerId) {
      setStatusMessage({
        type: 'error',
        message: 'Escanea QR e ingresa tu ID de Trabajador',
      });
      return;
    }
    if (!responsivaAccepted) {
      setStatusMessage({
        type: 'error',
        message: 'Debes aceptar la carta responsiva antes de sacar la herramienta',
      });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrId: scannedQrId,
        workerId: workerId,
        clientName: clientName,
        responsivaAccepted: true,
        responsivaVersion: RESPONSIVA.version,
      }),
    });

    const data = await response.json();
    setIsLoading(false);

    if (response.ok) {
      setStatusMessage({
        type: 'success',
        message: `¡${data.tool.name} sacada con éxito!`,
      });
      setScannedQrId('');
      setClientName('');
      setWorkerId('');
      setResponsivaAccepted(false);
    } else {
      setStatusMessage({ type: 'error', message: `Error: ${data.error}` });
    }
  };

  // Función para manejar el CHECK-IN
  const handleCheckIn = async () => {
    if (!scannedQrId || !workerId) {
      setStatusMessage({
        type: 'error',
        message: 'Escanea QR e ingresa tu ID de Trabajador',
      });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);

    const response = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrId: scannedQrId,
        workerId: workerId,
        comments: comments,
      }),
    });

    const data = await response.json();
    setIsLoading(false);

    if (response.ok) {
      setStatusMessage({
        type: 'success',
        message: `¡${data.tool.name} devuelta con éxito!`,
      });
      setScannedQrId('');
      setWorkerId('');
      setComments('');
    } else {
      setStatusMessage({ type: 'error', message: `Error: ${data.error}` });
    }
  };

  // --- Interfaz de Usuario (JSX + Tailwind) ---
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      {/* Patrón de cuadrícula sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative w-full max-w-3xl z-10">
        {/* Header Premium */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 mb-3 tracking-tight">
            Control de Herramientas
          </h1>
          <p className="text-blue-200/80 text-lg md:text-xl font-medium">
            Sistema de Gestión Inteligente
          </p>
        </div>

        {/* Card Principal Premium */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Scanner QR Section */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-b border-white/10">
            <div className="flex items-center gap-4 mb-6">
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
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Escanear Código QR
                </h2>
                <p className="text-blue-200/60 text-sm mt-1">
                  Apunta la cámara al código de la herramienta
                </p>
              </div>
            </div>
            <div
              id="qr-reader"
              className="rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-400/30"
              style={{ minHeight: '300px' }}
            ></div>
          </div>

          {/* Formulario Premium */}
          <div className="p-6 md:p-8 space-y-6">
            {/* QR Escaneado */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                <svg
                  className="w-5 h-5 text-green-400"
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
                Código Detectado
              </label>
              <div className="relative group">
                <input
                  type="text"
                  readOnly
                  value={scannedQrId}
                  placeholder="Esperando escaneo del código QR..."
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-green-400 transition-all font-mono text-sm backdrop-blur-xl"
                />
                {scannedQrId && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-xs font-bold text-green-400 uppercase">
                      Detectado
                    </span>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  </div>
                )}
              </div>
            </div>

            {/* ID del Trabajador */}
            <div className="space-y-3">
              <label
                htmlFor="workerId"
                className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide"
              >
                <svg
                  className="w-5 h-5 text-blue-400"
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
                ID del Trabajador
                <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-400/30">
                  Requerido
                </span>
              </label>
              <input
                id="workerId"
                type="text"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                placeholder="Ejemplo: EMP-123 o E-456"
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all backdrop-blur-xl"
              />
            </div>

            {/* Cliente/Trabajo */}
            <div className="space-y-3">
              <label
                htmlFor="clientName"
                className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide"
              >
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Cliente / Proyecto
                <span className="ml-auto text-xs text-white/50 normal-case">
                  Para check-out
                </span>
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ejemplo: Cliente ACME, Obra 501"
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all backdrop-blur-xl"
              />
            </div>

            {/* Comentarios */}
            <div className="space-y-3">
              <label
                htmlFor="comments"
                className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide"
              >
                <svg
                  className="w-5 h-5 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                Comentarios / Reporte
                <span className="ml-auto text-xs text-white/50 normal-case">
                  Para check-in
                </span>
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ejemplo: Herramienta sucia, broca desgastada, falla detectada..."
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 focus:bg-white/10 transition-all backdrop-blur-xl resize-none"
                rows={3}
              />
            </div>

            {/* --- CARTA RESPONSIVA --- */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                <svg
                  className="w-5 h-5 text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Carta Responsiva
                <span className="ml-auto px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs font-bold rounded-full border border-pink-400/30">
                  Obligatorio para sacar
                </span>
              </label>

              <div className="rounded-2xl border-2 border-pink-400/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5 p-5 space-y-4 backdrop-blur-xl">
                <p className="text-sm text-pink-100/90 leading-relaxed">
                  <span className="font-bold text-pink-300">Aviso:</span>{' '}
                  {RESPONSIVA.shortNotice} El registro electrónico de la salida
                  de la herramienta, vinculado a tu ID de Trabajador, tiene la
                  misma validez que una carta responsiva firmada físicamente.
                </p>

                <button
                  type="button"
                  onClick={() => setShowResponsivaModal(true)}
                  className="text-xs font-semibold text-pink-300 hover:text-pink-200 underline underline-offset-4 transition-colors"
                >
                  Leer texto completo de la carta responsiva ({RESPONSIVA.version})
                </button>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={responsivaAccepted}
                    onChange={(e) => setResponsivaAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-pink-400/40 bg-white/5 text-pink-500 focus:ring-2 focus:ring-pink-400 focus:ring-offset-0 cursor-pointer accent-pink-500"
                  />
                  <span className="text-sm text-white/90 group-hover:text-white transition-colors">
                    He leído y acepto los términos de la carta responsiva.
                    Confirmo que me hago responsable de la herramienta durante
                    el periodo de préstamo.
                  </span>
                </label>
              </div>
            </div>
            {/* --- FIN CARTA RESPONSIVA --- */}

            {/* Mensajes de Estado Premium */}
            {statusMessage && (
              <div
                className={`w-full p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300 border-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-green-500/10 border-green-400/30 text-green-300'
                    : 'bg-red-500/10 border-red-400/30 text-red-300'
                }`}
              >
                <div className="flex-shrink-0">
                  {statusMessage.type === 'success' ? (
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
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
                  ) : (
                    <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{statusMessage.message}</p>
                </div>
              </div>
            )}

            {/* Botones de Acción Premium */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleCheckOut}
                disabled={
                  isLoading || !scannedQrId || !workerId || !responsivaAccepted
                }
                className="group relative px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-lg text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/80 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative flex flex-col items-center gap-2">
                  <svg
                    className="w-8 h-8"
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
                  <span className="uppercase tracking-wide">
                    {isLoading ? 'Procesando...' : 'Sacar Herramienta'}
                  </span>
                </div>
              </button>

              <button
                onClick={handleCheckIn}
                disabled={isLoading || !scannedQrId || !workerId}
                className="group relative px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl font-black text-lg text-white shadow-2xl shadow-green-500/50 hover:shadow-green-500/80 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-30 transition-opacity"></div>
                <div className="relative flex flex-col items-center gap-2">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span className="uppercase tracking-wide">
                    {isLoading ? 'Procesando...' : 'Devolver Herramienta'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Premium */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-xl rounded-full border border-white/10">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <p className="text-blue-200/80 text-sm font-semibold">
              Sistema v3.1 • Carta Responsiva Digital
            </p>
          </div>
        </div>
      </div>

      {/* --- MODAL DE TEXTO COMPLETO --- */}
      {showResponsivaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowResponsivaModal(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-purple-950 border-2 border-pink-400/30 rounded-3xl shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowResponsivaModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all"
              aria-label="Cerrar"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-purple-200 mb-2">
              {RESPONSIVA.title}
            </h3>
            <p className="text-xs text-pink-300/70 mb-6 font-mono">
              Versión {RESPONSIVA.version} · Vigente desde {RESPONSIVA.effectiveDate}
            </p>
            <div className="text-sm text-white/85 leading-relaxed whitespace-pre-line">
              {RESPONSIVA.body}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}