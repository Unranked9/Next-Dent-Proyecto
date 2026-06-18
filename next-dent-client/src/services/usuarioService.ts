import axiosInstance from '../config/axiosInstance';
import type { Usuario, UsuarioRequest } from '../types/usuario';

export const getUsuarios = (): Promise<Usuario[]> =>
  axiosInstance.get('/usuarios').then(r => r.data);

export const createUsuario = (data: UsuarioRequest): Promise<Usuario> =>
  axiosInstance.post('/usuarios', data).then(r => r.data);

export const updateUsuario = (id: number, data: UsuarioRequest): Promise<Usuario> =>
  axiosInstance.put(`/usuarios/${id}`, data).then(r => r.data);

export const deleteUsuario = (id: number): Promise<void> =>
  axiosInstance.delete(`/usuarios/${id}`).then(r => r.data);
