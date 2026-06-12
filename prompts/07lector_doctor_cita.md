# Prompt 04 — Selector de Doctor al Crear/Editar Cita
> Tarea ROADMAP 2.3 · Solo frontend · ~1h · No requiere cambios en backend

---

## Objetivo
Agregar un **campo selector de doctor** en el formulario de creación y edición de citas (`CitasPage.tsx`). Actualmente el formulario no incluye este campo; el doctor queda sin asociar. El endpoint `GET /api/doctores` ya existe y devuelve la lista completa.

---

## Contexto del proyecto (leer antes de tocar código)

- **Archivo a modificar**: `next-dent-client/src/pages/CitasPage.tsx`
- **Endpoint disponible**: `GET http://localhost:8080/api/doctores`
- **Design system**:
  - Select / input: `border border-slate-200 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none`
  - Label: `text-sm font-medium text-slate-700 mb-1`
  - Sin librerías de componentes externas
  - Íconos: SVG inline únicamente

---

## Modelo de datos

### Doctor (revisar el tipo existente en el proyecto)
```typescript
interface Doctor {
  idDoctor: number;
  nombre: string;
  apellido: string;
  especialidad?: string;
}
```

### Cita — campo a agregar
```typescript
interface CitaFormData {
  // campos existentes...
  idDoctor: number | null;   // AGREGAR este campo
}
```

Verificar cómo el backend recibe el `idDoctor` al hacer POST/PUT de una cita. Si el campo ya existe en el modelo Java pero el frontend no lo enviaba, simplemente hay que incluirlo en el payload. Si no existe en el backend: agregarlo al DTO de Java también (ver instrucciones de backend al final).

---

## Requerimientos de implementación

### 1. Fetch de doctores en CitasPage
Agregar fetch de doctores al montar el componente. **No crear un nuevo hook** — hacerlo directamente en el componente con `useState` + `useEffect`, ya que es una lista estática que no necesita polling:

```typescript
const [doctores, setDoctores] = useState<Doctor[]>([]);

useEffect(() => {
  axios.get('http://localhost:8080/api/doctores')
    .then(r => setDoctores(r.data))
    .catch(e => console.error('Error cargando doctores:', e));
}, []);
```

### 2. Campo select en el formulario
Dentro del modal/formulario de nueva cita y edición, agregar después del campo de paciente:

```tsx
<div>
  <label className="block text-sm font-medium text-slate-700 mb-1">
    Doctor
  </label>
  <select
    value={form.idDoctor ?? ''}
    onChange={e => setForm({ ...form, idDoctor: Number(e.target.value) || null })}
    className="border border-slate-200 rounded-xl px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none bg-white"
  >
    <option value="">Seleccionar doctor...</option>
    {doctores.map(d => (
      <option key={d.idDoctor} value={d.idDoctor}>
        Dr. {d.nombre} {d.apellido}{d.especialidad ? ` — ${d.especialidad}` : ''}
      </option>
    ))}
  </select>
</div>
```

### 3. Incluir `idDoctor` en el payload del POST/PUT
Al enviar el formulario, asegurarse de que `idDoctor` se incluye en el body:
```typescript
const payload = {
  ...form,
  idDoctor: form.idDoctor,   // asegurar que se incluye
};
```

### 4. Mostrar el doctor en la lista de citas
En la vista de lista de `CitasPage.tsx`, si la cita tiene doctor, mostrarlo como texto secundario:
```
14:30 — Juan Pérez                    Dr. García · Pendiente
```

### 5. Validación
- Si el sistema tiene más de 1 doctor: el campo es **requerido** antes de guardar.
- Si solo hay 1 doctor (caso actual sin auth): preseleccionar automáticamente el primero.
  ```typescript
  useEffect(() => {
    if (doctores.length === 1 && !form.idDoctor) {
      setForm(f => ({ ...f, idDoctor: doctores[0].idDoctor }));
    }
  }, [doctores]);
  ```

---

## Posible ajuste en backend (verificar primero)

Antes de modificar el frontend, revisar si la entidad `Cita` en Java ya tiene el campo `idDoctor` o `doctor`:

```bash
# En next-dent-api, buscar:
grep -r "idDoctor\|Doctor doctor" src/main/java/
```

**Si ya existe** → solo hay que enviarlo desde el frontend. No tocar backend.

**Si NO existe** → agregar en `next-dent-api`:

1. En la entidad `Cita.java`:
```java
@ManyToOne
@JoinColumn(name = "id_doctor")
private Doctor doctor;
```

2. En `CitaRequestDTO.java` (o el DTO equivalente):
```java
private Long idDoctor;
```

3. En `CitaService.java`, en el método de crear/actualizar:
```java
if (dto.getIdDoctor() != null) {
  Doctor doctor = doctorRepository.findById(dto.getIdDoctor())
    .orElseThrow(() -> new RuntimeException("Doctor no encontrado"));
  cita.setDoctor(doctor);
}
```

4. En `CitaResponseDTO.java` (o el mapper), incluir el nombre del doctor:
```java
private String nombreDoctor;
// en el mapper: dto.setNombreDoctor(cita.getDoctor() != null ? cita.getDoctor().getNombre() : null);
```

5. Agregar la columna en PostgreSQL si no existe:
```sql
ALTER TABLE cita ADD COLUMN IF NOT EXISTS id_doctor BIGINT REFERENCES doctor(id_doctor);
```

---

## Pasos de implementación sugeridos

1. Verificar con `grep` si el campo doctor ya existe en el backend.
2. Si no existe, aplicar los cambios de backend primero y recompilar.
3. Modificar `CitasPage.tsx` con el fetch de doctores y el campo select.
4. Verificar que el payload del formulario incluye `idDoctor`.
5. Agregar el nombre del doctor en la vista de lista.
6. Ejecutar `npx tsc --noEmit`.

---

## Lo que NO hacer
- No crear un hook `useDoctores` separado — el fetch directo en el componente es suficiente.
- No instalar librerías de select (react-select, etc.).
- No cambiar la lógica del modal, solo agregar el campo.

---

## Verificación final
```bash
npx tsc --noEmit
```
Probar manualmente:
- [ ] El select de doctor aparece en el formulario de nueva cita
- [ ] El select muestra todos los doctores de la BD
- [ ] Si hay 1 solo doctor, queda preseleccionado automáticamente
- [ ] Al guardar, la cita queda asociada al doctor en BD
- [ ] En la lista de citas se muestra el nombre del doctor
- [ ] El formulario de edición carga el doctor ya asignado
