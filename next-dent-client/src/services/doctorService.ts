import axiosInstance from '../config/axiosInstance';
import type { Doctor } from '../types/doctor';

export const getDoctores = (): Promise<Doctor[]> =>
  axiosInstance.get<Doctor[]>('/doctores').then((res) => res.data);

export const getDoctorById = (id: number): Promise<Doctor> =>
  axiosInstance.get<Doctor>(`/doctores/${id}`).then((res) => res.data);

export const createDoctor = (doctor: Omit<Doctor, 'idDoc'>): Promise<Doctor> =>
  axiosInstance.post<Doctor>('/doctores', doctor).then((res) => res.data);

export const updateDoctor = (id: number, doctor: Omit<Doctor, 'idDoc'>): Promise<Doctor> =>
  axiosInstance.put<Doctor>(`/doctores/${id}`, doctor).then((res) => res.data);

export const deleteDoctor = (id: number): Promise<void> =>
  axiosInstance.delete(`/doctores/${id}`).then(() => undefined);
