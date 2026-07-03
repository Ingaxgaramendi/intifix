@echo off
REM ============================================================
REM  IntiFix - Levantar TODO con un clic (BD en la nube)
REM  Backend :8080 | admin-django :8000 | intifix-web :5173 | admin-web :5174
REM ============================================================

set ROOT=%~dp0

echo.
echo  [1/4] Backend Spring Boot  :8080  (nube: Aiven Postgres + Mongo Atlas + Redis Upstash)
start "IntiFix Backend :8080" cmd /k "cd /d %ROOT%intifix-2026 && mvnw.cmd spring-boot:run"

echo  [2/4] Admin Django         :8000  (panel admin backend)
start "IntiFix Admin Django :8000" cmd /k "cd /d %ROOT%admin-django && venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000 --settings=intifix_admin.settings.development"

echo  [3/4] intifix-web          :5173
start "IntiFix Web :5173" cmd /k "cd /d %ROOT%intifix-web && npm run dev"

echo  [4/4] intifix-admin-web    :5174
start "IntiFix Admin :5174" cmd /k "cd /d %ROOT%intifix-admin-web && npm run dev"

echo.
echo  Abriendo en ~60s (el backend tarda ~60-70s en arrancar contra la nube)...
echo.
echo  URLs:
echo    http://localhost:5173   ^<-- app cliente/tecnico
echo    http://localhost:5174   ^<-- panel admin (frontend)
echo    http://localhost:8080   ^<-- API backend (Spring)
echo    http://localhost:8000   ^<-- API admin backend (Django)
echo.
echo  Cierra las 4 ventanas de cmd para parar todo.
pause
