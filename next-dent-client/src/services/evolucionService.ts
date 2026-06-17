import type { Evolucion } from '../types/hce';
import axiosInstance from '../config/axiosInstance';

export const getEvolucionesPorPaciente = (idPac: number): Promise<Evolucion[]> =>
  axiosInstance.get<Evolucion[]>(`/evoluciones/paciente/${idPac}`).then((res) => res.data);

export const createEvolucion = (evolucion: Omit<Evolucion, 'idEvolucion'>): Promise<Evolucion> =>
  axiosInstance.post<Evolucion>('/evoluciones', evolucion).then((res) => res.data);
