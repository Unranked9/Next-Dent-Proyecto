import axios from 'axios';
import type { Anamnesis } from '../types/hce';

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

export const getAnamnesisPorCiclo = (idCiclo: number): Promise<Anamnesis | null> =>
  api.get<Anamnesis>(`/anamnesis/ciclo/${idCiclo}`).then((res) => res.data).catch(() => null);

export const saveAnamnesis = (anamnesis: Partial<Anamnesis>): Promise<Anamnesis> =>
  api.post<Anamnesis>('/anamnesis', anamnesis).then((res) => res.data);
