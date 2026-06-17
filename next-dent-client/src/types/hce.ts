export interface Anamnesis {
  idAnamnesis?: number;
  idPaciente: number;
  idCiclo?: number;
  respuestasJson?: string;
}

export interface Evolucion {
  idEvolucion?: number;
  idPac: number;
  fecha: string;
  descripcion: string;
  nombreDoctor?: string;
  numeroFdi?: number;
  idTarifa?: number;
}
