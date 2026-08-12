Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Empaquetando Explora Ocozocoautla (Portable V2)..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. PREVENCIÓN DE ERRORES Y LIMPIEZA
Write-Host "[1/7] Limpiando procesos en segundo plano..." -ForegroundColor Yellow
Stop-Process -Name "msedge" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Remove-Item -Recurse -Force ".next\standalone\.app-data" -ErrorAction SilentlyContinue

# 2. COMPILAR EL PROYECTO
Write-Host "[2/7] Compilando el proyecto en Next.js..." -ForegroundColor Yellow
npx next build

if (-Not (Test-Path ".next\standalone")) {
    Write-Host "❌ Error: La compilación falló. Revisa los errores de arriba." -ForegroundColor Red
    exit
}

# 3. EL TRUCO MAESTRO PARA BETTER-SQLITE3 (Engañando a Turbopack)
Write-Host "[3/7] Forzando binarios de better-sqlite3..." -ForegroundColor Yellow
# Limpia directorios previos
Remove-Item -Recurse -Force ".next\standalone\node_modules\better-sqlite3" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".next\standalone\.next\node_modules\better-sqlite3-90e2652d1716b047" -ErrorAction SilentlyContinue

# Copia a la ruta estándar
New-Item -ItemType Directory -Force -Path ".next\standalone\node_modules" | Out-Null
Copy-Item -Recurse -Force "node_modules\better-sqlite3" ".next\standalone\node_modules\better-sqlite3"

# Copia a la ruta encriptada que busca Turbopack
New-Item -ItemType Directory -Force -Path ".next\standalone\.next\node_modules" | Out-Null
Copy-Item -Recurse -Force "node_modules\better-sqlite3" ".next\standalone\.next\node_modules\better-sqlite3-90e2652d1716b047"

# 4. COPIAR ARCHIVOS ESTÁTICOS Y PÚBLICOS
Write-Host "[4/7] Integrando imágenes, estilos y logos..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".next\standalone\.next\static" | Out-Null
Copy-Item -Recurse -Force ".next\static\*" ".next\standalone\.next\static\"

New-Item -ItemType Directory -Force -Path ".next\standalone\public" | Out-Null
Copy-Item -Recurse -Force "public\*" ".next\standalone\public\"

# 5. COPIAR BASE DE DATOS Y MOTOR NODE.JS
Write-Host "[5/7] Preparando directory.db y Node.js portable..." -ForegroundColor Yellow
if (Test-Path "directory.db") {
    Copy-Item -Force "directory.db" ".next\standalone\directory.db"
}

if (Test-Path "node\node-v24.14.0-win-x64") {
    Copy-Item -Recurse -Force "node" ".next\standalone\node"
}

# 6. CREAR EL LANZADOR INTELIGENTE (Controlador de procesos)
Write-Host "[6/7] Creando el lanzador silencioso (launcher.js)..." -ForegroundColor Yellow
$launcherContent = @"
const { spawn } = require("child_process");
const path = require("path");

const server = spawn(process.execPath, ["server.js"], {
    stdio: "ignore",
    windowsHide: true,
    cwd: __dirname
});

setTimeout(() => {
    const edgeDataDir = path.join(__dirname, ".app-data");
    const args = [
        "/c", "start", "\"\"", "/wait", "msedge",
        "--app=http://localhost:3000",
        "--user-data-dir=" + edgeDataDir,
        "--no-first-run",
        "--no-default-browser-check"
    ];
    
    const browser = spawn("cmd.exe", args, { windowsHide: true, stdio: "ignore" });
    
    browser.on("close", () => {
        server.kill();
        process.exit();
    });
}, 1500);
"@
Set-Content -Path ".next\standalone\launcher.js" -Value $launcherContent
# 7. CREAR EL EJECUTABLE INVISIBLE
Write-Host "[7/7] Creando el ejecutable final (iniciar.vbs)..." -ForegroundColor Yellow
$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run "node\node-v24.14.0-win-x64\node.exe launcher.js", 0, False
"@
Set-Content -Path ".next\standalone\iniciar.vbs" -Value $vbsContent

# Limpiar archivos .bat obsoletos
Remove-Item -Force ".next\standalone\arrancar.bat" -ErrorAction SilentlyContinue
Remove-Item -Force ".next\standalone\iniciar.bat" -ErrorAction SilentlyContinue
Remove-Item -Force ".next\standalone\detener.bat" -ErrorAction SilentlyContinue

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🎉 ¡Listo para entregar al cliente! 🎉 " -ForegroundColor Green
Write-Host " Ejecuta 'iniciar.vbs' en la carpeta standalone." -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan