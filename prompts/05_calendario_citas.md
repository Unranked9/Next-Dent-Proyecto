# Prompt 02 — Vista Calendario Semanal de Citas
> Tarea ROADMAP 2.1 · Solo frontend · No requiere cambios en backend

---

## Objetivo
Agregar una vista de **calendario semanal** dentro de `CitasPage.tsx`. El usuario podrá alternar entre la vista de lista (ya existente) y la vista de calendario mediante un toggle. El calendario muestra los 7 días de la semana actual, con bloques por hora (08:00–20:00), y cada cita renderizada como un bloque coloreado según su estado.

---

## Contexto del proyecto (leer antes de tocar código)

- **Stack**: React + TypeScript + Tailwind CSS + Vite. Sin librerías externas de calendario.
- **Endpoint disponible**: `GET http://localhost:8080/api/citas` — devuelve todas las citas.
- **Archivo principal a modificar**: `next-dent-client/src/pages/CitasPage.tsx`
- **Design system**:
  - Fondo de página: `bg-slate-100`
  - Cards: `bg-white rounded-2xl border border-slate-200`
  - Botón primario: `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl`
  - Íconos: SVG inline únicamente (no instalar icon libraries)
  - Sin librerías de componentes externas

---

## Modelo de datos — Cita

Revisar el tipo `Cita` que ya existe en el proyecto. Campos relevantes para el calendario:

```typescript
interface Cita {
  idCita: number;
  idPaciente: number;
  nombrePaciente?: string;   // puede venir del join en backend
  fechaHora: string;         // ISO: "2025-06-10T14:30:00"
  duracionMinutos?: number;  // si no existe, asumir 30 min por defecto
  estado: 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';
  motivo?: string;
}
```

⚠️ Los estados son sensibles a mayúsculas exactamente como están arriba.

---

## Requerimientos de implementación

### 1. Toggle Lista / Calendario
- Agregar en la barra superior de `CitasPage.tsx` dos botones toggle: **"Lista"** y **"Semana"**.
- Estado local: `const [vistaCalendario, setVistaCalendario] = useState(false)`
- Cuando `vistaCalendario === false` → renderizar la vista de lista existente (no modificar).
- Cuando `vistaCalendario === true` → renderizar el nuevo componente `CalendarioSemanal`.

### 2. Nuevo componente `CalendarioSemanal`
Crear en `next-dent-client/src/components/CalendarioSemanal.tsx`.

**Props:**
```typescript
interface CalendarioSemanalProps {
  citas: Cita[];
  semanaOffset: number;           // 0 = semana actual, -1 = anterior, +1 = siguiente
  onCitaClick: (cita: Cita) => void;
}
```

**Estructura visual con CSS Grid:**
- Columna de horas a la izquierda (fija, ~60px): 08:00, 09:00, ... 20:00
- 7 columnas para los días (Lun–Dom) con la fecha encima
- Cada hora = 1 fila de 60px de alto
- Las citas se posicionan con `position: absolute` dentro de su celda día+hora usando `top` y `height` calculados a partir de `fechaHora` y `duracionMinutos`

**Navegación de semana:**
- En `CitasPage.tsx` agregar estado `const [semanaOffset, setSemanaOffset] = useState(0)`
- Botones `← Anterior` / `Siguiente →` para cambiar la semana visible
- Mostrar el rango de fechas de la semana en el header: ej. `"9 Jun — 15 Jun 2025"`

**Colores de bloques por estado:**
```
Pendiente   → bg-amber-100 border-amber-400 text-amber-800
Confirmada  → bg-indigo-100 border-indigo-400 text-indigo-800
Completada  → bg-emerald-100 border-emerald-400 text-emerald-800
Cancelada   → bg-red-100 border-red-300 text-red-500 opacity-60
```

**Contenido de cada bloque:**
- Línea 1: hora (ej. "14:30") + nombre del paciente
- Línea 2: motivo (si existe, truncado a 20 chars)
- Click en el bloque → llama `onCitaClick(cita)` para abrir el modal de edición existente

**Citas que caen fuera del rango 08:00–20:00:** mostrar igualmente pero marcadas con un ícono de advertencia ⚠️ al inicio del día.

### 3. Función utilitaria de semanas
Crear o agregar en `next-dent-client/src/utils/fechas.ts` (crear si no existe):

```typescript
// Retorna array de 7 Date objects (Lun a Dom) para la semana de offset dado
export function getDiasDeSemana(offset: number): Date[]

// Retorna "9 Jun — 15 Jun 2025"
export function formatRangoSemana(dias: Date[]): string

// Retorna true si una cita cae en ese día
export function citaEnDia(cita: Cita, dia: Date): boolean

// Retorna el top% y height en px para posicionar el bloque de la cita
export function calcularPosicionBloque(fechaHora: string, duracionMinutos: number): { topPx: number, heightPx: number }
// Referencia: 08:00 = 0px, cada hora = 60px, duracion mínima renderizada = 30min = 30px
```

---

## Pasos de implementación sugeridos

1. Crear `src/utils/fechas.ts` con las funciones de utilidad.
2. Crear `src/components/CalendarioSemanal.tsx`.
3. Modificar `CitasPage.tsx`:
   - Agregar el toggle Lista/Semana en el header.
   - Agregar estado `semanaOffset` y botones de navegación.
   - Renderizar `<CalendarioSemanal>` condicionalmente.
   - Pasar `onCitaClick` al componente para reusar el modal existente.
4. Ejecutar `npx tsc --noEmit` y corregir todos los errores antes de terminar.

---

## Lo que NO hacer
- No instalar ninguna librería de calendario (FullCalendar, react-big-calendar, etc.).
- No modificar la lógica del modal de edición existente en CitasPage.
- No cambiar la vista de lista — solo agregar la vista calendario como alternativa.
- No usar `localStorage` ni `sessionStorage`.
- No cambiar el endpoint — usar el `GET /api/citas` que ya llama CitasPage.

---

## Verificación final
```bash
npx tsc --noEmit
# No debe haber errores de TypeScript
```
Probar manualmente:
- [ ] El toggle Lista/Semana cambia la vista correctamente
- [ ] La semana actual muestra las fechas correctas en las columnas
- [ ] Los botones Anterior/Siguiente cambian la semana
- [ ] Las citas aparecen en el día y hora correctos
- [ ] Click en cita abre el modal de edición existente
- [ ] Los colores por estado son los especificados
