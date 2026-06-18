import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PacientesPage from './pages/PacientesPage';
import PacientePerfilPage from './pages/PacientePerfilPage';
import CitasPage from './pages/CitasPage';
import DoctoresPage from './pages/DoctoresPage';
import TratamientosPage from './pages/TratamientosPage';
import PagosPage from './pages/PagosPage';
import ConfiguracionPreciosPage from './pages/ConfiguracionPreciosPage';
import ReportePage from './pages/ReportePage';
import UsuariosPage from './pages/UsuariosPage';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="ml-0 lg:ml-52 flex flex-col min-h-screen">
        <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 bg-slate-100">
          <Routes>
            <Route path="/" element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} />
            <Route path="/pacientes" element={<ErrorBoundary><PacientesPage /></ErrorBoundary>} />
            <Route path="/pacientes/:id" element={<ErrorBoundary><PacientePerfilPage /></ErrorBoundary>} />
            <Route path="/citas" element={<ErrorBoundary><CitasPage /></ErrorBoundary>} />
            <Route path="/doctores" element={<ErrorBoundary><DoctoresPage /></ErrorBoundary>} />
            <Route path="/tratamientos" element={<ErrorBoundary><TratamientosPage /></ErrorBoundary>} />
            <Route path="/pagos" element={<ErrorBoundary><PagosPage /></ErrorBoundary>} />
            <Route path="/tarifario" element={<ErrorBoundary><ConfiguracionPreciosPage /></ErrorBoundary>} />
            <Route path="/reporte" element={<ErrorBoundary><ReportePage /></ErrorBoundary>} />
            <Route path="/usuarios" element={<ErrorBoundary><UsuariosPage /></ErrorBoundary>} />
          </Routes>
        </main>
      </div>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
