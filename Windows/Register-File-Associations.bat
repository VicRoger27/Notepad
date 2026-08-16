@echo off
title Cross Notepad - Register File Associations
echo =========================================================
echo   Cross Notepad - Registering File Associations
echo =========================================================
echo.
py "%~dp0..\app\scripts\register_file_associations.py"
if %errorlevel% neq 0 (
    python "%~dp0..\app\scripts\register_file_associations.py"
)
echo.
echo Done! All text files (.txt, .md, .log, .json, code files)
echo and Explorer right-click menus are registered to Cross Notepad.
echo.
pause
