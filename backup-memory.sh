#!/bin/bash
# 一键备份记忆到 GitHub
# 用法: ./backup-memory.sh "备份说明"

cd /home/admin/.openclaw/workspace

# 检查是否有更改
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ 没有需要备份的更改"
    exit 0
fi

# 备份说明
MESSAGE="${1:-记忆备份 $(date '+%Y-%m-%d %H:%M')}"

# 添加所有更改
git add -A

# 提交
git commit -m "$MESSAGE"

# 推送
echo "🔄 正在推送到 GitHub..."
git push origin main --force 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 备份成功！"
    echo "📦 $MESSAGE"
else
    echo "❌ 备份失败，请检查网络或 GitHub 认证"
    exit 1
fi