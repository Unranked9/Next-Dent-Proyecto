# Prompt 02 — Rediseño visual batch: CitasPage · DoctoresPage · TratamientosPage · ConfiguracionPreciosPage

## Contexto

Este prompt es parte del Proyecto Next Dent (clínica dental).  
**Repo:** `https://github.com/Unranked9/Next-Dent-Proyecto`  
Trabajas únicamente en `next-dent-client/src/`.

La referencia visual ya terminada es **`pages/PacientesPage.tsx`** — léela completa antes de tocar cualquier otro archivo. Toda la estructura, clases Tailwind y patrones de interacción de las 4 páginas de este prompt deben seguir ese mismo estándar.

---

## Design System obligatorio (no desviarse)

| Token | Valor |
|---|---|
| Fondo de página | `bg-slate-100 min-h-screen` |
| Cards / paneles | `bg-white rounded-2xl border border-slate-200 hover:border-indigo-200` |
| Botón primario | `bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-sm font-medium` |
| Botón secundario | `border border-slate-200 text-slate-600 hover:border-indigo-300 rounded-xl px-4 py-2 text-sm` |
| Botón peligro | `bg-red-50 text-red-600 hover:bg-red-100 rounded-xl px-4 py-2 text-sm` |
| Input / select | `border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300` |
| Heading de página | `text-xl font-bold text-slate-800` |
| Subheading / label | `text-sm font-medium text-slate-500` |
| Texto principal | `text-slate-700` |
| Íconos | SVG inline únicamente — **no instalar** ninguna librería de iconos |
| Tailwind | Puro — **no instalar** librerías de componentes externas |

---

## Reglas generales para las 4 páginas

1. **Leer el archivo actual completo** antes de reescribirlo. Preservar toda la lógica de negocio, llamadas a servicios y estado existentes. El trabajo es solo visual.
2. **No inventar endpoints** que no estén en CONTEXT.md. Si el archivo actual llama a un servicio, mantener ese mismo import y esa misma llamada.
3. **Estructura de layout** siempre igual:
   ```
   <div className="bg-slate-100 min-h-screen p-6">
     {/* Cabecera: título + botón "Nuevo X" */}
     <div className="flex items-center justify-between mb-6"> … </div>
     {/* Barra de búsqueda / filtros */}
     <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6"> … </div>
     {/* Contenido principal: tabla o cards */}
     <div className="bg-white rounded-2xl border border-slate-200"> … </div>
     {/* Modal (si existe) */}
   </div>
   ```
4. **Tabla de datos**: cabecera con `bg-slate-50 border-b border-slate-100`, filas con `hover:bg-slate-50 transition-colors`, celdas con `px-6 py-4 text-sm`.
5. **Estados de carga y vacío**: spinner SVG animado mientras carga; mensaje ilustrado cuando no hay datos.
6. **Modales**: overlay `fixed inset-0 bg-black/40 flex items-center justify-center z-50`, panel `bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl`.
7. **Verificar al final**: `npx tsc --noEmit` — 0 errores TypeScript.

---

## Tarea 1 — `pages/CitasPage.tsx`

### Qué hay que hacer
Aplicar el design system manteniendo toda la funcionalidad CRUD existente.

### Datos y endpoints usados (ya existen en el archivo)
- `GET /api/citas` — lista de citas
- `GET /api/pacientes` — para el selector de paciente en el formulario
- `GET /api/doctores` — para el selector de doctor en el formulario
- Estados de cita: `'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada'` (**sensibles a mayúsculas**)

### Componentes visuales requeridos

**Cabecera**
```
[Citas]                              [+ Nueva cita]
Gestión de agenda y citas clínicas
```

**Filtros** (fila horizontal en card blanco):
- Input de búsqueda por nombre de paciente
- Select de estado: Todos / Pendiente / Confirmada / Completada / Cancelada
- Select de fecha (hoy / esta semana / este mes)

**Tabla de citas** (columnas):
| # | Paciente | Doctor | Fecha y hora | Motivo | Estado | Acciones |
|---|---|---|---|---|---|---|

- Columna **Estado**: badge con color según estado:
  - `Pendiente` → `bg-amber-100 text-amber-700`
  - `Confirmada` → `bg-blue-100 text-blue-700`
  - `Completada` → `bg-emerald-100 text-emerald-700`
  - `Cancelada` → `bg-red-100 text-red-600`
- Columna **Acciones**: botón editar (ícono lápiz SVG) + botón cancelar (ícono X SVG), solo visibles en hover de fila.

**Modal nueva/editar cita** (campos):
- Paciente (select con búsqueda o select normal)
- Doctor (select)
- Fecha (date input)
- Hora (time input)
- Motivo (textarea)
- Estado (select — respetar mayúsculas exactas)

---

## Tarea 2 — `pages/DoctoresPage.tsx`

### Qué hay que hacer
Aplicar el design system manteniendo el CRUD existente.

### Datos y endpoints usados
- `GET /api/doctores` — lista doctores
- CRUD completo (POST/PUT/DELETE si ya existe en el archivo — no agregar si no existe)

### Componentes visuales requeridos

**Cabecera**
```
[Doctores]                          [+ Nuevo doctor]
Gestión del equipo clínico
```

**Filtro**: input de búsqueda por nombre/especialidad.

**Cards de doctor** (grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`):

Cada card:
```
┌─────────────────────────────────┐
│  [Avatar initials circle]       │
│  Nombre completo                │
│  Especialidad           [badge] │
│  ─────────────────────────────  │
│  📧 email@clinica.com           │
│  📞 +51 999 999 999             │
│  [Editar]           [Eliminar]  │
└─────────────────────────────────┘
```
- Avatar: círculo `bg-indigo-100 text-indigo-700` con iniciales del nombre
- Badge especialidad: `bg-indigo-50 text-indigo-600 text-xs rounded-full px-2 py-0.5`
- Botón Editar: secundario; Eliminar: peligro

**Modal nuevo/editar doctor** (campos que ya existan en el modelo):
- Nombre, apellido, especialidad, email, teléfono (o los que use el archivo actual)

---

## Tarea 3 — `pages/TratamientosPage.tsx`

### Qué hay que hacer
Aplicar el design system. Esta página gestiona el catálogo de tratamientos (no los realizados a pacientes).

### Datos y endpoints usados
- Usar los servicios/endpoints que ya existan en el archivo actual. No inventar nuevos.

### Componentes visuales requeridos

**Cabecera**
```
[Tratamientos]                    [+ Nuevo tratamiento]
Catálogo de procedimientos clínicos
```

**Filtro**: input búsqueda por nombre + select de categoría (si el modelo tiene categoría).

**Tabla de tratamientos** (columnas):
| # | Nombre | Descripción | Duración estimada | Precio base | Acciones |
|---|---|---|---|---|---|

- Precio base: formato `S/ 0.00` alineado a la derecha
- Acciones: editar + eliminar (íconos SVG inline, visibles en hover)

**Modal nuevo/editar tratamiento**: campos que ya use el archivo actual.

---

## Tarea 4 — `pages/ConfiguracionPreciosPage.tsx`

### Qué hay que hacer
Rediseño visual del tarifario. Esta página muestra y gestiona las tarifas activas.

### CRÍTICO — nombre de función correcto
El servicio se importa como:
```typescript
import { getActivos } from '../services/tarifarioService';
// NO usar getTarifario — ese nombre no existe
```

### Componentes visuales requeridos

**Cabecera**
```
[Configuración de Precios]         [+ Nueva tarifa]
Tarifario vigente del consultorio
```

**Cards de alerta** (si aplica): banner `bg-amber-50 border border-amber-200 rounded-xl` si no hay tarifas activas.

**Tabla de tarifas** (columnas):
| # | Código | Tratamiento | Precio (S/) | Estado | Acciones |
|---|---|---|---|---|---|

- Columna Estado: badge `Activo` → `bg-emerald-100 text-emerald-700` / `Inactivo` → `bg-slate-100 text-slate-500`
- Precio: negrita, alineado a la derecha
- Acciones: editar + toggle activo/inactivo (íconos SVG)

**Modal nueva/editar tarifa**: campos que ya use el archivo actual.

---

## Orden de ejecución sugerido

```
1. Leer pages/PacientesPage.tsx completo  ← referencia visual
2. Leer pages/CitasPage.tsx               ← preservar lógica
3. Reescribir CitasPage.tsx
4. Leer pages/DoctoresPage.tsx
5. Reescribir DoctoresPage.tsx
6. Leer pages/TratamientosPage.tsx
7. Reescribir TratamientosPage.tsx
8. Leer pages/ConfiguracionPreciosPage.tsx
9. Reescribir ConfiguracionPreciosPage.tsx
10. npx tsc --noEmit  ← debe terminar con 0 errores
```

---

## Checklist de entrega

- [ ] Las 4 páginas usan `bg-slate-100` como fondo
- [ ] Cards con `rounded-2xl border border-slate-200`
- [ ] Botones primarios con `bg-indigo-600 rounded-xl`
- [ ] Inputs con `rounded-xl focus:ring-indigo-300`
- [ ] Tablas con `hover:bg-slate-50` en filas
- [ ] Estados de carga con spinner SVG
- [ ] Estados vacíos con mensaje
- [ ] Modales con overlay oscuro
- [ ] 0 imports de librerías de iconos (solo SVG inline)
- [ ] 0 errores en `npx tsc --noEmit`
- [ ] Ninguna llamada a `getTarifario` (usar `getActivos`)
- [ ] Estados de cita con mayúsculas exactas: `'Pendiente'`, `'Confirmada'`, etc.
