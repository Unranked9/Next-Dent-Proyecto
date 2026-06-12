import { useState, useEffect, useCallback, useRef } from 'react';
import { getCitas } from '../services/citaService';
import { getPacientes } from '../services/pacienteService';
import { getDeudaPaciente } from '../services/pagoService';
import type { Cita } from '../types/cita';

const POLL_INTERVAL_MS = 60_000; // refresca cada 60 segundos

export type TipoNotificacion = 'cita_pendiente' | 'cita_confirmada' | 'cobro_pendiente';

export interface Notificacion {
  id: string;                    // id único para React keys
  tipo: TipoNotificacion;
  titulo: string;
  descripcion: string;
  hora: string;                  // hora de la cita, para ordenar
  leida: boolean;
  citaId?: number;
}

interface NotificacionesState {
  notificaciones: Notificacion[];
  noLeidas: number;
  loading: boolean;
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
  refresh: () => void;
}

// Acepta "YYYY-MM-DD", "DD/MM/YYYY" y "YYYY-MM-DDTHH:mm:ss"
const esHoy = (fechaStr: string): boolean => {
  if (!fechaStr) return false;
  const hoy = new Date();
  let fecha: Date;

  if (fechaStr.includes('T')) {
    fecha = new Date(fechaStr);
  } else if (fechaStr.includes('/')) {
    const [d, m, y] = fechaStr.split('/');
    fecha = new Date(Number(y), Number(m) - 1, Number(d));
  } else {
    const [y, m, d] = fechaStr.split('-');
    fecha = new Date(Number(y), Number(m) - 1, Number(d));
  }

  if (isNaN(fecha.getTime())) return false;
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
};

// Convierte una cita en notificación según su estado
const citaANotificacion = (cita: Cita): Notificacion | null => {
  if (!cita.paciente) return null;
  const estado = cita.estado?.toLowerCase() ?? '';
  const nombre = `${cita.paciente.nombre} ${cita.paciente.apellido}`;
  const hora = cita.hora ?? '';

  if (estado === 'pendiente') {
    return {
      id: `cita-pendiente-${cita.idCita}`,
      tipo: 'cita_pendiente',
      titulo: 'Cita pendiente',
      descripcion: `${nombre} a las ${hora}`,
      hora,
      leida: false,
      citaId: cita.idCita,
    };
  }

  if (estado === 'confirmada') {
    return {
      id: `cita-confirmada-${cita.idCita}`,
      tipo: 'cita_confirmada',
      titulo: 'Cita confirmada',
      descripcion: `${nombre} a las ${hora}`,
      hora,
      leida: false,
      citaId: cita.idCita,
    };
  }

  return null;
};

export function useNotificaciones(): NotificacionesState {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  // Guardamos los IDs leídos en memoria para que no se pierdan al hacer polling
  const leidasRef = useRef<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCitas = useCallback(async () => {
    try {
      const [citas, pacientes] = await Promise.all([getCitas(), getPacientes()]);
      const citasHoy = citas.filter((c) => c.fecha !== null && esHoy(c.fecha));

      const nuevas: Notificacion[] = citasHoy
        .map(citaANotificacion)
        .filter((n): n is Notificacion => n !== null)
        .sort((a, b) => a.hora.localeCompare(b.hora))
        // Preservar estado "leída" de sesiones anteriores del polling
        .map((n) => ({ ...n, leida: leidasRef.current.has(n.id) }));

      // Cobros pendientes: un aviso por paciente con detalles REALIZADO + saldo > 0
      const resultados = await Promise.allSettled(
        pacientes.map((p) =>
          getDeudaPaciente(p.idPac).then((deuda) => ({ paciente: p, deuda }))
        )
      );

      for (const r of resultados) {
        if (r.status === 'fulfilled') {
          const { paciente, deuda } = r.value;
          const pendientes = deuda.filter(
            (d) => d.estado === 'REALIZADO' && Number(d.saldoPendiente) > 0
          );
          if (pendientes.length > 0) {
            const total = pendientes.reduce((s, d) => s + Number(d.saldoPendiente), 0);
            const nombre = `${paciente.nombre} ${paciente.apellido}`;
            const id = `cobro-pendiente-${paciente.idPac}`;
            nuevas.push({
              id,
              tipo: 'cobro_pendiente',
              titulo: 'Cobro pendiente',
              descripcion: `${nombre} · S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por cobrar`,
              hora: '00:00',
              leida: leidasRef.current.has(id),
            });
          }
        }
      }

      setNotificaciones(nuevas);
    } catch {
      // Fallo silencioso: las notificaciones no son críticas
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCitas();
    intervalRef.current = setInterval(fetchCitas, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchCitas]);

  const marcarLeida = useCallback((id: string) => {
    leidasRef.current.add(id);
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  }, []);

  const marcarTodasLeidas = useCallback(() => {
    setNotificaciones((prev) => {
      prev.forEach((n) => leidasRef.current.add(n.id));
      return prev.map((n) => ({ ...n, leida: true }));
    });
  }, []);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return {
    notificaciones,
    noLeidas,
    loading,
    marcarLeida,
    marcarTodasLeidas,
    refresh: fetchCitas,
  };
}
