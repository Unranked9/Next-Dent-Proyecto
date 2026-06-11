import axios from 'axios';
import type { Evolucion } from '../types/hce';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8080/api',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error detallado en Axios:', error);
    return Promise.reject(error);
  }
);

export const getEvolucionesPorPaciente = (idPac: number): Promise<Evolucion[]> =>
  api.get<Evolucion[]>(`/evoluciones/paciente/${idPac}`).then((res) => res.data);

export const createEvolucion = (evolucion: Omit<Evolucion, 'idEvolucion'>): Promise<Evolucion> =>
  api.post<Evolucion>('/evoluciones', evolucion).then((res) => res.data);
