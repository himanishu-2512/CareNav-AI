@echo off
REM Generate AWS Architecture Diagram from Graphviz DOT file

echo Generating CareNav AI Architecture Diagram...

REM Check if Graphviz is installed
where dot >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Graphviz is not installed or not in PATH
    echo.
    echo Please install Graphviz from: https://graphviz.org/download/
    echo After installation, add Graphviz bin directory to your PATH
    echo Example: C:\Program Files\Graphviz\bin
    echo.
    pause
    exit /b 1
)

REM Generate PNG image
echo Generating PNG image...
dot -Tpng architecture.dot -o architecture.png

if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Diagram generated as architecture.png
    echo Opening diagram...
    start architecture.png
) else (
    echo ERROR: Failed to generate diagram
    pause
    exit /b 1
)

echo.
echo You can also generate other formats:
echo   SVG:  dot -Tsvg architecture.dot -o architecture.svg
echo   PDF:  dot -Tpdf architecture.dot -o architecture.pdf
echo.
pause
