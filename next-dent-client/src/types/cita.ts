import type { Paciente } from './paciente';

export interface Cita {
  idCita?: number;
  paciente: Paciente;
  idDoc: number;
  idTra: number;
  fecha: string;
  hora: string;
  estado: string;
}
