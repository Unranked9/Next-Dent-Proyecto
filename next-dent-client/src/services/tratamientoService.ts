import axios from 'axios';
import type { Tratamiento } from '../types/tratamiento';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/tratamientos',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error detallado en Axios:', error);
    return Promise.reject(error);
  }
);

export const getTratamientos = (): Promise<Tratamiento[]> =>
  api.get<Tratamiento[]>('').then((res) => res.data);

export const createTratamiento = (tratamiento: Omit<Tratamiento, 'idTrat'>): Promise<Tratamiento> =>
  api.post<Tratamiento>('', tratamiento).then((res) => res.data);

export const updateTratamiento = (id: number, tratamiento: Omit<Tratamiento, 'idTrat'>): Promise<Tratamiento> =>
  api.put<Tratamiento>(`/${id}`, tratamiento).then((res) => res.data);

export const deleteTratamiento = (id: number): Promise<void> =>
  api.delete(`/${id}`).then(() => undefined);
