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

        print(f'Backup subido: {file["name"]} (ID: {file["id"]})')

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
        print(f'Eliminado backup antiguo: {archivo["name"]}')

    if archivos_viejos:
        print(f'Limpieza: {len(archivos_viejos)} backup(s) eliminado(s)')

if __name__ == '__main__':
    run_backup()
