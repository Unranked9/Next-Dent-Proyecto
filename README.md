# 🦷 Next Dent — Sistema de Gestión Odontológica

> Sistema web integral para la administración clínica y financiera de centros odontológicos particulares. Desarrollado con arquitectura REST multicapa y desplegado en la nube.

![TypeScript](https://img.shields.io/badge/TypeScript-71.8%25-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Java](https://img.shields.io/badge/Java-27.3%25-ED8B00?style=flat-square&logo=openjdk&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3-6DB33F?style=flat-square&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-deployed-000000?style=flat-square&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-deployed-0B0D0E?style=flat-square&logo=railway&logoColor=white)

---

## 📋 Descripción

**Next Dent** centraliza en una sola plataforma web todos los procesos del centro odontológico:

- 🗂 Gestión de pacientes con historia clínica digital
- 🦷 Odontograma interactivo con notación **FDI** internacional
- 📅 Calendario semanal de citas por doctor
- 💰 Módulo de caja con cobros vinculados a presupuestos de tratamiento
- 📊 Reportes de ingresos por período con gráfico SVG
- 👥 Gestión de usuarios con roles diferenciados (ADMIN / DOCTOR / RECEPCIONISTA)
- 🔒 Autenticación JWT con Spring Security y BCrypt
- ☁️ Respaldos automáticos nocturnos en Google Cloud Storage

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                CAPA DE PRESENTACIÓN                     │
│         React + TypeScript + Tailwind CSS v4            │
│              Vite · Desplegado en Vercel                │
└────────────────────────┬────────────────────────────────┘
                         │ REST API / JWT Bearer
┌────────────────────────▼────────────────────────────────┐
│                CAPA DE LÓGICA DE NEGOCIO                │
│        Spring Boot 3 · Java 17 · Spring Security        │
│              Desplegado en Railway                      │
└────────────────────────┬────────────────────────────────┘
                         │ Spring Data JPA / Hibernate
┌────────────────────────▼────────────────────────────────┐
│                   CAPA DE DATOS                         │
│          PostgreSQL 15 · Railway                        │
│    Backups nocturnos → Google Cloud Storage             │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠 Stack Tecnológico

### Frontend — `next-dent-client/`
| Tecnología | Versión | Uso |
|---|---|---|
| React | 18 | UI con componentes funcionales y hooks |
| TypeScript | 5 | Tipado estático en todo el frontend |
| Tailwind CSS | 4 | Design system — sin librerías de componentes externas |
| Vite | 5 | Bundler y servidor de desarrollo |
| Axios | — | HTTP client con interceptor 401 → logout automático |
| React Context | — | Estado global de autenticación con persistencia en localStorage |

### Backend — `next-dent-api/next-dent-api/`
| Tecnología | Versión | Uso |
|---|---|---|
| Spring Boot | 3 | Framework principal — API REST stateless |
| Java | 17 | Lenguaje del backend |
| Spring Security | 6 | Autenticación JWT + autorización por roles |
| Spring Data JPA | — | ORM con Hibernate |
| PostgreSQL | 15 | Base de datos relacional (11 tablas) |
| BCrypt | — | Hash de contraseñas |

### Infraestructura
| Servicio | Uso |
|---|---|
| Vercel | Hosting del frontend con CDN global |
| Railway | Hosting del backend + base de datos PostgreSQL |
| Google Cloud Storage | Almacenamiento de respaldos automáticos (`pg_dump` nightly) |

---

## 🗄 Modelo de Base de Datos

11 tablas relacionales:

```
USUARIOS ──────────────► DOCTORES
    │
PACIENTES ─────────────► CITAS ◄─── DOCTORES
    │
CICLOS_CLINICOS ───────► ODONTOGRAMA
    │
PRESUPUESTOS ──────────► PRESUPUESTO_DETALLES ◄─── TARIFARIO
                                  │
PAGOS ─────────────────► PAGO_DETALLES ──────────► PRESUPUESTO_DETALLES
```

---

## 🔐 Seguridad

- Autenticación stateless mediante **JWT** (JSON Web Tokens)
- Contraseñas cifradas con **BCrypt** (factor de costo 10)
- Roles sin prefijo `ROLE_` — Spring Security configurado con `.hasAuthority()`
- Interceptor de Axios en el frontend: error 401 → logout y redirección automática a `/login`
- Variables de entorno para todas las credenciales (nunca hardcodeadas en el código)

---

## 📁 Estructura del Proyecto

```
Next-Dent-Proyecto/
├── next-dent-client/          # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/        # Componentes reutilizables (Sidebar, Topbar, Odontograma...)
│   │   ├── pages/             # Páginas por módulo (Dashboard, Pacientes, Citas...)
│   │   ├── hooks/             # Custom hooks (useKpis, usePorCobrar, useNotificaciones...)
│   │   ├── services/          # Servicios HTTP por entidad
│   │   ├── context/           # AuthContext con persistencia JWT
│   │   ├── config/            # axiosInstance + API_BASE_URL
│   │   └── types/             # Tipos TypeScript compartidos
│   └── .env.example           # Variables de entorno requeridas
│
└── next-dent-api/             # Backend Spring Boot
    └── next-dent-api/
        └── src/main/java/com/clinica/next_dent_api/
            ├── controller/    # Controllers REST (+25 endpoints)
            ├── service/       # Lógica de negocio
            ├── repository/    # Spring Data JPA repositories
            ├── model/         # Entidades JPA
            ├── dto/           # Data Transfer Objects
            └── security/      # JWT filter + Spring Security config
```

---

## ⚙️ Variables de entorno requeridas

### Frontend (`next-dent-client/.env`)
```env
VITE_API_URL=https://tu-backend.railway.app/api
```

### Backend (Railway environment variables)
```env
PGHOST=
PGPORT=
PGDATABASE=
PGUSER=
PGPASSWORD=
JWT_SECRET=
JWT_EXPIRATION_MS=
```

> ⚠️ **Nota:** El sistema no funciona sin las variables de entorno correctas. No se incluyen credenciales en el repositorio.

---

## 🚀 Despliegue

El sistema está en producción:

- **Frontend:** Vercel — deploya automáticamente desde la rama `main`
- **Backend:** Railway — contenedor Docker con Spring Boot
- **Base de datos:** PostgreSQL en Railway
- **Backups:** Cron job diario a las 00:00 (hora Perú) → Google Cloud Storage bucket `nextdent-backups-clinica1`

---

## 👥 Roles del sistema

| Rol | Acceso |
|---|---|
| `ADMIN` | Acceso total — incluyendo gestión de usuarios y reportes |
| `DOCTOR` | Historia clínica, odontograma, citas y dashboard |
| `RECEPCIONISTA` | Pacientes, citas, caja y dashboard |

---

## 📄 Licencia y Autoría

© 2026 **Alexis Eduardo Huayanca Ascencio** — Todos los derechos reservados.

Este repositorio contiene el código fuente del sistema **Next Dent**, desarrollado como proyecto académico para el curso **EFSRT II — Cibertec** y como producto comercial en desarrollo.

**No se autoriza** la copia, distribución, modificación o uso comercial del código sin autorización expresa del autor.

---

## 📚 Contexto Académico

Proyecto desarrollado para:
- **Institución:** Escuela de Educación Superior Cibertec
- **Curso:** Experiencias Formativas en Situaciones Reales de Trabajo II (EFSRT II)
- **Grupo:** N° 12
- **Docente:** Carlos Israel Accilio Cruz
- **Ciclo:** 2026

---

*Desarrollado con ❤️ en Pucallpa, Perú.*
