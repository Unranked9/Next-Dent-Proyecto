import axiosInstance from '../config/axiosInstance';
import type { Paciente } from '../types/paciente';

export const getPacientes = (): Promise<Paciente[]> =>
  axiosInstance.get<Paciente[]>('/pacientes').then((res) => res.data);

export const getPacienteById = (id: number): Promise<Paciente> =>
  axiosInstance.get<Paciente>(`/pacientes/${id}`).then((res) => res.data);

export const createPaciente = (paciente: Omit<Paciente, 'idPac'>): Promise<Paciente> =>
  axiosInstance.post<Paciente>('/pacientes', paciente).then((res) => res.data);

export const updatePaciente = (id: number, paciente: Omit<Paciente, 'idPac'>): Promise<Paciente> =>
  axiosInstance.put<Paciente>(`/pacientes/${id}`, paciente).then((res) => res.data);

export const deletePaciente = (id: number): Promise<void> =>
  axiosInstance.delete(`/pacientes/${id}`).then(() => undefined);
