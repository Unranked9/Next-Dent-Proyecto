export interface PagoPorDia {
  fecha: string;
  monto: number;
  cantidadPagos: number;
}

export interface PagoReporte {
  totalPeriodo: number;
  totalPagos: number;
  porDia: PagoPorDia[];
}
