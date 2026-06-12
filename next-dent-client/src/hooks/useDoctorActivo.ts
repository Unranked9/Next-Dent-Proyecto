import { useState, useEffect } from 'react';
import { getDoctores } from '../services/doctorService';
import type { Doctor } from '../types/doctor';

// Mientras no haya autenticación, cargamos el primer doctor de la BD.
// Cuando implementes JWT en Fase 3, solo cambia este hook para leer
// el doctor desde el token decodificado — el resto de la app no cambia.

interface DoctorActivoState {
  doctor: Doctor | null;
  loading: boolean;
  error: boolean;
}

export function useDoctorActivo(): DoctorActivoState {
  const [state, setState] = useState<DoctorActivoState>({
    doctor: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    getDoctores()
      .then((doctores) => {
        // Toma el primero de la lista. En Fase 3 reemplazar por el del token JWT.
        const primero = doctores.length > 0 ? doctores[0] : null;
        setState({ doctor: primero, loading: false, error: false });
      })
      .catch(() => {
        setState({ doctor: null, loading: false, error: true });
      });
  }, []);

  return state;
}

// Utilidad: obtiene las iniciales del doctor para el avatar
export const getIniciales = (doctor: Doctor | null): string => {
  if (!doctor) return '?';
  return `${doctor.nombre.charAt(0)}${doctor.apellido.charAt(0)}`.toUpperCase();
};

// Utilidad: nombre completo con título
export const getNombreCompleto = (doctor: Doctor | null): string => {
  if (!doctor) return 'Cargando...';
  return `Dr. ${doctor.nombre} ${doctor.apellido}`;
};
