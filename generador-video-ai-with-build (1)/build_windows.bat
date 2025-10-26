
@echo off
REM Build worker exe locally using PyInstaller (requires Python 3.11 and pip installed)
pip install -r worker\requirements.txt
pip install pyinstaller==5.12
cd worker
pyinstaller --onefile --name worker_exe worker.py
if exist dist\worker_exe.exe (
  echo Worker exe built at worker\dist\worker_exe.exe
) else (
  echo Build failed
)
pause
