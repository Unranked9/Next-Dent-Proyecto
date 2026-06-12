import { useState, useEffect, useCallback, useRef } from 'react';
import { getPacientes } from '../services/pacienteService';
import { getDeudaPaciente } from '../services/pagoService';
import type { DeudaDetalle } from '../services/pagoService';
import type { Paciente } from '../types/paciente';

const POLL_INTERVAL_MS = 60_000;

export interface PacientePorCobrar {
  paciente: Paciente;
  detallesPendientes: DeudaDetalle[];
  totalPendiente: number;
}

interface PorCobrarState {
  porCobrar: PacientePorCobrar[];
  total: number;
  loading: boolean;
  refresh: () => void;
}

export function usePorCobrar(): PorCobrarState {
  const [porCobrar, setPorCobrar] = useState<PacientePorCobrar[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const pacientes = await getPacientes();
      const resultados = await Promise.allSettled(
        pacientes.map((p) =>
          getDeudaPaciente(p.idPac).then((deuda) => ({ paciente: p, deuda }))
        )
      );

      const lista: PacientePorCobrar[] = [];
      for (const r of resultados) {
        if (r.status === 'fulfilled') {
          const { paciente, deuda } = r.value;
          const detallesPendientes = deuda.filter(
            (d) => d.estado === 'REALIZADO' && Number(d.saldoPendiente) > 0
          );
          if (detallesPendientes.length > 0) {
            lista.push({
              paciente,
              detallesPendientes,
              totalPendiente: detallesPendientes.reduce(
                (s, d) => s + Number(d.saldoPendiente),
                0
              ),
            });
          }
        }
      }

      setPorCobrar(lista);
    } catch {
      // Fallo silencioso: los cobros pendientes no son críticos
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  return {
    porCobrar,
    total: porCobrar.length,
    loading,
    refresh: fetchData,
  };
}
