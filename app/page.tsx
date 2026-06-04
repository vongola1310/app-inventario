'use client';

import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { RESPONSIVA } from './lib/responsiva';
import { addBusinessDays } from './lib/business-days';

type StatusMessage = {
  type: 'success' | 'error';
  message: string;
} | null;

/** Convierte un Date a formato YYYY-MM-DD para inputs type="date". */
function dateToInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Home() {
  // --- Estados ---
  const [scannedQrId, setScannedQrId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [workerId, setWorkerId] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage>(null);

  const [responsivaAccepted, setResponsivaAccepted] = useState<boolean>(false);
  const [showResponsivaModal, setShowResponsivaModal] = useState<boolean>(false);

  // Fecha esperada de retorno (string YYYY-MM-DD)
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [minReturnDate, setMinReturnDate] = useState<string>('');

  // Inicializar la fecha mínima (hoy + 1 día hábil)
  useEffect(() => {
    const min = addBusinessDays(new Date(), 1);
    const minStr = dateToInputValue(min);
    setMinReturnDate(minStr);
    setExpectedReturnDate(minStr); // valor inicial = mínimo
  }, []);

  // --- Lector QR ---
  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      'qr-reader',
      { qrbox: { width: 250, height: 250 }, fps: 10 },
      false
    );

    function onScanSuccess(decodedText: string) {
      setScannedQrId(decodedText);
    }
    function onScanError(_e: string) {}
    qrScanner.render(onScanSuccess, onScanError);

    return () => {
      qrScanner.clear();
    };
  }, []);

  // --- CHECK-OUT ---
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
    if (!expectedReturnDate) {
      setStatusMessage({
        type: 'error',
        message: 'Selecciona la fecha esperada de retorno',
      });
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);

    // Convertir YYYY-MM-DD a Date en zona local (mediodía para evitar problemas de timezone)
    const [y, m, d] = expectedReturnDate.split('-').map(Number);
    const returnDate = new Date(y, m - 1, d, 12, 0, 0);

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrId: scannedQrId,
        workerId,
        clientName,
        responsivaAccepted: true,
        responsivaVersion: RESPONSIVA.version,
        expectedReturnDate: returnDate.toISOString(),
      }),
    });

    const data = await response.json();
    setIsLoading(false);

    if (response.ok) {
      setStatusMessage({
        type: 'success',
        message: `¡${data.tool.name} sacada con éxito! Devolver antes del ${new Date(
          data.expectedReturnDate
        ).toLocaleDateString('es-MX')}`,
      });
      setScannedQrId('');
      setClientName('');
      setWorkerId('');
      setResponsivaAccepted(false);
      // Resetear fecha al mínimo nuevo (por si cruzó la medianoche)
      const min = addBusinessDays(new Date(), 1);
      const minStr = dateToInputValue(min);
      setMinReturnDate(minStr);
      setExpectedReturnDate(minStr);
    } else {
      setStatusMessage({ type: 'error', message: `Error: ${data.error}` });
    }
  };

  // --- CHECK-IN ---
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
        workerId,
        comments,
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none"></div>

      <div className="relative w-full max-w-3xl z-10">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
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

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-b border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl flex items-center justify-center border border-blue-400/30">
                <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">Escanear Código QR</h2>
                <p className="text-blue-200/60 text-sm mt-1">Apunta la cámara al código de la herramienta</p>
              </div>
            </div>
            <div id="qr-reader" className="rounded-2xl overflow-hidden shadow-2xl border-2 border-blue-400/30" style={{ minHeight: '300px' }}></div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {/* Código Detectado */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                Código Detectado
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={scannedQrId}
                  placeholder="Esperando escaneo del código QR..."
                  className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-green-400 transition-all font-mono text-sm"
                />
                {scannedQrId && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-xs font-bold text-green-400 uppercase">Detectado</span>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* ID Trabajador */}
            <div className="space-y-3">
              <label htmlFor="workerId" className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                ID del Trabajador
                <span className="ml-auto px-2 py-0.5 bg-red-500/20 text-red-300 text-xs font-bold rounded-full border border-red-400/30">Requerido</span>
              </label>
              <input
                id="workerId"
                type="text"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                placeholder="Ejemplo: EMP-123 o E-456"
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Cliente */}
            <div className="space-y-3">
              <label htmlFor="clientName" className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                Cliente / Proyecto
                <span className="ml-auto text-xs text-white/50 normal-case">Para check-out</span>
              </label>
              <input
                id="clientName"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ejemplo: Cliente ACME, Obra 501"
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/10 transition-all"
              />
            </div>

            {/* FECHA ESPERADA DE RETORNO */}
            <div className="space-y-3">
              <label htmlFor="returnDate" className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Fecha Esperada de Retorno
                <span className="ml-auto text-xs text-white/50 normal-case">Mínimo: 1 día hábil</span>
              </label>
              <input
                id="returnDate"
                type="date"
                value={expectedReturnDate}
                min={minReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all"
              />
              <p className="text-xs text-cyan-200/60 pl-1">
                Puedes extender la fecha si necesitas más días, pero no acortarla. Fines de semana y festivos no aplican.
              </p>
            </div>

            {/* Comentarios (check-in) */}
            <div className="space-y-3">
              <label htmlFor="comments" className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                Comentarios / Reporte
                <span className="ml-auto text-xs text-white/50 normal-case">Para check-in</span>
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ejemplo: Herramienta sucia, broca desgastada, falla detectada..."
                className="w-full px-5 py-4 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-amber-400 focus:bg-white/10 transition-all resize-none"
                rows={3}
              />
            </div>

            {/* CARTA RESPONSIVA */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-white/90 uppercase tracking-wide">
                Carta Responsiva
                <span className="ml-auto px-2 py-0.5 bg-pink-500/20 text-pink-300 text-xs font-bold rounded-full border border-pink-400/30">Obligatorio para sacar</span>
              </label>
              <div className="rounded-2xl border-2 border-pink-400/20 bg-gradient-to-br from-pink-500/5 to-purple-500/5 p-5 space-y-4">
                <p className="text-sm text-pink-100/90 leading-relaxed">
                  <span className="font-bold text-pink-300">Aviso:</span>{' '}
                  {RESPONSIVA.shortNotice} El registro electrónico de la salida tiene la misma validez que una carta responsiva firmada físicamente.
                </p>
                <button
                  type="button"
                  onClick={() => setShowResponsivaModal(true)}
                  className="text-xs font-semibold text-pink-300 hover:text-pink-200 underline underline-offset-4"
                >
                  Leer texto completo ({RESPONSIVA.version})
                </button>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={responsivaAccepted}
                    onChange={(e) => setResponsivaAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-2 border-pink-400/40 bg-white/5 accent-pink-500"
                  />
                  <span className="text-sm text-white/90">
                    He leído y acepto los términos de la carta responsiva.
                  </span>
                </label>
              </div>
            </div>

            {/* Mensajes */}
            {statusMessage && (
              <div
                className={`w-full p-5 rounded-2xl border-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-green-500/10 border-green-400/30 text-green-300'
                    : 'bg-red-500/10 border-red-400/30 text-red-300'
                }`}
              >
                <p className="font-bold">{statusMessage.message}</p>
              </div>
            )}

            {/* Botones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <button
                onClick={handleCheckOut}
                disabled={isLoading || !scannedQrId || !workerId || !responsivaAccepted || !expectedReturnDate}
                className="px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl font-black text-lg text-white shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/80 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all uppercase tracking-wide"
              >
                {isLoading ? 'Procesando...' : 'Sacar Herramienta'}
              </button>
              <button
                onClick={handleCheckIn}
                disabled={isLoading || !scannedQrId || !workerId}
                className="px-8 py-5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl font-black text-lg text-white shadow-2xl shadow-green-500/50 hover:shadow-green-500/80 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all uppercase tracking-wide"
              >
                {isLoading ? 'Procesando...' : 'Devolver Herramienta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal responsiva */}
      {showResponsivaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowResponsivaModal(false)}>
          <div className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-purple-950 border-2 border-pink-400/30 rounded-3xl shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setShowResponsivaModal(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white"
            >
              ✕
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