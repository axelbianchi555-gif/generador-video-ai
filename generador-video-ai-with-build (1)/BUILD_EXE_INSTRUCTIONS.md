
## Cómo obtener un .exe (construido remotamente) — opción recomendada (GitHub Actions)

1. Crea un repositorio en GitHub y sube todo el contenido de este paquete (o crea un repo nuevo y sube mediante push).
2. Asegúrate de que tienes una rama `main` y sube los archivos. El workflow en `.github/workflows/build-windows.yml` se activará.
3. En la pestaña *Actions* de GitHub, ejecuta el workflow `Build Windows EXE` (puedes dispararlo manualmente con *Run workflow*).
4. Al finalizar, en la ejecución del workflow verás un artefacto llamado `generador-video-ai-windows` con el ZIP `generador-video-ai-windows.zip` que contiene los archivos listos para Windows, incluyendo `worker_exe.exe` generado por PyInstaller.
5. Descarga y extrae el ZIP en tu PC con Windows (o mueve su contenido a la carpeta donde quieras) y ejecuta `backend\\index.js` con Node.js y `worker\\worker_exe.exe` (o usa el frontend que se incluye).

## Cómo construir localmente en Windows (si prefieres no usar GitHub)

1. En Windows instala Python 3.11+ y Node.js 18+.
2. Abre PowerShell en la carpeta del proyecto.
3. Ejecuta `build_windows.bat`. Eso instalará dependencias y compilará el worker con PyInstaller a `worker\\dist\\worker_exe.exe`.
4. Luego instala dependencias de backend: `cd backend && npm install`.
5. Ejecuta backend: `node index.js` y worker: `worker\\dist\\worker_exe.exe` o ejecuta `scripts\\run-local-backend.sh` y `scripts\\run-local-worker.sh` desde WSL/Windows.
