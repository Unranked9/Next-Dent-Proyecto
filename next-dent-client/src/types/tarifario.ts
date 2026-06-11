export interface Tarifario {
  idTarifa?: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  estado?: string;
}
