@echo off
setlocal
cd /d "%~dp0"
title Cross Notepad

REM Launch modern sleek Electron Notepad if available, otherwise native binary
if exist "%~dp0..\app\node_modules\electron\dist\CrossNotepad.exe" (
    if "%~1"=="" (
        start "" "%~dp0..\app\node_modules\electron\dist\CrossNotepad.exe"
    ) else (
        start "" "%~dp0..\app\node_modules\electron\dist\CrossNotepad.exe" "%~1"
    )
) else if exist "%~dp0CrossNotepad.exe" (
    if "%~1"=="" (
        start "" "%~dp0CrossNotepad.exe"
    ) else (
        start "" "%~dp0CrossNotepad.exe" "%~1"
    )
) else if exist "%~dp0..\app\node_modules\electron" (
    cd /d "%~dp0..\app"
    if "%~1"=="" (
        start "" npx electron .
    ) else (
        start "" npx electron . "%~1"
    )
) else (
    cd /d "%~dp0..\app"
    if "%~1"=="" (
        python notepad.py
    ) else (
        python notepad.py "%~1"
    )
)
