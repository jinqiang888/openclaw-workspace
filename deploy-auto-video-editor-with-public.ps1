# Windows 一键部署脚本 - 视频自动剪辑应用（带公网访问）
# 作者: 小强 (Xiao Zhao)
# 日期: 2026-03-06

Write-Host "🚀 开始部署视频自动剪辑应用（支持公网访问）..." -ForegroundColor Green

# 检查必需的软件是否已安装
function Check-Prerequisites {
    Write-Host "🔍 检查系统环境..." -ForegroundColor Yellow
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js 已安装: $nodeVersion"
    } catch {
        Write-Host "❌ Node.js 未安装！请先安装 Node.js 20+ https://nodejs.org/" -ForegroundColor Red
        return $false
    }
    
    # 检查 Git
    try {
        $gitVersion = git --version
        Write-Host "✅ Git 已安装: $gitVersion"
    } catch {
        Write-Host "❌ Git 未安装！请先安装 Git https://git-scm.com/download/win" -ForegroundColor Red
        return $false
    }
    
    # 检查 FFmpeg
    try {
        $ffmpegVersion = ffmpeg -version
        Write-Host "✅ FFmpeg 已安装"
    } catch {
        Write-Host "❌ FFmpeg 未安装！请先安装 FFmpeg https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Red
        Write-Host "   安装后请将 ffmpeg/bin 目录添加到系统 PATH 环境变量" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# 创建项目目录
function Create-ProjectDirectory {
    $projectDir = "C:\auto-video-editor"
    if (!(Test-Path $projectDir)) {
        New-Item -ItemType Directory -Path $projectDir | Out-Null
        Write-Host "📁 创建项目目录: $projectDir" -ForegroundColor Cyan
    } else {
        Write-Host "📁 项目目录已存在: $projectDir" -ForegroundColor Cyan
    }
    Set-Location $projectDir
}

# 克隆并安装项目
function Clone-And-Install {
    Write-Host "📥 克隆项目代码..." -ForegroundColor Yellow
    
    if (!(Test-Path "auto-video-editor")) {
        git clone https://github.com/jinqiang888/auto-video-editor.git
        Write-Host "✅ 项目克隆完成" -ForegroundColor Green
    } else {
        Write-Host "🔄 项目已存在，更新代码..." -ForegroundColor Yellow
        Set-Location auto-video-editor
        git pull
        Set-Location ..
    }
    
    # 安装后端依赖
    Write-Host "📦 安装后端依赖..." -ForegroundColor Yellow
    Set-Location auto-video-editor\backend
    npm install
    
    # 安装前端依赖
    Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
    Set-Location ..\frontend
    npm install
    
    Set-Location ..
}

# 配置环境文件
function Configure-Environment {
    Write-Host "⚙️ 配置环境文件..." -ForegroundColor Yellow
    
    # 后端配置
    $backendEnv = @"
PORT=3001
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
MAX_FILE_SIZE=10737418240
WHISPER_MODEL=base
"@
    
    Set-Content -Path "backend\.env" -Value $backendEnv -Encoding UTF8
    
    # 前端配置
    $frontendEnv = @"
VITE_API_URL=http://localhost:3001
VITE_MAX_UPLOAD_SIZE=10737418240
"@
    
    Set-Content -Path "frontend\.env" -Value $frontendEnv -Encoding UTF8
    
    Write-Host "✅ 环境配置完成" -ForegroundColor Green
}

# 安装并配置内网穿透工具（cpolar）
function Setup-PublicAccess {
    Write-Host "🌐 设置公网访问..." -ForegroundColor Yellow
    
    # 下载 cpolar（Windows 版）
    $cpolarPath = "C:\auto-video-editor\cpolar.exe"
    if (!(Test-Path $cpolarPath)) {
        Write-Host "⬇️ 下载 cpolar 内网穿透工具..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri "https://static.cpolar.com/downloads/windows-amd64/cpolar-stable-windows-amd64.zip" -OutFile "cpolar.zip"
        Expand-Archive -Path "cpolar.zip" -DestinationPath "C:\auto-video-editor"
        Remove-Item "cpolar.zip"
        Write-Host "✅ cpolar 安装完成" -ForegroundColor Green
    } else {
        Write-Host "✅ cpolar 已安装" -ForegroundColor Green
    }
    
    # 注册 cpolar 账号（需要用户手动操作）
    Write-Host "`n🔑 需要注册 cpolar 账号获取 authtoken：" -ForegroundColor Cyan
    Write-Host "   1. 访问 https://dashboard.cpolar.com/get-token" -ForegroundColor White
    Write-Host "   2. 登录或注册账号" -ForegroundColor White
    Write-Host "   3. 复制你的 authtoken" -ForegroundColor White
    Write-Host "   4. 在下面输入 authtoken（输入时不会显示）" -ForegroundColor White
    
    $authtoken = Read-Host "请输入你的 cpolar authtoken"
    if ($authtoken -eq "") {
        Write-Host "❌ 未提供 authtoken，跳过公网访问设置" -ForegroundColor Red
        return
    }
    
    # 配置 cpolar
    & "C:\auto-video-editor\cpolar.exe" authtoken $authtoken
    Write-Host "✅ cpolar 配置完成" -ForegroundColor Green
    
    # 创建启动脚本
    $startScript = @"
@echo off
echo 启动视频自动剪辑应用...
cd C:\auto-video-editor\auto-video-editor\backend
start cmd /k "npm run dev"

timeout /t 5 /nobreak >nul

echo 启动前端服务...
cd C:\auto-video-editor\auto-video-editor\frontend  
start cmd /k "npm run dev"

timeout /t 10 /nobreak >nul

echo 启动公网访问...
cd C:\auto-video-editor
start cmd /k "cpolar http 3000"

echo.
echo 🌐 应用已启动！
echo 本地访问: http://localhost:3000
echo 公网访问: 请查看 cpolar 控制台输出的公网地址
echo.
pause
"@
    
    Set-Content -Path "C:\auto-video-editor\start-with-public.bat" -Value $startScript -Encoding UTF8
    Write-Host "✅ 公网访问启动脚本创建完成: C:\auto-video-editor\start-with-public.bat" -ForegroundColor Green
}

# 主执行流程
if (Check-Prerequisites) {
    Create-ProjectDirectory
    Clone-And-Install
    Configure-Environment
    Setup-PublicAccess
    
    Write-Host "`n🎉 部署完成！" -ForegroundColor Green
    Write-Host "📋 使用说明:" -ForegroundColor Yellow
    Write-Host "   1. 运行 C:\auto-video-editor\start-with-public.bat 启动应用" -ForegroundColor White
    Write-Host "   2. 本地访问: http://localhost:3000" -ForegroundColor White
    Write-Host "   3. 公网访问: 查看 cpolar 输出的随机域名（免费版每次重启会变）" -ForegroundColor White
    Write-Host "   4. 如需固定域名，请升级 cpolar 付费套餐" -ForegroundColor White
} else {
    Write-Host "`n❌ 部署失败：请先安装必需的软件" -ForegroundColor Red
    Write-Host "   参考上面的错误信息进行安装" -ForegroundColor Red
}

Pause