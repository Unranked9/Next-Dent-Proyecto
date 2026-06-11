import axios from 'axios';
import type { Tarifario } from '../types/tarifario';

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

export const getActivos = (): Promise<Tarifario[]> =>
  api.get<Tarifario[]>('/tarifario').then((res) => res.data);

export const crear = (tarifa: Omit<Tarifario, 'idTarifa'>): Promise<Tarifario> =>
  api.post<Tarifario>('/tarifario', tarifa).then((res) => res.data);

export const actualizar = (id: number, tarifa: Omit<Tarifario, 'idTarifa'>): Promise<Tarifario> =>
  api.put<Tarifario>(`/tarifario/${id}`, tarifa).then((res) => res.data);

export const eliminar = (id: number): Promise<void> =>
  api.delete(`/tarifario/${id}`).then(() => undefined);
