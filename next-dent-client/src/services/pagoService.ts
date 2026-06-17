import axiosInstance from '../config/axiosInstance';
import type { Pago } from '../types/pago';
import type { PagoReporte } from '../types/reporte';

export interface PagoRequestDTO {
  idPaciente: number;
  idUsuarioReceptor?: number;
  medioPago: string;
  observaciones?: string;
  detalles: {
    idPresupuestoDetalle: number;
    montoAbonar: number;
    concepto?: string;
  }[];
}

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

export const getPagos = (): Promise<Pago[]> =>
  axiosInstance.get<Pago[]>('/pagos').then((res) => res.data);

export const getHistorialPaciente = (idPaciente: number): Promise<Pago[]> =>
  axiosInstance.get<Pago[]>(`/pagos/paciente/${idPaciente}`).then((res) => res.data);

export const getDeudaPaciente = (idPaciente: number): Promise<DeudaDetalle[]> =>
  axiosInstance.get<DeudaDetalle[]>(`/pagos/paciente/${idPaciente}/deuda`).then((res) => res.data);

export const registrarPago = (dto: PagoRequestDTO): Promise<Pago> =>
  axiosInstance.post<Pago>('/pagos', dto).then((res) => res.data);

export const getReporte = (desde: string, hasta: string): Promise<PagoReporte> =>
  axiosInstance.get<PagoReporte>('/pagos/reporte', { params: { desde, hasta } }).then((res) => res.data);
