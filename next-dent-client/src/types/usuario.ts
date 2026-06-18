export interface Usuario {
  idUsuario: number;
  email: string;
  rol: 'ADMIN' | 'DOCTOR' | 'RECEPCIONISTA';
  activo: boolean;
  idDoctor: number | null;
}

export interface UsuarioRequest {
  email: string;
  password?: string;
  rol: 'ADMIN' | 'DOCTOR' | 'RECEPCIONISTA';
  activo: boolean;
  idDoctor?: number | null;
}