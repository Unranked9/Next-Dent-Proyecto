import axios from 'axios';

// Ajusta la URL base según cómo la tengas en tus otros servicios (ej. 'http://localhost:8080/api')
const API_URL = 'http://localhost:8080/api'; 

export interface CicloClinico {
  idCiclo: number;
  idPaciente: number;
  nombre: string;
  fechaInicio: string;
  estado: string;
}

export const getCiclosPorPaciente = (idPaciente: number): Promise<CicloClinico[]> =>
  axios.get(`${API_URL}/ciclos/paciente/${idPaciente}`).then((res) => res.data);

export const iniciarNuevoCiclo = (idPaciente: number): Promise<CicloClinico> =>
  axios.post(`${API_URL}/ciclos/paciente/${idPaciente}/nuevo`).then((res) => res.data);