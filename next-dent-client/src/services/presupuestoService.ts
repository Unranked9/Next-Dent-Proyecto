import axiosInstance from '../config/axiosInstance';
import type { Presupuesto, PresupuestoCreateRequest } from '../types/presupuesto';

export const getPorPaciente = (idPaciente: number): Promise<Presupuesto[]> =>
  axiosInstance.get<Presupuesto[]>(`/presupuestos/paciente/${idPaciente}`).then((res) => res.data);

export const crear = (data: PresupuestoCreateRequest): Promise<Presupuesto> =>
  axiosInstance.post<Presupuesto>('/presupuestos', data).then((res) => res.data);

export const evolucionar = (
  idDetalle: number,
  idDoctor: number,
  notaClinica: string,
  finalizado: boolean,
): Promise<void> =>
  axiosInstance
    .post(`/presupuestos/detalles/${idDetalle}/evolucionar`, { idDoctor, notaClinica, finalizado })
    .then((res) => res.data);

export const anularDetalle = (idDetalle: number, motivo: string): Promise<any> =>
  axiosInstance.put(`/presupuestos/detalles/${idDetalle}/anular`, { motivo }).then((res) => res.data);

export const agregarDetalles = (idPresupuesto: number, detalles: any[]): Promise<any> =>
  axiosInstance.post(`/presupuestos/${idPresupuesto}/detalles`, detalles).then((res) => res.data);
