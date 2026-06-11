import axios from 'axios';
import type { Paciente } from '../types/paciente';

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

export const getPacientes = (): Promise<Paciente[]> =>
  api.get<Paciente[]>('/pacientes').then((res) => res.data);

export const getPacienteById = (id: number): Promise<Paciente> =>
  api.get<Paciente>(`/pacientes/${id}`).then((res) => res.data);

export const createPaciente = (paciente: Omit<Paciente, 'idPac'>): Promise<Paciente> =>
  api.post<Paciente>('/pacientes', paciente).then((res) => res.data);

export const updatePaciente = (id: number, paciente: Omit<Paciente, 'idPac'>): Promise<Paciente> =>
  api.put<Paciente>(`/pacientes/${id}`, paciente).then((res) => res.data);

export const deletePaciente = (id: number): Promise<void> =>
  api.delete(`/pacientes/${id}`).then(() => undefined);
