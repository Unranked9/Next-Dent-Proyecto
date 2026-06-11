import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PacientesPage from './pages/PacientesPage';
import PacientePerfilPage from './pages/PacientePerfilPage';
import CitasPage from './pages/CitasPage';
import DoctoresPage from './pages/DoctoresPage';
import TratamientosPage from './pages/TratamientosPage';
import PagosPage from './pages/PagosPage';

// 1. Aquí importamos la nueva pantalla que Claude acaba de crear
import ConfiguracionPreciosPage from './pages/ConfiguracionPreciosPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/pacientes" replace />} />
        <Route path="/pacientes" element={<PacientesPage />} />
        <Route path="/pacientes/:id" element={<PacientePerfilPage />} />
        <Route path="/citas" element={<CitasPage />} />
        <Route path="/doctores" element={<DoctoresPage />} />
        <Route path="/tratamientos" element={<TratamientosPage />} />
        <Route path="/pagos" element={<PagosPage />} />
        
        {/* 2. Aquí creamos la "puerta" para entrar al Tarifario */}
        <Route path="/tarifario" element={<ConfiguracionPreciosPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;