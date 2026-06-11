export interface PresupuestoDetalle {
  idDetalle?: number;
  numeroFdi: number;
  idTarifa: number;
  precioUnitario: number;
  estado?: string;
  motivoAnulacion?: string;
}

export interface Presupuesto {
  idPresupuesto?: number;
  idPaciente: number;
  fechaCreacion: string;
  total: number;
  estado: string;
  detalles: PresupuestoDetalle[];
}

export interface PresupuestoDetalleRequest {
  numeroFdi: number;
  idTarifa: number;
  precioUnitario: number;
}

export interface PresupuestoCreateRequest {
  idPaciente: number;
  detalles: PresupuestoDetalleRequest[];
}

