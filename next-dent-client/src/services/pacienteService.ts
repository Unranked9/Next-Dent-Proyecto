import axios from 'axios';
import type { Paciente } from '../types/paciente';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/pacientes',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error detallado en Axios:', error);
    return Promise.reject(error);
  }
);

export const getPacientes = (): Promise<Paciente[]> =>
  api.get<Paciente[]>('').then((res) => res.data);

export const getPacienteById = (id: number): Promise<Paciente> =>
  api.get<Paciente>(`/${id}`).then((res) => res.data);

export const createPaciente = (paciente: Omit<Paciente, 'idPac'>): Promise<Paciente> =>
  api.post<Paciente>('', paciente).then((res) => res.data);

export const updatePaciente = (id: number, paciente: Omit<Paciente, 'idPac'>): Promise<Paciente> =>
  api.put<Paciente>(`/${id}`, paciente).then((res) => res.data);

export const deletePaciente = (id: number): Promise<void> =>
  api.delete(`/${id}`).then(() => undefined);
