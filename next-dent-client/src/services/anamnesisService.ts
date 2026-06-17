import type { Anamnesis } from '../types/hce';
import axiosInstance from '../config/axiosInstance';

export const getAnamnesisPorCiclo = (idCiclo: number): Promise<Anamnesis | null> =>
  axiosInstance.get<Anamnesis>(`/anamnesis/ciclo/${idCiclo}`).then((res) => res.data).catch(() => null);

export const saveAnamnesis = (anamnesis: Partial<Anamnesis>): Promise<Anamnesis> =>
  axiosInstance.post<Anamnesis>('/anamnesis', anamnesis).then((res) => res.data);
