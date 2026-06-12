// Corregido para coincidir con el modelo Java Pago.java:
//   - montoTotal  (era "monto")
//   - idPaciente  (era "idCita" — campo que ya no existe en el modelo)
//   - fechaPago   se mantiene como string (Jackson serializa LocalDateTime como ISO string)
//   - Se agregan los campos reales: medioPago, observaciones, detalles

export interface Pago {
  idPago?: number;
  idPaciente: number;
  idUsuarioReceptor?: number;
  fechaPago: string;       // ISO 8601: "2025-06-10T14:35:00"
  montoTotal: number;      // BigDecimal → number en JS
  medioPago: string;
  observaciones?: string;
  detalles?: PagoDetalle[];
}

export interface PagoDetalle {
  idPagoDetalle?: number;
  idPresupuestoDetalle: number;
  montoAplicado: number;
}
