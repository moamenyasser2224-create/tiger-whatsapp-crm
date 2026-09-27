@echo off
chcp 65001 > nul
title تشغيل نظام تايجر CRM
echo ========================================================
echo        🚀 جاري تشغيل خوادم نظام تايجر CRM
echo ========================================================
echo.
cd /d "%~dp0"
set PATH=C:\Program Files\nodejs;C:\Users\Hp\AppData\Local\Programs\Git\cmd;%PATH%

echo 1. جاري بدء تشغيل خادم الباك إند (Port 5000)...
start "Tiger Backend Server" cmd /k "cd /d "%~dp0server" && node dist/server.js"

echo 2. جاري بدء تشغيل واجهة الفرونت إند (Port 5173)...
start "Tiger Frontend Web" cmd /k "cd /d "%~dp0client" && npm run preview -- --port 5173 --host 0.0.0.0"

timeout /t 3 > nul
echo.
echo ========================================================
echo  ✅ تم تشغيل الخوادم بنجاح!
echo  🌐 رابط النظام: http://localhost:5173
echo  👤 البريد: admin@example.com
echo  🔑 كلمة المرور: Admin@123456
echo ========================================================
start http://localhost:5173/login
pause
