# Next Dent — Prompt #13a: Checkpoint Pre-Deploy

> Ejecutar este prompt ANTES de iniciar el deploy.
> Objetivo: hacer un commit limpio con los cambios necesarios para producción,
> sin exponer credenciales y dejando el repo en estado recuperable.

---

## Contexto

Stack: Spring Boot (Java) + React + Vite + Tailwind
Repo: monorepo con `next-dent-api/next-dent-api/` y `next-dent-client/`

Problema detectado en archivos actuales:
- `application.properties` tiene JWT secret en texto plano (`app.jwt.secret=nextdent_clave_secreta_minimo_32_caracteres_aqui`)
- CORS hardcodeado en `SecurityConfig.java` con `List.of(...)` — no configurable por entorno
- No existe perfil `prod` de Spring Boot
- `server.address=127.0.0.1` en `application.properties` rompe Railway

---

## Tareas para Claude Code

### PASO 0 — Verificar estado del repo antes de tocar nada

```bash
git status
git log --oneline -5
```

Luego verificar el `.gitignore` raíz:

```bash
cat .gitignore
```

Confirmar que contiene al menos:
```
.env
*.env
.env.*
```

Si NO contiene esas líneas, agregarlas al `.gitignore` raíz antes de continuar.

---

### PASO 1 — Verificar si `application.properties` ya tiene historial en Git

```bash
git log --oneline -- next-dent-api/next-dent-api/src/main/resources/application.properties
```

- Si tiene historial → el secret ya está expuesto. No hay nada que hacer retroactivamente; simplemente **no reutilizar ese secret en producción**. Continuar.
- Si NO tiene historial (primer commit) → verificar que `application.properties` esté en `.gitignore`. Si no lo está, agregarlo ahora.

---

### PASO 2 — Crear `application-prod.properties`

**Archivo:** `next-dent-api/next-dent-api/src/main/resources/application-prod.properties`

```properties
# Sin server.address — Railway necesita escuchar en 0.0.0.0
server.port=${PORT:8080}

# Base de datos
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false

# JWT
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration-ms=${JWT_EXPIRATION:86400000}

# CORS
cors.allowed-origins=${CORS_ALLOWED_ORIGINS}

# Logs
logging.level.org.springframework.security=WARN
```

---

### PASO 3 — Modificar `SecurityConfig.java`

**Archivo:** `next-dent-api/next-dent-api/src/main/java/com/clinica/next_dent_api/security/SecurityConfig.java`

Primero leer el archivo completo con `cat` para confirmar el contenido actual, luego aplicar estos cambios:

**3a. Agregar imports** (después de los imports existentes de `List`):
```java
import org.springframework.beans.factory.annotation.Value;
import java.util.Arrays;
```

**3b. Agregar campo** (después de los campos `@RequiredArgsConstructor` existentes, antes del primer `@Bean`):
```java
@Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://127.0.0.1:5173,http://127.0.0.1:5174}")
private String[] allowedOrigins;
```

**3c. Reemplazar el método `corsConfigurationSource()`** — el método actual usa `List.of(...)` hardcodeado. Reemplazarlo completo por:
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList(allowedOrigins));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

---

### PASO 4 — Agregar CORS fallback en `application.properties`

**Archivo:** `next-dent-api/next-dent-api/src/main/resources/application.properties`

Agregar al final del archivo (sin tocar ninguna línea existente):

```properties
# CORS local (el perfil prod sobreescribe esto con variable de entorno)
cors.allowed-origins=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://127.0.0.1:5173,http://127.0.0.1:5174
```

---

### PASO 5 — Crear `Procfile`

**Archivo:** `next-dent-api/next-dent-api/Procfile`

```
web: java -Dspring.profiles.active=prod -jar target/next-dent-api-0.0.1-SNAPSHOT.jar
```

---

### PASO 6 — Verificar que el build local sigue funcionando

```bash
cd next-dent-api/next-dent-api
./mvnw clean package -DskipTests
```

Debe terminar con `BUILD SUCCESS`. Si falla, corregir antes de continuar.

Para el frontend:
```bash
cd next-dent-client
npx tsc --noEmit
```

Debe terminar sin errores.

---

### PASO 7 — Commit

```bash
git add \
  next-dent-api/next-dent-api/src/main/resources/application-prod.properties \
  next-dent-api/next-dent-api/src/main/java/com/clinica/next_dent_api/security/SecurityConfig.java \
  next-dent-api/next-dent-api/src/main/resources/application.properties \
  next-dent-api/next-dent-api/Procfile

# Si se modificó el .gitignore raíz en el PASO 0:
# git add .gitignore

git status
# Revisar que NO aparezcan archivos .env ni credenciales reales en el staging area
# Si algo inesperado aparece en staging, hacer git reset HEAD <archivo> antes de commitear

git commit -m "chore: preparar backend para deploy en Railway (perfil prod, CORS configurable)"
```

---

### PASO 8 — Push

```bash
git push origin main
```

Confirmar que el push fue exitoso antes de continuar con el deploy.

---

## Criterios de éxito

- [ ] `./mvnw clean package -DskipTests` termina con `BUILD SUCCESS`
- [ ] `npx tsc --noEmit` sin errores en el frontend
- [ ] `git status` limpio después del commit (sin archivos sin trackear relacionados)
- [ ] `git log --oneline -1` muestra el commit de checkpoint
- [ ] No hay archivos `.env` ni credenciales reales en el commit (`git show HEAD --stat`)

---

## Si algo sale mal

Para volver al estado anterior al checkpoint:
```bash
git revert HEAD
# o, si el commit no fue pusheado aún:
git reset --soft HEAD~1
```
