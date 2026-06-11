import axios from 'axios';
import type { Cita } from '../types/cita';

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

export const getCitas = (): Promise<Cita[]> =>
  api.get<Cita[]>('/citas').then((res) => res.data);

export const createCita = (cita: Omit<Cita, 'idCita'>): Promise<Cita> =>
  api.post<Cita>('/citas', cita).then((res) => res.data);

export const updateCita = (id: number, cita: Omit<Cita, 'idCita'>): Promise<Cita> =>
  api.put<Cita>(`/citas/${id}`, cita).then((res) => res.data);

export const deleteCita = (id: number): Promise<void> =>
  api.delete(`/citas/${id}`).then(() => undefined);
