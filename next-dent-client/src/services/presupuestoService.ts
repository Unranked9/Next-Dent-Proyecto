import axios from 'axios';
import type { Presupuesto, PresupuestoCreateRequest } from '../types/presupuesto';

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

export const getPorPaciente = (idPaciente: number): Promise<Presupuesto[]> =>
  api.get<Presupuesto[]>(`/presupuestos/paciente/${idPaciente}`).then((res) => res.data);

export const crear = (data: PresupuestoCreateRequest): Promise<Presupuesto> =>
  api.post<Presupuesto>('/presupuestos', data).then((res) => res.data);

export const evolucionar = (
  idDetalle: number,
  idDoctor: number,
  notaClinica: string,
  finalizado: boolean,
): Promise<void> =>
  api
    .post(`/presupuestos/detalles/${idDetalle}/evolucionar`, { idDoctor, notaClinica, finalizado })
    .then((res) => res.data);

export const anularDetalle = (idDetalle: number, motivo: string): Promise<any> =>
  api.put(`/presupuestos/detalles/${idDetalle}/anular`, { motivo }).then((res) => res.data);

export const agregarDetalles = (idPresupuesto: number, detalles: any[]): Promise<any> =>
  api.post(`/presupuestos/${idPresupuesto}/detalles`, detalles).then((res) => res.data);
