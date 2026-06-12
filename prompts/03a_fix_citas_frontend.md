# Fix Citas — Frontend
# Archivo: prompts/03a_fix_citas_frontend.md

Lee CONTEXT.md antes de empezar.

## Contexto

El backend devuelve citas con esta estructura real:
```json
{ "idCita": 1, "paciente": { "idPac": 3, "nombre": "María", "apellido": "García" },
  "idDoc": 1, "fecha": "2026-06-12", "hora": "16:02", "estado": "Pendiente",
  "motivo": "Dolor molar", "notas": "Sin alergias" }
```

El campo de notas en el backend se llama `notas` (NO `observaciones`).
El paciente es un objeto anidado (NO un integer `idPaciente`).

---

## ARCHIVO 1 — `next-dent-client/src/types/cita.ts`

Reemplazar completamente:

```typescript
export interface PacienteResumen {
  idPac: number;
  nombre: string;
  apellido: string;
  dni?: string;
}

export interface Cita {
  idCita?: number;
  paciente: PacienteResumen | null;
  idDoc: number | null;
  idTra?: number | null;
  fecha: string | null;
  hora: string | null;
  estado: 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';
  motivo?: string | null;
  notas?: string | null;
}

// DTO que se envía al backend en POST/PUT
// El backend espera paciente como objeto anidado por @ManyToOne
export interface CitaPayload {
  paciente: { idPac: number };
  idDoc: number;
  fecha: string;
  hora: string;
  estado: string;
  motivo?: string;
  notas?: string;
}
```

---

## ARCHIVO 2 — `next-dent-client/src/services/citaService.ts`

Reemplazar completamente:

```typescript
import axios from 'axios';
import type { Cita, CitaPayload } from '../types/cita';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/citas',
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    console.error('Error en citaService:', error);
    return Promise.reject(error);
  }
);

export const getCitas = (): Promise<Cita[]> =>
  api.get<Cita[]>('').then((res) => res.data);

export const createCita = (payload: CitaPayload): Promise<Cita> =>
  api.post<Cita>('', payload).then((res) => res.data);

export const updateCita = (id: number, payload: CitaPayload): Promise<Cita> =>
  api.put<Cita>(`/${id}`, payload).then((res) => res.data);

export const deleteCita = (id: number): Promise<void> =>
  api.delete(`/${id}`).then(() => undefined);
```

---

## ARCHIVO 3 — `next-dent-client/src/pages/CitasPage.tsx`

Aplicar estos 2 cambios puntuales:

### Cambio A — `openEdit`: null check en `c.paciente`

Busca la función `openEdit` y reemplázala:

```typescript
const openEdit = (c: Cita) => {
  setEditing(c);
  setForm({
    pacienteId: c.paciente?.idPac ?? '',
    idDoc: c.idDoc ?? '',
    fecha: c.fecha ?? '',
    hora: c.hora ?? '',
    estado: c.estado,
    motivo: c.motivo ?? '',
    notas: c.notas ?? '',
  });
  setFormError(null);
  setModalOpen(true);
};
```

### Cambio B — `handleSubmit`: payload con estructura correcta

Dentro de `handleSubmit`, reemplaza la construcción del payload:

```typescript
// ANTES (incorrecto — backend ignora idPaciente)
const payload: CitaPayload = {
  idPaciente: Number(form.pacienteId),
  idDoc: Number(form.idDoc),
  ...
};

// DESPUÉS (correcto — backend espera objeto anidado)
const payload: CitaPayload = {
  paciente: { idPac: Number(form.pacienteId) },
  idDoc: Number(form.idDoc),
  fecha: form.fecha,
  hora: form.hora,
  estado: form.estado,
  motivo: form.motivo || undefined,
  notas: form.notas || undefined,
};
```

---

## VERIFICACIÓN

```bash
cd next-dent-client
npx tsc --noEmit
```

Sin errores. Luego en el navegador:
1. Crear cita nueva con paciente seleccionado
2. Network tab → POST /api/citas → verificar que el body es:
   `{ "paciente": { "idPac": N }, "idDoc": N, "fecha": "...", ... }`
3. La tarjeta debe mostrar el nombre del paciente
