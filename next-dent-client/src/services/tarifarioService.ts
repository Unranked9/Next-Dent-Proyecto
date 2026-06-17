import axiosInstance from '../config/axiosInstance';
import type { Tarifario } from '../types/tarifario';

export const getActivos = (): Promise<Tarifario[]> =>
  axiosInstance.get<Tarifario[]>('/tarifario').then((res) => res.data);

export const crear = (tarifa: Omit<Tarifario, 'idTarifa'>): Promise<Tarifario> =>
  axiosInstance.post<Tarifario>('/tarifario', tarifa).then((res) => res.data);

export const actualizar = (id: number, tarifa: Omit<Tarifario, 'idTarifa'>): Promise<Tarifario> =>
  axiosInstance.put<Tarifario>(`/tarifario/${id}`, tarifa).then((res) => res.data);

export const eliminar = (id: number): Promise<void> =>
  axiosInstance.delete(`/tarifario/${id}`).then(() => undefined);
