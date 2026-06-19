# Next Dent — Prompt #15: Backup automático PostgreSQL → Google Drive

## Contexto
Configurar backup nocturno automático de la BD de producción en Railway.
El script hace `pg_dump` y sube el archivo `.sql` a Google Drive usando la API de Google.

- **Clinica1-Lima** → folder ID: `1V5ilmC3KtKSeY577NLFKWUKZqE1r5iTh`
- **Clinica2-Pucallpa** → folder ID: `1lPOptZXaBgZd1VQ3RejUX3zNpL1ssFwG`

Este prompt configura el backup para **Clinica1-Lima** (repetir para Clinica2 cambiando el folder ID y las variables de BD).

---

## PARTE 1 — Crear el script de backup

### 1.1 Crear carpeta y archivo del script

Crear la siguiente estructura en el repo:

```
backup/
  backup.py
  requirements.txt
  Dockerfile
```

### 1.2 `backup/requirements.txt`

```
google-api-python-client==2.108.0
google-auth==2.23.4
psycopg2-binary==2.9.9
```

### 1.3 `backup/backup.py`

```python
import os
import subprocess
import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2 import service_account
import json
import tempfile

FOLDER_ID = os.environ['GDRIVE_FOLDER_ID']
DATABASE_URL = os.environ['DATABASE_URL']
CREDENTIALS_JSON = os.environ['GOOGLE_CREDENTIALS_JSON']

def get_drive_service():
    creds_dict = json.loads(CREDENTIALS_JSON)
    creds = service_account.Credentials.from_service_account_info(
        creds_dict,
        scopes=['https://www.googleapis.com/auth/drive.file']
    )
    return build('drive', 'v3', credentials=creds)

def run_backup():
    fecha = datetime.datetime.now().strftime('%Y-%m-%d_%H-%M')
    filename = f'backup_{fecha}.sql'
    
    with tempfile.TemporaryDirectory() as tmpdir:
        filepath = os.path.join(tmpdir, filename)
        
        print(f'Ejecutando pg_dump → {filename}')
        result = subprocess.run(
            ['pg_dump', '--no-password', '-f', filepath, DATABASE_URL],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f'ERROR en pg_dump: {result.stderr}')
            raise Exception(f'pg_dump falló: {result.stderr}')
        
        file_size = os.path.getsize(filepath)
        print(f'Backup generado: {file_size} bytes')
        
        service = get_drive_service()
        file_metadata = {
            'name': filename,
            'parents': [FOLDER_ID]
        }
        media = MediaFileUpload(filepath, mimetype='application/sql', resumable=True)
        
        print(f'Subiendo a Google Drive (folder: {FOLDER_ID})...')
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id,name,size'
        ).execute()
        
        print(f'✅ Backup subido: {file["name"]} (ID: {file["id"]})')
        
        limpiar_backups_antiguos(service)

def limpiar_backups_antiguos(service):
    """Elimina backups con más de 30 días para no llenar el Drive"""
    limite = datetime.datetime.now() - datetime.timedelta(days=30)
    limite_str = limite.strftime('%Y-%m-%dT%H:%M:%S')
    
    results = service.files().list(
        q=f"'{FOLDER_ID}' in parents and createdTime < '{limite_str}'",
        fields='files(id, name, createdTime)'
    ).execute()
    
    archivos_viejos = results.get('files', [])
    for archivo in archivos_viejos:
        service.files().delete(fileId=archivo['id']).execute()
        print(f'🗑 Eliminado backup antiguo: {archivo["name"]}')
    
    if archivos_viejos:
        print(f'Limpieza: {len(archivos_viejos)} backup(s) eliminado(s)')

if __name__ == '__main__':
    run_backup()
```

### 1.4 `backup/Dockerfile`

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backup.py .

CMD ["python", "backup.py"]
```

---

## PARTE 2 — Configurar en Railway (manual)

### 2.1 Crear nuevo servicio en Railway

En el mismo proyecto Railway donde está el backend de Clinica1:

1. **+ New** → **Empty Service**
2. Nombre: `backup-clinica1-lima`
3. En **Settings** → **Deploy** → cambiar de "Always On" a **"Cron Job"**
4. Cron expression: `0 3 * * *` (ejecuta cada día a las 3am UTC = 10pm hora Perú)
5. En **Settings → Root Directory**: `backup`

### 2.2 Variables de entorno del servicio backup

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (misma referencia que el backend) |
| `GDRIVE_FOLDER_ID` | `1V5ilmC3KtKSeY577NLFKWUKZqE1r5iTh` |
| `GOOGLE_CREDENTIALS_JSON` | contenido completo del archivo `.json` descargado de Google Cloud |

> ⚠️ Para `GOOGLE_CREDENTIALS_JSON`: abrir el archivo `.json` descargado, copiar TODO el contenido y pegarlo como valor de la variable. Es un JSON largo — pegarlo completo en una sola línea.

### 2.3 Conectar repo y deployar

1. En el servicio backup → **Deploy** → **GitHub Repo** → seleccionar `Next-Dent-Proyecto`
2. Railway detecta el `Dockerfile` en la carpeta `backup/` y lo usa para construir
3. El primer deploy corre inmediatamente para verificar que funciona
4. Luego corre automáticamente cada noche a las 3am UTC

---

## PARTE 3 — Verificar que funciona

Después del primer deploy, verificar en los logs del servicio backup:

```
Ejecutando pg_dump → backup_2026-06-18_03-00.sql
Backup generado: XXXXX bytes
Subiendo a Google Drive (folder: 1V5ilmC3KtKSeY577NLFKWUKZqE1r5iTh)...
✅ Backup subido: backup_2026-06-18_03-00.sql (ID: ...)
```

Y verificar en Google Drive → `NextDent-Backups/Clinica1-Lima/` que aparece el archivo `.sql`.

---

## PARTE 4 — Repetir para Clinica2-Pucallpa

Cuando se configure el deploy de la segunda clínica, crear otro servicio backup con:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` del proyecto Railway de Clinica2 |
| `GDRIVE_FOLDER_ID` | `1lPOptZXaBgZd1VQ3RejUX3zNpL1ssFwG` |
| `GOOGLE_CREDENTIALS_JSON` | mismo JSON de credenciales |

---

## Resultado final

Cada noche a las 3am UTC (10pm hora Perú):
- Se genera un `pg_dump` completo de la BD
- Se sube a `NextDent-Backups/Clinica1-Lima/backup_FECHA.sql`
- Los backups con más de 30 días se eliminan automáticamente
- Si algo falla, Railway registra el error en los logs del servicio

Para restaurar un backup:
```bash
psql $DATABASE_URL < backup_2026-06-18_03-00.sql
```
