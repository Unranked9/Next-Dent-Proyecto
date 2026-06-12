import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import PacientesPage from './pages/PacientesPage';
import PacientePerfilPage from './pages/PacientePerfilPage';
import CitasPage from './pages/CitasPage';
import DoctoresPage from './pages/DoctoresPage';
import TratamientosPage from './pages/TratamientosPage';
import PagosPage from './pages/PagosPage';
import ConfiguracionPreciosPage from './pages/ConfiguracionPreciosPage';

function App() {
  return (
    <BrowserRouter>
      {/* Sidebar fijo a la izquierda, ancho 208px (w-52) */}
      <Sidebar />

      {/* Contenido principal con margen izquierdo igual al ancho del sidebar */}
      <main className="ml-52 min-h-screen bg-slate-100">
        <Routes>
          <Route path="/" element={<Navigate to="/pacientes" replace />} />
          <Route path="/pacientes" element={<PacientesPage />} />
          <Route path="/pacientes/:id" element={<PacientePerfilPage />} />
          <Route path="/citas" element={<CitasPage />} />
          <Route path="/doctores" element={<DoctoresPage />} />
          <Route path="/tratamientos" element={<TratamientosPage />} />
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/tarifario" element={<ConfiguracionPreciosPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
