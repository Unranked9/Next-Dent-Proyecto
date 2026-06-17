import axiosInstance from '../config/axiosInstance';

export interface CicloClinico {
  idCiclo: number;
  idPaciente: number;
  nombre: string;
  fechaInicio: string;
  estado: string;
}

export const getCiclosPorPaciente = (idPaciente: number): Promise<CicloClinico[]> =>
  axiosInstance.get(`/ciclos/paciente/${idPaciente}`).then((res) => res.data);

export const iniciarNuevoCiclo = (
  idPaciente: number,
  importarAnterior: boolean = false,
): Promise<CicloClinico> =>
  axiosInstance
    .post(`/ciclos/paciente/${idPaciente}/nuevo`, null, {
      params: { importarAnterior },
    })
    .then((res) => res.data);