# ============================================================
#  IntiFix - Levantar TODO con un clic (BD en la nube)
#  Backend :8080 | admin-django :8000 | intifix-web :5173 | admin-web :5174
# ============================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host " [1/4] Backend Spring Boot  :8080  (nube: Aiven Postgres + Mongo Atlas + Redis Upstash)"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\intifix-2026'; .\mvnw.cmd spring-boot:run" -WindowStyle Normal

Write-Host " [2/4] Admin Django         :8000  (panel admin backend)"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\admin-django'; venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000 --settings=intifix_admin.settings.development" -WindowStyle Normal

Write-Host " [3/4] intifix-web          :5173"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\intifix-web'; npm run dev" -WindowStyle Normal

Write-Host " [4/4] intifix-admin-web    :5174"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ROOT\intifix-admin-web'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host " Abriendo en ~60s (el backend tarda ~60-70s en arrancar contra la nube)..."
Write-Host ""
Write-Host " URLs:"
Write-Host "   http://localhost:5173   <-- app cliente/tecnico"
Write-Host "   http://localhost:5174   <-- panel admin (frontend)"
Write-Host "   http://localhost:8080   <-- API backend (Spring)"
Write-Host "   http://localhost:8000   <-- API admin backend (Django)"
Write-Host ""
Write-Host " Cierra las 4 ventanas de PowerShell para parar todo."
Read-Host " Presiona Enter para salir..."
