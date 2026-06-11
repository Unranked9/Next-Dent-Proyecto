import axios from 'axios';
import type { Pago } from '../types/pago';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/pagos',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error detallado en Axios (pagos):', error);
    return Promise.reject(error);
  }
);

export const getPagos = (): Promise<Pago[]> =>
  api.get<Pago[]>('').then((res) => res.data);

export const procesarCobro = (idCita: number): Promise<Pago> =>
  api.post<Pago>(`/procesar/${idCita}`).then((res) => res.data);

export const registrarAbono = (
  idCita: number,
  monto: number,
  medioPago: string,
): Promise<Pago> =>
  api.post<Pago>('/abono', { idCita, monto, medioPago }).then((res) => res.data);
