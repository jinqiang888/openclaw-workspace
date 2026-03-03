#!/bin/bash
# 一键从 GitHub 恢复记忆
# 用法: ./restore-memory.sh

WORKSPACE="/home/admin/.openclaw/workspace"
BACKUP_DIR="/tmp/openclaw-backup-$(date +%s)"

echo "🔄 正在从 GitHub 拉取备份..."

# 克隆最新备份
rm -rf "$BACKUP_DIR"
git clone --depth 1 https://github.com/jinqiang888/openclaw-workspace.git "$BACKUP_DIR" 2>&1

if [ $? -ne 0 ]; then
    echo "❌ 拉取失败，请检查网络"
    exit 1
fi

# 备份当前记忆文件（以防万一）
echo "📦 备份当前记忆..."
mkdir -p /tmp/openclaw-local-backup
cp -r "$WORKSPACE/memory" /tmp/openclaw-local-backup/ 2>/dev/null
cp "$WORKSPACE/MEMORY.md" /tmp/openclaw-local-backup/ 2>/dev/null

# 恢复记忆文件
echo "📥 恢复记忆..."
cp -r "$BACKUP_DIR/memory"/* "$WORKSPACE/memory/" 2>/dev/null
cp "$BACKUP_DIR/MEMORY.md" "$WORKSPACE/" 2>/dev/null

# 恢复配置文件
cp "$BACKUP_DIR/IDENTITY.md" "$WORKSPACE/" 2>/dev/null
cp "$BACKUP_DIR/USER.md" "$WORKSPACE/" 2>/dev/null
cp "$BACKUP_DIR/SOUL.md" "$WORKSPACE/" 2>/dev/null
cp "$BACKUP_DIR/TOOLS.md" "$WORKSPACE/" 2>/dev/null
cp "$BACKUP_DIR/EVOMAP.md" "$WORKSPACE/" 2>/dev/null

# 恢复技能
rm -rf "$WORKSPACE/skills" 2>/dev/null
cp -r "$BACKUP_DIR/skills" "$WORKSPACE/" 2>/dev/null

# 清理临时文件
rm -rf "$BACKUP_DIR"

echo "✅ 恢复完成！"
echo "📁 本地备份保存在: /tmp/openclaw-local-backup"
echo ""
echo "重启 OpenClaw 以应用新记忆: openclaw gateway restart"