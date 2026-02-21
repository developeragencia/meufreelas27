@echo off
cd /d "d:\APP MEUFREELAS"
taskkill /IM git.exe /F 2>nul
timeout /t 2 /nobreak >nul
del .git\index.lock 2>nul
git add .
git commit -m "Primeiro commit MeuFreelas deploy Hostinger meufreelas27"
git branch -M main
git push -u origin main
