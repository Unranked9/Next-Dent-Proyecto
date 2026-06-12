# Prompt 02a — Backend (IntelliJ) · Fix citas: FetchType + motivo + notas

## Contexto
Sistema de gestión odontológica Next Dent.
Backend: Spring Boot + JPA + PostgreSQL.
Modelo relevante: `tb_cita` con relación ManyToOne a `tb_paciente`.

---

## Cambio 1 — Cita.java: FetchType.LAZY → EAGER

### Problema
El campo `paciente` en `Cita.java` usa `FetchType.LAZY`. Hibernate no
carga el objeto `Paciente` al serializar el JSON, por lo que el frontend
recibe `paciente: null` y no puede mostrar el nombre.

### Archivo
`src/main/java/com/clinica/next_dent_api/model/Cita.java`

### Cambio
```java
// ANTES:
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "id_pac")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
private Paciente paciente;

// DESPUÉS:
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "id_pac")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
private Paciente paciente;
```

---

## Cambio 2 — Cita.java: agregar campos motivo y notas

### Archivo
`src/main/java/com/clinica/next_dent_api/model/Cita.java`

### Cambio
Agrega estos dos campos después de `private String estado;`:

```java
@Column(name = "motivo")
private String motivo;

@Column(name = "notas")
private String notas;
```

El modelo completo después de los cambios debe quedar:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "tb_cita")
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cita")
    private Integer idCita;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_pac")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Paciente paciente;

    @Column(name = "id_doc")
    private Integer idDoc;

    @Column(name = "id_tra")
    private Integer idTra;

    private String fecha;
    private String hora;
    private String estado;

    @Column(name = "motivo")
    private String motivo;

    @Column(name = "notas")
    private String notas;
}
```

---

## Cambio 3 — Base de datos: agregar columnas

Ejecuta este SQL en PostgreSQL **antes de reiniciar Spring Boot**:

```sql
ALTER TABLE tb_cita ADD COLUMN IF NOT EXISTS motivo VARCHAR(255);
ALTER TABLE tb_cita ADD COLUMN IF NOT EXISTS notas TEXT;
```

Puedes ejecutarlo desde IntelliJ (pestaña Database) o desde pgAdmin/psql.

---

## Orden de ejecución

1. Ejecutar el SQL en PostgreSQL
2. Aplicar los cambios en Cita.java
3. Reiniciar Spring Boot (Run en IntelliJ)
4. Verificar en el navegador o Postman que `GET /api/citas` devuelve
   el objeto `paciente` completo con `nombre` y `apellido`, y que
   aparecen los campos `motivo` y `notas` (pueden ser null).

## Verificación rápida con curl
```bash
curl http://localhost:8080/api/citas | python -m json.tool | head -40
```
El JSON debe mostrar `"paciente": { "idPac": ..., "nombre": "...", ... }`
con datos reales, no null.
