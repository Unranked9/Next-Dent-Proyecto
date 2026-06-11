import axios from 'axios';
import type { Doctor } from '../types/doctor';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/doctores',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error detallado en Axios:', error);
    return Promise.reject(error);
  }
);

export const getDoctores = (): Promise<Doctor[]> =>
  api.get<Doctor[]>('').then((res) => res.data);

export const createDoctor = (doctor: Omit<Doctor, 'idDoc'>): Promise<Doctor> =>
  api.post<Doctor>('', doctor).then((res) => res.data);

export const updateDoctor = (id: number, doctor: Omit<Doctor, 'idDoc'>): Promise<Doctor> =>
  api.put<Doctor>(`/${id}`, doctor).then((res) => res.data);

export const deleteDoctor = (id: number): Promise<void> =>
  api.delete(`/${id}`).then(() => undefined);
