import axios from 'axios';
import type { Cita, CitaPayload } from '../types/cita';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/citas',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error en citaService:', error);
    return Promise.reject(error);
  }
);

export const getCitas = (): Promise<Cita[]> =>
  api.get<Cita[]>('').then((res) => res.data);

export const createCita = (payload: CitaPayload): Promise<Cita> =>
  api.post<Cita>('', payload).then((res) => res.data);

export const updateCita = (id: number, payload: CitaPayload): Promise<Cita> =>
  api.put<Cita>(`/${id}`, payload).then((res) => res.data);

export const deleteCita = (id: number): Promise<void> =>
  api.delete(`/${id}`).then(() => undefined);
