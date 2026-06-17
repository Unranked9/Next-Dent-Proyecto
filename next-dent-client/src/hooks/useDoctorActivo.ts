import { useState, useEffect } from 'react';
import { getDoctores } from '../services/doctorService';
import axiosInstance from '../config/axiosInstance';
import { useAuth } from '../context/AuthContext';
import type { Doctor } from '../types/doctor';

interface DoctorActivoState {
  doctor: Doctor | null;
  loading: boolean;
  error: boolean;
}

export function useDoctorActivo(): DoctorActivoState {
  const { usuario } = useAuth();
  const [state, setState] = useState<DoctorActivoState>({
    doctor: null,
    loading: true,
    error: false,
  });

  useEffect(() => {
    setState({ doctor: null, loading: true, error: false });

    if (usuario?.idDoctor != null) {
      axiosInstance
        .get<Doctor>(`/doctores/${usuario.idDoctor}`)
        .then((res) => setState({ doctor: res.data, loading: false, error: false }))
        .catch(() => setState({ doctor: null, loading: false, error: true }));
    } else {
      getDoctores()
        .then((doctores) => {
          const primero = doctores.length > 0 ? doctores[0] : null;
          setState({ doctor: primero, loading: false, error: false });
        })
        .catch(() => setState({ doctor: null, loading: false, error: true }));
    }
  }, [usuario]);

  return state;
}

export const getIniciales = (doctor: Doctor | null): string => {
  if (!doctor) return '?';
  return `${doctor.nombre.charAt(0)}${doctor.apellido.charAt(0)}`.toUpperCase();
};

export const getNombreCompleto = (doctor: Doctor | null): string => {
  if (!doctor) return 'Cargando...';
  return `Dr. ${doctor.nombre} ${doctor.apellido}`;
};
