import os
import subprocess
import datetime
from google.cloud import storage
from google.oauth2 import service_account
import json
import tempfile

BUCKET_NAME = os.environ['GCS_BUCKET_NAME']
DATABASE_URL = os.environ['DATABASE_URL']
CREDENTIALS_JSON = os.environ['GOOGLE_CREDENTIALS_JSON']

def get_storage_client():
    creds_dict = json.loads(CREDENTIALS_JSON)
    creds = service_account.Credentials.from_service_account_info(
        creds_dict,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    return storage.Client(credentials=creds, project=creds_dict['project_id'])

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

        client = get_storage_client()
        bucket = client.bucket(BUCKET_NAME)
        blob = bucket.blob(filename)

        print(f'Subiendo a Cloud Storage (bucket: {BUCKET_NAME})...')
        blob.upload_from_filename(filepath)
        print(f'✅ Backup subido: {filename}')

        limpiar_backups_antiguos(bucket)

def limpiar_backups_antiguos(bucket):
    limite = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
    blobs = list(bucket.list_blobs())
    eliminados = 0
    for blob in blobs:
        if blob.time_created < limite:
            blob.delete()
            print(f'🗑 Eliminado: {blob.name}')
            eliminados += 1
    if eliminados:
        print(f'Limpieza: {eliminados} backup(s) eliminado(s)')

if __name__ == '__main__':
    run_backup()