import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { LoginResponse } from '../services/authService';
import { login as loginService } from '../services/authService';
import { setTokenGetter, setLogoutHandler } from '../config/axiosInstance';

const STORAGE_KEY = 'nd_session';

interface StoredSession {
  token: string;
  email: string;
  rol: string;
  idDoctor: number | null;
}

function leerSesion(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function guardarSesion(data: StoredSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function borrarSesion() {
  localStorage.removeItem(STORAGE_KEY);
}

interface AuthContextType {
  usuario: LoginResponse | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<LoginResponse | null>(() => leerSesion());
  const [token, setToken] = useState<string | null>(() => leerSesion()?.token ?? null);

  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  const logout = useCallback(() => {
    setUsuario(null);
    setToken(null);
    borrarSesion();
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  async function login(email: string, password: string) {
    const data = await loginService(email, password);
    const sesion: StoredSession = {
      token: data.token,
      email: data.email,
      rol: data.rol,
      idDoctor: data.idDoctor ?? null,
    };
    guardarSesion(sesion);
    setUsuario(data);
    setToken(data.token);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
