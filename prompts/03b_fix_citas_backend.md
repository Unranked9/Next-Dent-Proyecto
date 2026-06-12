# Fix Citas — Backend
# Archivo: prompts/03b_fix_citas_backend.md

Lee CONTEXT.md antes de empezar.
Backend: Spring Boot + PostgreSQL en `next-dent-api/next-dent-api/`

## Contexto

La entidad `Cita.java` tiene `paciente` como `@ManyToOne`, lo cual es
correcto. Sin embargo hay problemas en cómo el controller recibe y
procesa el payload del frontend.

Estructura actual de `Cita.java`:
```java
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "id_pac")
private Paciente paciente;  // objeto anidado

@Column(name = "id_doc")
private Integer idDoc;

private String fecha;
private String hora;
private String estado;
private String motivo;

@Column(name = "notas")
private String notas;
```

---

## PROBLEMA 1 — El POST recibe `paciente: { idPac: N }` pero no resuelve
la entidad completa antes de guardar

Cuando el frontend envía `{ "paciente": { "idPac": 3 }, "idDoc": 1, ... }`,
Spring deserializa `paciente` como un objeto `Paciente` con solo `idPac`
seteado. Si `CitaService.guardarCita()` hace directamente
`citaRepository.save(cita)` sin resolver la entidad Paciente completa,
puede haber problemas de detached entity o datos incompletos.

### Fix en `CitaService.java`

Abre `src/main/java/.../service/CitaService.java` y verifica el método
`guardarCita`. Debe resolver el paciente desde el repositorio antes de
guardar:

```java
// Inyectar PacienteRepository si no está ya
@Autowired
private PacienteRepository pacienteRepository;

public Cita guardarCita(Cita cita) {
    // Resolver paciente completo para evitar detached entity
    if (cita.getPaciente() != null && cita.getPaciente().getIdPac() != null) {
        Paciente paciente = pacienteRepository
            .findById(cita.getPaciente().getIdPac())
            .orElseThrow(() -> new RuntimeException(
                "Paciente no encontrado: " + cita.getPaciente().getIdPac()
            ));
        cita.setPaciente(paciente);
    }
    return citaRepository.save(cita);
}
```

---

## PROBLEMA 2 — Verificar que `tb_cita` tiene la columna `motivo` y `notas`

Ejecutar en PostgreSQL:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tb_cita'
ORDER BY ordinal_position;
```

Si faltan las columnas `motivo` o `notas`, crearlas:
```sql
ALTER TABLE tb_cita ADD COLUMN IF NOT EXISTS motivo VARCHAR(255);
ALTER TABLE tb_cita ADD COLUMN IF NOT EXISTS notas TEXT;
```

---

## LIMPIEZA — Citas corruptas en BD

Hay citas con `id_pac = NULL` y `fecha = NULL` creadas antes del fix.
Identificarlas y eliminarlas:

```sql
-- Ver cuáles son
SELECT id_cita, estado, fecha FROM tb_cita WHERE id_pac IS NULL;

-- Eliminar (confirmar primero con el SELECT de arriba)
DELETE FROM tb_cita WHERE id_pac IS NULL AND fecha IS NULL;
```

---

## VERIFICACIÓN

Reiniciar el backend y probar con curl:

```bash
# Crear cita (debe devolver paciente con nombre completo)
curl -X POST http://localhost:8080/api/citas \
  -H "Content-Type: application/json" \
  -d '{
    "paciente": { "idPac": 1 },
    "idDoc": 1,
    "fecha": "2026-06-20",
    "hora": "10:00",
    "estado": "Pendiente",
    "motivo": "Revisión general"
  }'

# La respuesta debe incluir paciente con nombre y apellido:
# { "idCita": N, "paciente": { "idPac": 1, "nombre": "...", "apellido": "..." }, ... }
```

Si el paciente sigue llegando como `null` en la respuesta, revisar los
logs de Spring Boot al momento del POST para ver el error exacto.
