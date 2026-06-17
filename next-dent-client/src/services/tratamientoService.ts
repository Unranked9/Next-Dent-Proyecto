import type { Tratamiento } from '../types/tratamiento';
import axiosInstance from '../config/axiosInstance';

export const getTratamientos = (): Promise<Tratamiento[]> =>
  axiosInstance.get<Tratamiento[]>('/tratamientos').then((res) => res.data);

export const createTratamiento = (tratamiento: Omit<Tratamiento, 'idTrat'>): Promise<Tratamiento> =>
  axiosInstance.post<Tratamiento>('/tratamientos', tratamiento).then((res) => res.data);

export const updateTratamiento = (id: number, tratamiento: Omit<Tratamiento, 'idTrat'>): Promise<Tratamiento> =>
  axiosInstance.put<Tratamiento>(`/tratamientos/${id}`, tratamiento).then((res) => res.data);

export const deleteTratamiento = (id: number): Promise<void> =>
  axiosInstance.delete(`/tratamientos/${id}`).then(() => undefined);
