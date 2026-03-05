#!/bin/bash
# 阿里云轻量服务器一键部署脚本 - 视频自动剪辑应用
# 作者: 小强 (Xiao Zhao)
# 日期: 2026-03-06

echo "🚀 开始在阿里云服务器部署视频自动剪辑应用..."

# 检查磁盘空间
check_disk_space() {
    AVAILABLE_SPACE=$(df / --output=avail | tail -1)
    if [ $AVAILABLE_SPACE -lt 2097152 ]; then  # 小于2GB
        echo "❌ 磁盘空间不足！当前可用: $(df -h / | tail -1 | awk '{print $4}')"
        echo "   视频处理需要至少 5GB 可用空间"
        echo "   建议：1. 清理无用文件  2. 扩容云盘  3. 使用OSS存储"
        exit 1
    fi
    echo "✅ 磁盘空间检查通过: $(df -h / | tail -1 | awk '{print $4}') 可用"
}

# 安装必需软件
install_prerequisites() {
    echo "🔍 安装必需软件..."
    
    # 更新系统
    sudo yum update -y
    
    # 安装 Node.js 20
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo yum install -y nodejs
    
    # 安装 FFmpeg
    sudo yum install -y ffmpeg
    
    # 安装 Git
    sudo yum install -y git
    
    # 安装 PM2 (进程管理)
    sudo npm install -g pm2
    
    echo "✅ 必需软件安装完成"
}

# 创建项目目录
create_project_directory() {
    PROJECT_DIR="/opt/auto-video-editor"
    if [ ! -d "$PROJECT_DIR" ]; then
        sudo mkdir -p "$PROJECT_DIR"
        sudo chown $USER:$USER "$PROJECT_DIR"
    fi
    cd "$PROJECT_DIR"
    echo "📁 项目目录: $PROJECT_DIR"
}

# 克隆并安装项目
clone_and_install() {
    echo "📥 克隆项目代码..."
    
    if [ ! -d "auto-video-editor" ]; then
        git clone https://github.com/jinqiang888/auto-video-editor.git
    else
        cd auto-video-editor
        git pull
        cd ..
    fi
    
    # 安装后端依赖
    echo "📦 安装后端依赖..."
    cd auto-video-editor/backend
    npm install --production
    
    # 安装前端依赖
    echo "📦 安装前端依赖..."
    cd ../frontend
    npm install --production
    
    cd ../..
}

# 配置环境文件
configure_environment() {
    echo "⚙️ 配置环境文件..."
    
    # 后端配置
    cat > auto-video-editor/backend/.env << EOF
PORT=3001
UPLOAD_DIR=./uploads
OUTPUT_DIR=./outputs
MAX_FILE_SIZE=10737418240
WHISPER_MODEL=base
EOF
    
    # 前端配置
    cat > auto-video-editor/frontend/.env << EOF
VITE_API_URL=http://localhost:3001
VITE_MAX_UPLOAD_SIZE=10737418240
EOF
    
    echo "✅ 环境配置完成"
}

# 配置PM2进程管理
setup_pm2() {
    echo "🔧 配置PM2进程管理..."
    
    # 后端PM2配置
    cat > auto-video-editor/backend/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'video-editor-backend',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF
    
    # 前端PM2配置  
    cat > auto-video-editor/frontend/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'video-editor-frontend',
    script: 'node_modules/vite/bin/vite.js',
    args: 'preview --port 3000 --host 0.0.0.0',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF
    
    # 启动服务
    cd auto-video-editor/backend
    pm2 start ecosystem.config.js
    
    cd ../frontend
    pm2 start ecosystem.config.js
    
    # 保存PM2配置
    pm2 save
    
    echo "✅ PM2服务启动完成"
}

# 配置防火墙
configure_firewall() {
    echo "🛡️ 配置防火墙..."
    
    # 开放端口 3000 和 3001
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --permanent --add-port=3001/tcp
    sudo firewall-cmd --reload
    
    echo "✅ 防火墙配置完成"
}

# 主执行流程
main() {
    check_disk_space
    install_prerequisites
    create_project_directory
    clone_and_install
    configure_environment
    setup_pm2
    configure_firewall
    
    echo ""
    echo "🎉 部署完成！"
    echo "📋 应用信息："
    echo "   🌐 访问地址: http://$(curl -s ifconfig.me):3000"
    echo "   📁 项目目录: /opt/auto-video-editor"
    echo "   🔧 管理命令:"
    echo "      查看服务状态: pm2 status"
    echo "      查看日志: pm2 logs video-editor-backend"
    echo "      重启服务: pm2 restart video-editor-backend"
    echo ""
    echo "💡 注意事项："
    echo "   1. 当前服务器公网IP: $(curl -s ifconfig.me)"
    echo "   2. 建议绑定域名并配置HTTPS"
    echo "   3. 监控磁盘使用情况，避免空间不足"
}

# 执行主函数
main