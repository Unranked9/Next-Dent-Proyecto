# Next Dent — Context para IA

## Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Vite · `next-dent-client/`
- **Backend**: Spring Boot (Java) + PostgreSQL · `next-dent-api/`
- **Rutas API base**: `http://localhost:8080/api`

---

## Design System (NO desviar de esto)
- **Paleta principal**: Indigo (`indigo-600` CTA, `indigo-100` fondos suaves)
- **Sidebar**: fondo `#0F172A`, ancho `w-52` (208px), fijo, `border-left-color: #6366F1` activo
- **Topbar**: `bg-white`, `h-14`, `sticky top-0 z-30`, `border-b border-slate-200`
- **Cards**: `bg-white rounded-2xl border border-slate-200 hover:border-indigo-200`
- **Botón primario**: `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl`
- **Fondo de página**: `bg-slate-100`
- **Fuente de datos**: Tailwind puro — sin librerías de componentes externas
- **Íconos**: SVG inline (no instalar icon libraries)

---

## Archivos clave — mapa

### Frontend `next-dent-client/src/`
| Archivo | Responsabilidad |
|---|---|
| `App.tsx` | Rutas + layout (Sidebar + main) |
| `components/Sidebar.tsx` | Navegación lateral fija |
| `components/Topbar.tsx` | Header con campana y perfil doctor |
| `components/KpiBar.tsx` | 4 KPI cards con datos reales |
| `hooks/useKpis.ts` | Fetch paralelo pacientes+citas+pagos, polling 30s |
| `hooks/useNotificaciones.ts` | Citas pendientes del día → campana |
| `hooks/useDoctorActivo.ts` | Carga primer doctor de BD |
| `hooks/usePorCobrar.ts` | Pacientes con tratamientos REALIZADO + saldo > 0 |
| `pages/PacientesPage.tsx` | CRUD pacientes — diseño nuevo ✓ |
| `pages/PagosPage.tsx` | Caja — buscar paciente → deuda → cobrar |
| `pages/CitasPage.tsx` | CRUD citas — diseño PENDIENTE |
| `pages/DoctoresPage.tsx` | CRUD doctores — diseño PENDIENTE |
| `pages/TratamientosPage.tsx` | CRUD tratamientos — diseño PENDIENTE |
| `pages/ConfiguracionPreciosPage.tsx` | Tarifario — diseño PENDIENTE |
| `pages/PacientePerfilPage.tsx` | Historia clínica completa |
| `services/pagoService.ts` | getPagos, getDeudaPaciente, getHistorialPaciente, registrarPago |
| `services/presupuestoService.ts` | getPorPaciente, crear, evolucionar, anularDetalle |
| `services/tarifarioService.ts` | getActivos (NO getTarifario — ese nombre no existe) |

### Backend controllers relevantes
| Endpoint | Método | Descripción |
|---|---|---|
| `/api/pacientes` | GET | Lista todos los pacientes |
| `/api/citas` | GET | Lista todas las citas |
| `/api/pagos` | GET | Lista todos los pagos |
| `/api/pagos` | POST | Registrar pago (PagoRequestDTO) |
| `/api/pagos/paciente/{id}` | GET | Historial de pagos del paciente |
| `/api/pagos/paciente/{id}/deuda` | GET | PresupuestoDetalle[] con saldo_pendiente > 0 |
| `/api/presupuestos/paciente/{id}` | GET | Presupuestos del paciente |
| `/api/presupuestos/detalles/{id}/evolucionar` | POST | Marcar tratamiento como REALIZADO |
| `/api/doctores` | GET | Lista doctores |
| `/api/tarifario` | GET | Lista tarifas activas |
| `/api/citas/paciente/{id}` | GET | Citas del paciente |

---

## Modelos críticos (diferencias Java ↔ TypeScript)

### Pago
```typescript
// TypeScript CORRECTO (pago.ts)
interface Pago {
  idPago?: number;
  idPaciente: number;       // NO idCita
  montoTotal: number;       // NO monto
  fechaPago: string;        // ISO: "2025-06-10T14:35:00"
  medioPago: string;
  observaciones?: string;
}
```

### PagoRequestDTO (lo que el backend espera al crear un pago)
```typescript
interface PagoRequestDTO {
  idPaciente: number;
  medioPago: string;
  observaciones?: string;
  detalles: {
    idPresupuestoDetalle: number;  // NO idCita
    montoAbonar: number;
  }[];
}
```

### DeudaDetalle (lo que devuelve /deuda)
```typescript
interface DeudaDetalle {
  idDetalle: number;
  idTarifa: number;
  precioUnitario: number;
  saldoPendiente: number;
  estado: 'PENDIENTE' | 'EN_PROGRESO' | 'REALIZADO' | 'PAGADO' | 'ANULADO';
  numeroFdi?: number;
}
```

### Estados de PresupuestoDetalle
- `PENDIENTE` → tratamiento planificado, no iniciado
- `EN_PROGRESO` → en curso (evolución parcial)
- `REALIZADO` → completado clínicamente, puede tener saldo pendiente de cobro
- `PAGADO` → saldo = 0
- `ANULADO` → cancelado, no mostrar en caja

---

## Reglas de negocio importantes
1. Un pago se registra **por presupuesto_detalle**, no por cita.
2. Un paciente puede tener múltiples presupuestos y múltiples detalles por presupuesto.
3. Tratamientos con estado `REALIZADO` + `saldoPendiente > 0` = **cobro urgente**.
4. El KPI "Cobrado hoy" filtra pagos donde `esHoy(fechaPago)` y suma `montoTotal`.
5. El doctor activo = primer doctor de GET /api/doctores (sin auth aún).
6. Polling: KPIs cada 30s, Notificaciones cada 60s, PorCobrar cada 60s.

---

## Estados de citas (frontend)
`'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada'`
⚠️ Sensible a mayúsculas — el backend los guarda tal cual.

---

## Lo que NO existe aún (no inventar)
- `GET /api/pagos` global → agregado en PagoController.java manualmente
- Auth / JWT / Spring Security → no implementado
- Endpoint de dashboard/resumen → no existe, calcular en cliente
- `getTarifario` → el export se llama `getActivos` en tarifarioService.ts
- `registrarAbono` → eliminado, reemplazado por `registrarPago`

---

## Convenciones del proyecto
- Todos los servicios usan `axios` con `baseURL` en `http://localhost:8080/api/...`
- Los hooks viven en `src/hooks/` (carpeta creada en el rediseño)
- No usar `localStorage` ni `sessionStorage`
- No instalar dependencias npm nuevas sin justificación
- Verificar siempre con `npx tsc --noEmit` al terminar

---

## Prompts generados (ver /prompts/ en el repo)
- `prompts/01_panel_por_cobrar.md` — Panel caja + notificación campana
