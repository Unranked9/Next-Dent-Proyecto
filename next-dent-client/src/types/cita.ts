export interface PacienteResumen {
  idPac: number;
  nombre: string;
  apellido: string;
  dni?: string;
}

export interface Cita {
  idCita?: number;
  paciente: PacienteResumen | null;
  idDoc: number | null;
  idTra?: number | null;
  fecha: string | null;
  hora: string | null;
  estado: 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';
  motivo?: string | null;
  notas?: string | null;
}

// DTO que se envía al backend en POST/PUT
// El backend espera paciente como objeto anidado por @ManyToOne
export interface CitaPayload {
  paciente: { idPac: number };
  idDoc: number;
  fecha: string;
  hora: string;
  estado: string;
  motivo?: string;
  notas?: string;
}
