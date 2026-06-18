# Next Dent — Prompt #13: Deploy a Producción

> **Estrategia elegida:** Opción A — una BD por clínica (dos deploys independientes para el piloto).
> Reutilizar este prompt cambiando solo las variables de entorno para la segunda clínica.

---

## Contexto

- Frontend: React + TypeScript + Tailwind + Vite (`next-dent-client/`)
- Backend: Spring Boot + PostgreSQL (`next-dent-api/next-dent-api/`)
- Auth: JWT stateless, BCrypt passwords
- Frontend → **Vercel** | Backend + BD → **Railway**

---

## PARTE 1 — Preparar el backend

### 1.1 Crear `application-prod.properties`

**Archivo:** `next-dent-api/next-dent-api/src/main/resources/application-prod.properties`

```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false

jwt.secret=${JWT_SECRET}
jwt.expiration=${JWT_EXPIRATION:86400000}

server.port=${PORT:8080}

cors.allowed-origins=${CORS_ALLOWED_ORIGINS}
```

> ⚠️ `ddl-auto=validate` — nunca `update` en producción.

### 1.2 Hacer CORS configurable por variable de entorno

En la clase de configuración CORS (probablemente `WebConfig.java` o `SecurityConfig.java`):

```java
@Value("${cors.allowed-origins}")
private String[] allowedOrigins;

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList(allowedOrigins));
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("*"));
    config.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

En `application.properties` (local), agregar:
```properties
cors.allowed-origins=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
```

### 1.3 Verificar que JWT secret viene de variable de entorno

En `JwtService.java` (o equivalente), buscar el campo del secret:

```java
// ANTES (hardcodeado — cambiar si es el caso):
private String secret = "miClaveSecreta123";

// DESPUÉS:
@Value("${jwt.secret}")
private String secret;
```

### 1.4 Crear `Procfile` para Railway

**Archivo:** `next-dent-api/next-dent-api/Procfile`

```
web: java -Dspring.profiles.active=prod -jar target/next-dent-api-0.0.1-SNAPSHOT.jar
```

### 1.5 Verificar build local antes de deployar

```bash
cd next-dent-api/next-dent-api
./mvnw clean package -DskipTests
# Debe terminar con BUILD SUCCESS y generar target/*.jar
```

---

## PARTE 2 — Deploy Railway (backend + BD)

### 2.1 Crear proyecto en Railway

1. [railway.app](https://railway.app) → **New Project**
2. **Add PostgreSQL** → Railway genera las variables de BD automáticamente
3. **Add Service → GitHub Repo** → seleccionar `Next-Dent-Proyecto`
4. En el servicio Spring Boot → **Settings → Root Directory**: `next-dent-api/next-dent-api`

### 2.2 Variables de entorno en Railway

| Variable | Valor |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `DB_USER` | `${{Postgres.PGUSER}}` |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `JWT_SECRET` | resultado de `openssl rand -base64 64` |
| `JWT_EXPIRATION` | `86400000` |
| `CORS_ALLOWED_ORIGINS` | `https://TU-APP.vercel.app` (actualizar tras deploy Vercel) |

> Generar JWT secret: `openssl rand -base64 64`

### 2.3 Crear tablas en la BD de producción

Desde el panel de Railway → PostgreSQL → **Query** (o conectar con DBeaver/psql usando las credenciales del panel).

Ejecutar el DDL en este orden (respetar foreign keys):

```
1. doctores
2. usuarios          → referencia doctores
3. pacientes
4. citas             → referencia pacientes, doctores
5. tarifario
6. presupuestos      → referencia pacientes, doctores
7. presupuesto_detalle → referencia presupuestos, tarifario
8. pagos             → referencia pacientes
9. ciclos_clinicos   → referencia pacientes, doctores
10. odontograma      → referencia ciclos_clinicos
```

> ⚠️ BD de producción vacía — sin datos de prueba.

### 2.4 Tabla `usuarios` (creada manualmente, sin migration)

```sql
CREATE TABLE usuarios (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  id_doctor BIGINT REFERENCES doctores(id_doc) ON DELETE SET NULL
);
```

### 2.5 Crear primer usuario ADMIN

Generar hash BCrypt (cost 10) en: https://bcrypt-generator.com

```sql
INSERT INTO usuarios (email, password, rol, activo, id_doctor)
VALUES (
  'admin@clinica1.com',
  '$2a$10$HASH_GENERADO_AQUI',
  'ADMIN',
  true,
  null
);
```

---

## PARTE 3 — Deploy Vercel (frontend)

### 3.1 Configuración en Vercel

1. [vercel.com](https://vercel.com) → **New Project** → importar repo
2. **Root Directory**: `next-dent-client`
3. **Framework Preset**: Vite (se detecta automáticamente)
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist`

### 3.2 Variables de entorno en Vercel

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://TU-BACKEND.railway.app/api` |

> ⚠️ Vite embebe las variables en el build. Cambiar `VITE_API_URL` requiere re-deploy.

### 3.3 Actualizar CORS en Railway

Una vez que Vercel asigne el dominio, volver a Railway y actualizar:
```
CORS_ALLOWED_ORIGINS=https://next-dent-clinica1.vercel.app
```

Luego redeploy del backend (o Railway lo hace automático al guardar variables).

---

## PARTE 4 — Segunda clínica (piloto con 2 clínicas)

Repetir Partes 2 y 3 con un nuevo proyecto Railway y nuevo proyecto Vercel.

**Solo cambia:**
- `JWT_SECRET` → generar uno nuevo e independiente
- `CORS_ALLOWED_ORIGINS` → dominio Vercel de la clínica 2
- `VITE_API_URL` → URL del backend Railway de la clínica 2
- Email del usuario ADMIN inicial

**El código del repo es idéntico para ambas clínicas.**

---

## PARTE 5 — Checklist post-deploy

### Backend (verificar con Postman o curl)
- [ ] `GET /api/tarifario` → responde `401` (no `404` ni `500`)
- [ ] `POST /api/auth/login` con credenciales admin → retorna JWT válido
- [ ] Logs de Railway sin errores de conexión a BD
- [ ] HTTPS activo en la URL de Railway

### Frontend
- [ ] App carga sin errores CORS en consola del navegador
- [ ] Login funciona y redirige al dashboard
- [ ] Citas, pacientes y pagos cargan datos reales
- [ ] Logout limpia localStorage y redirige a `/login`
- [ ] HTTPS activo en la URL de Vercel

### Seguridad
- [ ] `JWT_SECRET` no está hardcodeado en el código fuente
- [ ] `.env` está en `.gitignore` (verificar que no se subió al repo)
- [ ] BD de producción sin datos de prueba
- [ ] Password del admin: mínimo 12 caracteres

---

## Costos estimados

| Servicio | Plan | Costo/mes por clínica |
|---|---|---|
| Vercel | Hobby (gratuito) | $0 |
| Railway PostgreSQL | Starter | ~$0–5 (según uso) |
| Railway Backend | Starter | ~$5 |
| **Total** | | **~$5/clínica** |

Para 2 clínicas piloto: ~$10/mes total.

---

## Próximo prompt sugerido

Una vez confirmado el deploy exitoso de ambas clínicas:
- `14_dominio_personalizado.md` — configurar dominio propio (ej: `app.clinica1.com`) en Vercel
- `15_multi_clinica_unificado.md` — migrar a BD compartida con `clinica_id` si el piloto resulta exitoso
