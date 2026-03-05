# Nanobot: OpenClaw 维修师

## 描述
专为 OpenClaw 系统设计的自动化维护机器人，提供健康检查、故障诊断、自动修复和预防维护功能。

## 安装
```bash
# 项目已创建在 ~/.openclaw/workspace/nanobot/
cd ~/.openclaw/workspace/nanobot/
```

## 使用
### 主动模式（自动）
- 每 30 分钟自动执行健康检查
- 通过 cron job `aaddbb4a-ca04-4b82-987b-5199dcd508d9` 触发

### 被动模式（手动）
- 在飞书中发送 "@维修师" 或 "nanobot"
- 将触发完整的手动诊断和修复流程

## 集成
- **飞书通道**: 已配置到当前用户 `user:ou_295ca...`
- **技能依赖**: healthcheck, agent-introspection, http-retry, memory-bridge
- **日志位置**: `/tmp/nanobot.log`

## 配置
如需修改检查频率或目标，请编辑 cron job:
```bash
openclaw cron edit --id aaddbb4a-ca04-4b82-987b-5199dcd508d9
```