import axios from 'axios';
import type { Pago } from '../types/pago';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/pagos',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error Axios (pagos):', error);
    return Promise.reject(error);
  }
);

// DTO que espera el backend — coincide exactamente con PagoRequestDTO.java
export interface PagoRequestDTO {
  idPaciente: number;
  idUsuarioReceptor?: number;
  medioPago: string;
  observaciones?: string;
  detalles: {
    idPresupuestoDetalle: number;
    montoAbonar: number;
  }[];
}

// Tipo que devuelve el backend para cada detalle de deuda
export interface DeudaDetalle {
  idDetalle: number;
  idTarifa: number;
  precioUnitario: number;
  saldoPendiente: number;
  estado: string;
  carasAfectadas?: string;
  numeroFdi?: number;
  motivoAnulacion?: string;
}

// GET /api/pagos  → todos los pagos (para KPIs)
export const getPagos = (): Promise<Pago[]> =>
  api.get<Pago[]>('').then((res) => res.data);

// GET /api/pagos/paciente/{id}  → historial de pagos del paciente
export const getHistorialPaciente = (idPaciente: number): Promise<Pago[]> =>
  api.get<Pago[]>(`/paciente/${idPaciente}`).then((res) => res.data);

// GET /api/pagos/paciente/{id}/deuda  → detalles de presupuesto con saldo pendiente
export const getDeudaPaciente = (idPaciente: number): Promise<DeudaDetalle[]> =>
  api.get<DeudaDetalle[]>(`/paciente/${idPaciente}/deuda`).then((res) => res.data);

// POST /api/pagos  → registrar pago con detalles por presupuesto
export const registrarPago = (dto: PagoRequestDTO): Promise<Pago> =>
  api.post<Pago>('', dto).then((res) => res.data);
