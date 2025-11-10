@echo off
echo ========================================
echo AutoStack - Complete Rebuild
echo ========================================
echo.

echo [1/4] Stopping containers...
docker compose down -v

echo.
echo [2/4] Cleaning Docker cache...
docker system prune -af --volumes

echo.
echo [3/4] Building and starting...
docker compose up --build -d

echo.
echo [4/4] Waiting for services...
timeout /t 30 /nobreak

echo.
echo ========================================
echo DONE! Opening browser...
echo ========================================
start http://localhost:3000

echo.
echo View logs with:
echo   docker compose logs -f backend
echo   docker compose logs -f frontend
