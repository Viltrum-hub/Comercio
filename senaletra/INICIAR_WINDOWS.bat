@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
 py -3 servidor.py
 goto fin
)
where python >nul 2>nul
if %errorlevel% equ 0 (
 python servidor.py
 goto fin
)
echo Necesitas Python 3 o XAMPP. Abre LEEME.html para ver las instrucciones.
start "" "LEEME.html"
:fin
pause
