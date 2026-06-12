# Prompt 02b — Frontend (Claude Code · VS Code) · Fix citas: motivo + notas

Lee /CONTEXT.md antes de empezar.

⚠️  PREREQUISITO: El prompt 02a ya fue ejecutado en IntelliJ y
`GET /api/citas` ya devuelve `paciente.nombre` con datos reales,
y los campos `motivo` y `notas` existen en la BD y en el backend.
No toques ningún archivo Java.

---

## Archivos a modificar
1. `next-dent-client/src/types/cita.ts`
2. `next-dent-client/src/pages/CitasPage.tsx`

---

## Cambio 1 — cita.ts: agregar motivo y notas al tipo

Reemplaza el contenido completo de `src/types/cita.ts` por:

```typescript
import type { Paciente } from './paciente';

export interface Cita {
  idCita?: number;
  paciente: Paciente;
  idDoc: number;
  idTra: number;
  fecha: string;
  hora: string;
  estado: string;
  motivo?: string;
  notas?: string;
}
```

---

## Cambio 2 — CitasPage.tsx: 5 modificaciones puntuales

### 2a. Actualizar FormData y EMPTY_FORM
Localiza el tipo `FormData` y reemplázalo por:

```typescript
type FormData = {
  pacienteId: number | '';
  fecha: string;
  hora: string;
  estado: string;
  motivo: string;
  notas: string;
};

const EMPTY_FORM: FormData = {
  pacienteId: '',
  fecha: '',
  hora: '',
  estado: 'Pendiente',
  motivo: '',
  notas: '',
};
```

### 2b. Actualizar openEdit
Localiza la función `openEdit` y reemplaza el setForm interno por:

```typescript
setForm({
  pacienteId: c.paciente.idPac,
  fecha: c.fecha,
  hora: c.hora,
  estado: c.estado,
  motivo: c.motivo ?? '',
  notas: c.notas ?? '',
});
```

### 2c. Actualizar buildPayload
Localiza `buildPayload` y reemplaza el return por:

```typescript
return {
  paciente,
  idDoc: 1,
  idTra: 1,
  fecha: form.fecha,
  hora: form.hora,
  estado: form.estado,
  motivo: form.motivo || undefined,
  notas: form.notas || undefined,
};
```

### 2d. Agregar columna "Motivo" en la tabla
En el `<thead>`, agrega este `<th>` después del de "Paciente":

```tsx
<th className="px-5 py-3 text-left font-semibold text-gray-600 uppercase tracking-wide text-xs">
  Motivo
</th>
```

Actualiza el `colSpan` del estado vacío de 6 a 7.

En cada `<tr>` del map, agrega esta celda después de la del paciente:

```tsx
<td className="px-5 py-3.5 text-gray-600 max-w-[200px]">
  {c.motivo
    ? <span className="truncate block text-sm">{c.motivo}</span>
    : <span className="text-gray-300 text-sm italic">—</span>
  }
</td>
```

### 2e. Agregar campos en el formulario modal
En el `<form>` del modal, agrega estos dos campos después del
selector de `estado` y antes del div de botones (Cancelar / Guardar):

```tsx
{/* Motivo de consulta */}
<div className="flex flex-col gap-1.5">
  <label className="text-xs font-medium text-gray-700">
    Motivo de consulta
  </label>
  <input
    name="motivo"
    type="text"
    value={form.motivo}
    onChange={handleChange}
    placeholder="Ej: Dolor molar, limpieza, revisión..."
    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder-gray-300"
  />
</div>

{/* Notas adicionales */}
<div className="flex flex-col gap-1.5">
  <label className="text-xs font-medium text-gray-700">
    Notas adicionales
  </label>
  <textarea
    name="notas"
    value={form.notas}
    onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
    placeholder="Observaciones, indicaciones especiales..."
    rows={3}
    className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none placeholder-gray-300"
  />
</div>
```

---

## Verificación

```bash
cd next-dent-client && npx tsc --noEmit
```

Sin errores de TypeScript = listo.

## Restricciones
- No tocar ningún archivo Java.
- No modificar citaService.ts — los endpoints ya son correctos.
- No cambiar el diseño visual existente fuera de lo indicado.
- No instalar dependencias nuevas.
