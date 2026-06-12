# Prompt 03 — Dashboard / Página de Inicio
> Tarea ROADMAP 2.2 · Solo frontend · No requiere cambios en backend

---

## Objetivo
Crear una **página de Dashboard** en la ruta `/` que sirva como pantalla de inicio de Next Dent. Actualmente esa ruta redirige a `/pacientes`; hay que reemplazarla con un dashboard real que combine datos de múltiples endpoints ya existentes.

---

## Contexto del proyecto (leer antes de tocar código)

- **Stack**: React + TypeScript + Tailwind CSS + Vite.
- **Archivo de rutas**: `next-dent-client/src/App.tsx` — cambiar el redirect `/` → `/pacientes` por el nuevo componente.
- **Design system**:
  - Fondo de página: `bg-slate-100`
  - Cards: `bg-white rounded-2xl border border-slate-200 hover:border-indigo-200`
  - Botón primario: `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl`
  - Sidebar activo: `border-left-color: #6366F1`
  - Íconos: SVG inline únicamente
  - Sin librerías de componentes externas
- **Hooks reutilizables existentes** (NO duplicar lógica):
  - `hooks/useKpis.ts` → `{ pacientes, citasHoy, cobradoHoy, porCobrarTotal }`
  - `hooks/useNotificaciones.ts` → citas pendientes del día
  - `hooks/usePorCobrar.ts` → pacientes con tratamientos REALIZADO + saldo > 0
  - `hooks/useDoctorActivo.ts` → doctor activo

---

## Endpoints que consume (todos ya existen)

| Endpoint | Uso en dashboard |
|---|---|
| `GET /api/citas` | Citas de hoy + próximas citas |
| `GET /api/pacientes` | Conteo total |
| `GET /api/pagos` | Cobrado hoy |
| `GET /api/doctores` | Doctor activo (ya lo hace `useDoctorActivo`) |

No crear nuevos endpoints.

---

## Estructura de la página

### Header de bienvenida
```
Buenos días, Dr. [nombreDoctor]          Viernes, 13 de junio de 2025
```
- Fecha actual formateada en español.
- Saludo dinámico: Buenos días (5–11h) / Buenas tardes (12–18h) / Buenas noches (19–4h).
- `nombreDoctor` viene de `useDoctorActivo()`.

### Sección 1 — KPIs (reusar `KpiBar`)
Reusar el componente `components/KpiBar.tsx` existente. No duplicar. Solo importarlo y renderizarlo.

### Sección 2 — Citas de hoy
- Título: "Agenda de hoy"
- Filtrar citas donde `fechaHora` sea el día actual.
- Ordenar por hora ascendente.
- Mostrar máximo 6 citas; si hay más, botón "Ver todas →" que navega a `/citas`.
- Cada cita como fila en una card:
  ```
  [círculo estado]  14:30  —  Juan Pérez          Limpieza dental
                              badge estado
  ```
  Colores del badge:
  ```
  Pendiente  → bg-amber-100 text-amber-700
  Confirmada → bg-indigo-100 text-indigo-700
  Completada → bg-emerald-100 text-emerald-700
  Cancelada  → bg-red-100 text-red-500
  ```
- Si no hay citas hoy: estado vacío con ilustración SVG simple y texto "Sin citas para hoy".

### Sección 3 — Cobros pendientes urgentes (reusar `usePorCobrar`)
- Título: "Cobros pendientes"
- Datos de `usePorCobrar()`.
- Mostrar máximo 4 items; si hay más, botón "Ver todos →" que navega a `/pagos`.
- Cada item:
  ```
  [avatar iniciales]  María García    S/ 350.00 pendiente    [Ir a caja →]
  ```
  El botón "Ir a caja →" navega a `/pagos` (la PagosPage ya tiene búsqueda por paciente, no hay que pasar state por ahora).
- Si no hay cobros: texto "Sin cobros urgentes 🎉".

### Sección 4 — Accesos rápidos
Grid de 4 botones grandes (2×2 en mobile, 4×1 en desktop):
```
[+ Nueva cita]    [+ Nuevo paciente]    [Ir a caja]    [Ver historial]
```
- Cada botón = card clickeable con ícono SVG grande + texto.
- Navegan a: `/citas` (abrir modal nuevo) · `/pacientes` · `/pagos` · `/pacientes`
  - Para abrir el modal de nueva cita, navegar a `/citas?nuevo=true` — la CitasPage debe leer ese query param y abrir el modal automáticamente (agregar ese comportamiento en CitasPage).

---

## Layout general de la página

```
┌─────────────────────────────────────────────────────┐
│  Header bienvenida                                  │
├─────────────────────────────────────────────────────┤
│  KpiBar (4 KPIs) — reusar componente               │
├──────────────────────┬──────────────────────────────┤
│  Citas de hoy        │  Cobros pendientes           │
│  (col izquierda)     │  (col derecha)               │
├─────────────────────────────────────────────────────┤
│  Accesos rápidos (4 botones)                        │
└─────────────────────────────────────────────────────┘
```

En pantallas < lg: todas las secciones apiladas verticalmente.

---

## Archivos a crear / modificar

| Acción | Archivo |
|---|---|
| **Crear** | `src/pages/DashboardPage.tsx` |
| **Modificar** | `src/App.tsx` — cambiar ruta `/` |
| **Modificar** | `src/components/Sidebar.tsx` — agregar item "Dashboard" al inicio con ícono de casa |
| **Modificar** | `src/pages/CitasPage.tsx` — leer `?nuevo=true` y abrir modal |

---

## Pasos de implementación sugeridos

1. Crear `DashboardPage.tsx` con la estructura descrita.
2. Modificar `App.tsx`:
   ```tsx
   // Antes:
   <Route path="/" element={<Navigate to="/pacientes" />} />
   // Después:
   <Route path="/" element={<DashboardPage />} />
   ```
3. Agregar "Inicio" / "Dashboard" al sidebar (primer item, con ícono `home`).
4. Modificar `CitasPage.tsx` para leer el query param `?nuevo=true`:
   ```typescript
   const [searchParams] = useSearchParams();
   useEffect(() => {
     if (searchParams.get('nuevo') === 'true') setModalAbierto(true);
   }, []);
   ```
5. Ejecutar `npx tsc --noEmit` y corregir todos los errores.

---

## Lo que NO hacer
- No duplicar la lógica de fetch que ya está en los hooks existentes.
- No crear un endpoint de "resumen" — todo se calcula en cliente.
- No instalar librerías de gráficos (Fase 2.4 tendrá el reporte con SVG puro).
- No usar `localStorage` ni `sessionStorage`.
- No romper las rutas existentes `/pacientes`, `/citas`, `/pagos`.

---

## Verificación final
```bash
npx tsc --noEmit
```
Probar manualmente:
- [ ] La ruta `/` muestra el dashboard (no redirige a /pacientes)
- [ ] El sidebar tiene "Inicio" como primer item activo en `/`
- [ ] Los KPIs cargan correctamente (reusar KpiBar)
- [ ] Las citas de hoy se muestran ordenadas por hora
- [ ] Los cobros pendientes muestran los pacientes correctos
- [ ] Los 4 accesos rápidos navegan a la ruta correcta
- [ ] El botón "+ Nueva cita" abre el modal en CitasPage
