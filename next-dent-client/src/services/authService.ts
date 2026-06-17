import axiosInstance from '../config/axiosInstance';

export interface LoginResponse {
  token: string;
  email: string;
  rol: string;
  idDoctor: number | null;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axiosInstance.post<LoginResponse>('/auth/login', { email, password });
  return data;
}
