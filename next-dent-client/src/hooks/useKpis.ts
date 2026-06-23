import { useState, useEffect, useCallback, useRef } from 'react';
import { getPacientes } from '../services/pacienteService';
import { getCitas } from '../services/citaService';
import { getPagos } from '../services/pagoService';
import type { Paciente } from '../types/paciente';
import type { Cita } from '../types/cita';
import type { Pago } from '../types/pago';

const POLL_INTERVAL_MS = 30_000;

export interface KpiData {
  totalPacientes: number;
  citasHoy: number;
  citasPendientesHoy: number;
  cobradoHoy: number;
  // true = ese endpoint falló; el KPI muestra "—" en lugar de bloquear los 4
  errorPacientes: boolean;
  errorCitas: boolean;
  errorPagos: boolean;
  loading: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────
// Acepta "YYYY-MM-DD", "DD/MM/YYYY" y "YYYY-MM-DDTHH:mm:ss" (ISO)
const esHoy = (fechaStr: string | null | undefined): boolean => {
  if (!fechaStr) return false;
  const hoy = new Date();
  let fecha: Date;

  if (fechaStr.includes('T')) {
    fecha = new Date(fechaStr);                                   // ISO 8601
  } else if (fechaStr.includes('/')) {
    const [d, m, y] = fechaStr.split('/');
    fecha = new Date(Number(y), Number(m) - 1, Number(d));       // DD/MM/YYYY
  } else {
    const [y, m, d] = fechaStr.split('-');
    fecha = new Date(Number(y), Number(m) - 1, Number(d));       // YYYY-MM-DD
  }

  if (isNaN(fecha.getTime())) return false;
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth()    === hoy.getMonth()    &&
    fecha.getDate()     === hoy.getDate()
  );
};

// ── Cálculo de KPIs en cliente ────────────────────────────────────────────────
const calcularKpis = (pacientes: Paciente[], citas: Cita[], pagos: Pago[]) => {
  const citasDeHoy = citas.filter((c) => esHoy(c.fecha));

  const citasPendientesHoy = citasDeHoy.filter((c) => {
    const estado = c.estado?.toLowerCase() ?? '';
    return estado !== 'completada' && estado !== 'cancelada' && estado !== 'atendida';
  }).length;

  // montoTotal viene del modelo Java como BigDecimal → Jackson lo serializa como number
  const cobradoHoy = pagos
    .filter((p) => esHoy(p.fechaPago))
    .reduce((sum, p) => sum + (Number(p.montoTotal) || 0), 0);

  return { totalPacientes: pacientes.length, citasHoy: citasDeHoy.length, citasPendientesHoy, cobradoHoy };
};

// ── Hook principal ────────────────────────────────────────────────────────────
export function useKpis(): KpiData {
  const [state, setState] = useState<Omit<KpiData, 'refresh'>>({
    totalPacientes: 0, citasHoy: 0, citasPendientesHoy: 0, cobradoHoy: 0,
    errorPacientes: false, errorCitas: false, errorPagos: false,
    loading: true, lastUpdated: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    // allSettled → si un endpoint falla, los otros siguen
    const [resPacientes, resCitas, resPagos] = await Promise.allSettled([
      getPacientes(),
      getCitas(),
      getPagos(),
    ]);

    const pacientes: Paciente[] = resPacientes.status === 'fulfilled' ? resPacientes.value : [];
    const citas: Cita[]         = resCitas.status    === 'fulfilled' ? resCitas.value    : [];
    const pagos: Pago[]         = resPagos.status    === 'fulfilled' ? resPagos.value    : [];

    setState({
      ...calcularKpis(pacientes, citas, pagos),
      errorPacientes: resPacientes.status === 'rejected',
      errorCitas:     resCitas.status     === 'rejected',
      errorPagos:     resPagos.status     === 'rejected',
      loading: false,
      lastUpdated: new Date(),
    });
  }, []);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  return { ...state, refresh: fetchAll };
}
