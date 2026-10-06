"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";

type ToolMetric = {
  id: string;
  name: string;
  qrId: string;
  isCalibrationTool: boolean;
  nextCalibrationDate: string | null;
  metrics: {
    totalBusinessDays: number;
    usedDays: number;
    calibrationDays: number;
    unusedDays: number;
    usedPercent: string;
    calibrationPercent: string;
    expiredPercent: string;
    unusedPercent: string;
    avgCalibrationTime: string;
    daysToExpiration: number | null;
    delayInSending: number | null;
    currentCalibrationDuration: number | null;
  };
};

type ReportData = {
  year: number;
  totalBusinessDays: number;
  summary: {
    usedPercent: string;
    calibrationPercent: string;
    expiredPercent: string;
    unusedPercent: string;
  };
  tools: ToolMetric[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/reports?year=${year}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error al cargar reporte", error);
      }
      setIsLoading(false);
    };
    fetchReport();
  }, [year]);

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-brand-green-light">
            Reporte de Aprovechamiento
          </h1>
          <p className="text-brand-green-light/70 text-sm mt-1">
            Optimización de uso y tiempos de calibración de herramientas
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

      <div className="glass-panel p-6 flex flex-col gap-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">Resumen Anual: {year}</h2>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="glass-input !w-auto !py-2"
          >
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y} className="bg-slate-900">{y}</option>
            ))}
          </select>
        </div>

        {isLoading || !data ? (
          <div className="flex justify-center items-center py-20">
            <svg className="w-10 h-10 animate-spin text-brand-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        ) : (
          <>
            {/* Global Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-brand-green"></div>
                <span className="text-3xl font-black text-white">{data.summary.usedPercent}%</span>
                <span className="text-[10px] font-semibold text-brand-green-light mt-1 uppercase tracking-wider text-center">Tiempo en Uso</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-purple-500"></div>
                <span className="text-3xl font-black text-white">{data.summary.calibrationPercent}%</span>
                <span className="text-[10px] font-semibold text-purple-300 mt-1 uppercase tracking-wider text-center">En Calibración</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-amber-500"></div>
                <span className="text-3xl font-black text-white">{data.summary.expiredPercent}%</span>
                <span className="text-[10px] font-semibold text-amber-300 mt-1 uppercase tracking-wider text-center">Tiempo Vencida</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 w-full h-1 bg-slate-500"></div>
                <span className="text-3xl font-black text-white">{data.summary.unusedPercent}%</span>
                <span className="text-[10px] font-semibold text-slate-300 mt-1 uppercase tracking-wider text-center">Almacenado / Sin Uso</span>
              </div>
            </div>

            <div className="text-xs text-white/50 text-center">
              Basado en un estimado de {data.totalBusinessDays} días hábiles anuales.
              <br/>
              * Para registrar calibración, escribe la palabra "CALIBRACION" en el campo 'Cliente/Proyecto' al hacer el Check-Out.
            </div>

            {/* Tool List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-brand-green-light text-[11px] uppercase tracking-wider">
                    <th className="p-3 font-semibold min-w-[200px]">Herramienta</th>
                    <th className="p-3 font-semibold text-center min-w-[70px]">% Uso</th>
                    <th className="p-3 font-semibold text-center min-w-[70px]">% Calib.</th>
                    <th className="p-3 font-semibold text-center min-w-[70px]">% Venc.</th>
                    <th className="p-3 font-semibold text-center min-w-[70px]">% Sin Uso</th>
                    <th className="p-3 font-semibold text-center border-l border-white/10 min-w-[150px]">Vencimiento</th>
                    <th className="p-3 font-semibold text-center min-w-[150px]">Retraso en Envío</th>
                    <th className="p-3 font-semibold text-right min-w-[150px]">Promedio Calibración</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.tools.map(tool => (
                    <tr key={tool.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-white text-sm">{tool.name}</p>
                        <p className="text-[10px] text-white/50">{tool.qrId}</p>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-brand-green/20 text-brand-green-light rounded-md text-xs font-bold border border-brand-green/30">
                          {tool.metrics.usedPercent}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-xs font-bold border border-purple-500/30">
                          {tool.metrics.calibrationPercent}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-md text-xs font-bold border border-amber-500/30">
                          {tool.metrics.expiredPercent}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-slate-500/20 text-slate-300 rounded-md text-xs font-bold border border-slate-500/30">
                          {tool.metrics.unusedPercent}%
                        </span>
                      </td>
                      
                      {/* Vencimiento */}
                      <td className="p-3 text-center border-l border-white/10">
                        {tool.isCalibrationTool && tool.nextCalibrationDate ? (
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-white/80">{format(parseISO(tool.nextCalibrationDate), 'dd/MM/yyyy')}</span>
                            {(tool.metrics.daysToExpiration !== null && tool.metrics.daysToExpiration < 0) ? (
                              <span className="text-[10px] text-red-400 font-bold">Vencida hace {Math.abs(tool.metrics.daysToExpiration)} días</span>
                            ) : (
                              <span className="text-[10px] text-brand-green-light font-bold">Vigente</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-white/30">N/A</span>
                        )}
                      </td>
                      
                      {/* Retraso en Envío */}
                      <td className="p-3 text-center">
                        {tool.isCalibrationTool && tool.metrics.delayInSending !== null && tool.metrics.delayInSending > 0 ? (
                          <span className="text-xs font-bold text-amber-400">
                            {tool.metrics.delayInSending} días de retraso
                          </span>
                        ) : tool.isCalibrationTool ? (
                          <span className="text-xs text-white/50">Sin retraso</span>
                        ) : (
                          <span className="text-xs text-white/30">-</span>
                        )}
                      </td>

                      {/* Promedio Calibración */}
                      <td className="p-3 text-right">
                        {tool.metrics.currentCalibrationDuration !== null ? (
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-purple-300 font-bold bg-purple-500/20 px-2 py-0.5 rounded-md">
                              En lab: {tool.metrics.currentCalibrationDuration} días
                            </span>
                            <span className="text-[9px] text-white/50 mt-1">Promedio: {tool.metrics.avgCalibrationTime} d</span>
                          </div>
                        ) : (
                          <span className="text-white font-mono text-xs">
                            {tool.metrics.avgCalibrationTime} días
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.tools.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-white/50">
                        No hay herramientas registradas en el sistema.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
