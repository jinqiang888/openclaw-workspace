# Windows 一键部署脚本 - 视频自动剪辑应用
# 作者: 小强 (Xiao Zhao)
# 日期: 2026-03-05

Write-Host "🚀 开始部署视频自动剪辑应用..." -ForegroundColor Green

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

# 启动服务
function Start-Services {
    Write-Host "🚀 启动服务..." -ForegroundColor Yellow
    
    # 启动后端（新窗口）
    Start-Process powershell -ArgumentList "-Command", "cd C:\auto-video-editor\auto-video-editor\backend; npm run dev"
    Write-Host "✅ 后端服务启动中 (端口 3001)" -ForegroundColor Green
    
    # 启动前端（新窗口）
    Start-Process powershell -ArgumentList "-Command", "cd C:\auto-video-editor\auto-video-editor\frontend; npm run dev"
    Write-Host "✅ 前端服务启动中 (端口 3000)" -ForegroundColor Green
    
    Write-Host "`n🌐 应用访问地址: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "💡 请等待几秒钟让服务完全启动" -ForegroundColor Yellow
}

# 主执行流程
if (Check-Prerequisites) {
    Create-ProjectDirectory
    Clone-And-Install
    Configure-Environment
    Start-Services
    
    Write-Host "`n🎉 部署完成！" -ForegroundColor Green
    Write-Host "📋 使用说明:" -ForegroundColor Yellow
    Write-Host "   1. 打开浏览器访问 http://localhost:3000" -ForegroundColor White
    Write-Host "   2. 上传视频文件进行自动剪辑" -ForegroundColor White
    Write-Host "   3. 支持4K 60帧导出、AI字幕、背景音乐等完整功能" -ForegroundColor White
} else {
    Write-Host "`n❌ 部署失败：请先安装必需的软件" -ForegroundColor Red
    Write-Host "   参考上面的错误信息进行安装" -ForegroundColor Red
}

Pause