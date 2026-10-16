@echo off
rem Обновляет проект (git pull + npm install при необходимости) и запускает приложение.
chcp 65001 >nul
cd /d "%~dp0"
set NEED_INSTALL=

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto install
for /f %%i in ('git rev-parse HEAD') do set BEFORE=%%i
echo Обновляю проект...
git pull --ff-only
if errorlevel 1 (
    echo Не удалось обновить ^(нет сети или есть локальные изменения^). Запускаю текущую версию.
    goto install
)
for /f %%i in ('git rev-parse HEAD') do set AFTER=%%i
if "%BEFORE%"=="%AFTER%" goto install
git diff --name-only %BEFORE% %AFTER% | findstr /r /c:"^package.json$" /c:"^package-lock.json$" >nul
if not errorlevel 1 set NEED_INSTALL=1

:install
if not exist node_modules set NEED_INSTALL=1
if defined NEED_INSTALL (
    echo Устанавливаю зависимости...
    call npm install
    if errorlevel 1 exit /b 1
)

echo Запускаю Cheating Daddy...
call npm start
