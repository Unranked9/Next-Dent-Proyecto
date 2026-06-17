import type { DienteEstado, OdontogramaMultipieza } from '../types/odontograma';
import axiosInstance from '../config/axiosInstance';

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
export const getPorCiclo = (
  idCiclo: number,
  tipo?: 'INICIAL' | 'ACTUAL',
): Promise<OdontogramaData | null> =>
  axiosInstance
    .get<OdontogramaData>(`/odontograma/ciclo/${idCiclo}`, {
      params: tipo ? { tipo } : undefined,
    })
    .then((res) => res.data || null)
    .catch(() => null);

export const getPorPaciente = (
  idPaciente: number,
  tipo?: 'INICIAL' | 'ACTUAL',
): Promise<OdontogramaData | null> =>
  axiosInstance
    .get<OdontogramaData>(`/odontograma/paciente/${idPaciente}`, {
      params: tipo ? { tipo } : undefined,
    })
    .then((res) => res.data || null)
    .catch(() => null);

export const guardarDiente = (diente: DienteEstado): Promise<DienteEstado> =>
  axiosInstance.post<DienteEstado>('/odontograma/diente', diente).then((res) => res.data);

/**
 * Upsert integral: crea el odontograma si no existe y guarda/actualiza los dientes.
 * Endpoint: POST /odontograma/paciente/{idPaciente}/guardar?tipo=INICIAL
 * Devuelve el OdontogramaDTO completo con los IDs generados por la BD.
 */
export const guardarCompleto = (
  idPaciente: number,
  tipo: 'INICIAL' | 'ACTUAL',
  dientes: DienteEstado[],
  observaciones?: string,
  idCiclo?: number,
): Promise<OdontogramaData> =>
  axiosInstance
    .post<OdontogramaData>(
      `/odontograma/paciente/${idPaciente}/guardar`,
      { dientes, observaciones },
      { params: { tipo, ...(idCiclo !== undefined ? { idCiclo } : {}) } },
    )
    .then((res) => res.data);

export const guardarEstados = (
  idOdontograma: number,
  dientes: DienteEstado[],
): Promise<void> =>
  Promise.all(
    dientes.map((d) => axiosInstance.post('/odontograma/diente', { ...d, idOdontograma })),
  ).then(() => undefined);

export const getTratamientosMulti = async (
  idOdontograma: number,
): Promise<OdontogramaMultipieza[]> => {
  try {
    const response = await axiosInstance.get<OdontogramaMultipieza[]>(
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
    const response = await axiosInstance.post<OdontogramaMultipieza[]>(
      `/odontogramas/multipieza/${idOdontograma}`,
      tratamientos,
    );
    return response.data;
  } catch (error) {
    console.error('Error al guardar tratamientos multi-pieza:', error);
    throw error;
  }

};
