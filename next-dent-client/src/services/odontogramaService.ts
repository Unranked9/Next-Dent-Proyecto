import axios from 'axios';
import type { DienteEstado, OdontogramaMultipieza } from '../types/odontograma';

const api = axios.create({ baseURL: 'http://127.0.0.1:8080/api' });

export interface OdontogramaData {
  idOdontograma: number;
  idPaciente: number;
  dientes: DienteEstado[];
  observaciones?: string;
}

/**
 * GET del odontograma de un paciente.
 * Devuelve null si el backend responde 204 (paciente nuevo) o hay error de red.
 */
export const getPorPaciente = (
  idPaciente: number,
  tipo?: 'INICIAL' | 'ACTUAL',
): Promise<OdontogramaData | null> =>
  api
    .get<OdontogramaData>(`/odontograma/paciente/${idPaciente}`, {
      params: tipo ? { tipo } : undefined,
    })
    .then((res) => res.data || null)
    .catch(() => null);

/**
 * GET del odontograma de un ciclo específico.
 */
export const getPorCiclo = (
  idCiclo: number,
  tipo?: 'INICIAL' | 'ACTUAL',
): Promise<OdontogramaData | null> =>
  api
    .get<OdontogramaData>(`/odontograma/ciclo/${idCiclo}`, {
      params: tipo ? { tipo } : undefined,
    })
    .then((res) => res.data || null)
    .catch(() => null);

export const guardarDiente = (diente: DienteEstado): Promise<DienteEstado> =>
  api.post<DienteEstado>('/odontograma/diente', diente).then((res) => res.data);

/**
 * Upsert integral adaptado para soportar Ciclos Clínicos.
 */
export const guardarCompleto = (
  idPaciente: number,
  tipo: 'INICIAL' | 'ACTUAL',
  dientes: DienteEstado[],
  observaciones?: string,
  idCiclo?: number,
): Promise<OdontogramaData> =>
  api
    .post<OdontogramaData>(
      `/odontograma/paciente/${idPaciente}/guardar`,
      { dientes, observaciones, idCiclo },
      { params: { tipo, idCiclo } },
    )
    .then((res) => res.data);

export const guardarEstados = (
  idOdontograma: number,
  dientes: DienteEstado[],
): Promise<void> =>
  Promise.all(
    dientes.map((d) => api.post('/odontograma/diente', { ...d, idOdontograma })),
  ).then(() => undefined);

export const getTratamientosMulti = async (
  idOdontograma: number,
): Promise<OdontogramaMultipieza[]> => {
  try {
    const response = await api.get<OdontogramaMultipieza[]>(
      `/odontogramas/multipieza/${idOdontograma}`,
    );
    return response.data;
  } catch (error) {
    console.error('Error al obtener tratamientos multi-pieza:', error);
    return [];
  }
};

export const guardarTratamientosMulti = async (
  idOdontograma: number,
  tratamientos: OdontogramaMultipieza[],
): Promise<OdontogramaMultipieza[]> => {
  try {
    const response = await api.post<OdontogramaMultipieza[]>(
      `/odontogramas/multipieza/${idOdontograma}`,
      tratamientos,
    );
    return response.data;
  } catch (error) {
    console.error('Error al guardar tratamientos multi-pieza:', error);
    throw error;
  }
};
