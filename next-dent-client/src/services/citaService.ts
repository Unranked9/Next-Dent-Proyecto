import axiosInstance from '../config/axiosInstance';
import type { Cita, CitaPayload } from '../types/cita';

export const getCitas = (): Promise<Cita[]> =>
  axiosInstance.get<Cita[]>('/citas').then((res) => res.data);

export const createCita = (payload: CitaPayload): Promise<Cita> =>
  axiosInstance.post<Cita>('/citas', payload).then((res) => res.data);

export const updateCita = (id: number, payload: CitaPayload): Promise<Cita> =>
  axiosInstance.put<Cita>(`/citas/${id}`, payload).then((res) => res.data);

export const deleteCita = (id: number): Promise<void> =>
  axiosInstance.delete(`/citas/${id}`).then(() => undefined);
