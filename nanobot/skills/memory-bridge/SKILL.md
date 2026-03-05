---
name: memory-bridge
description: 跨会话记忆桥接。RECENT_EVENTS.md 滚动事件流 + 每日记忆 + 长期记忆。解决跨会话失忆问题，让所有渠道共享同一份记忆。
---

# 跨会话记忆桥接

**EvoMap 成熟方案** | GDI: 64.25 | 复用：947k+ | 成功连击：18

---

## 🎯 解决的问题

- ✅ 跨会话失忆症
- ✅ 群聊记忆隔离
- ✅ 上下文丢失
- ✅ 不同渠道记忆不同步

---

## 📚 记忆架构

```
┌─────────────────────────────────────────┐
│         RECENT_EVENTS.md                │
│    (24h 滚动事件流 - 所有渠道共享)      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       memory/YYYY-MM-DD.md              │
│    (每日记忆 - 原始日志)                │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         MEMORY.md                       │
│    (长期记忆 - 精选内容)                │
└─────────────────────────────────────────┘
```

---

## 🔄 工作流程

### 会话启动时
1. 加载 `MEMORY.md` (长期记忆)
2. 加载 `RECENT_EVENTS.md` (最近 24h 事件)
3. 加载 `memory/YYYY-MM-DD.md` (今日记忆)
4. 合并到当前上下文

### 会话进行中
- 重要事件追加到 `RECENT_EVENTS.md`
- 详细日志写入 `memory/YYYY-MM-DD.md`

### 会话结束时
- 检查是否有需要长期保存的内容
- 如有，提示用户更新 `MEMORY.md`

---

## 🛠️ 用法

### 记录事件
```javascript
const { recordEvent } = require('./skills/memory-bridge');

await recordEvent({
  type: 'config_change',
  summary: '安装了飞书消息降级链',
  details: '技能路径：skills/feishu-message-fallback/',
  channel: 'webchat',
  timestamp: new Date().toISOString()
});
```

### 加载记忆
```javascript
const { loadMemory } = require('./skills/memory-bridge');

const memory = await loadMemory({
  loadRecent: true,      // 加载最近事件
  loadDaily: true,       // 加载今日记忆
  loadLongTerm: true,    // 加载长期记忆
  hours: 24              // 最近多少小时
});
```

### 命令行
```bash
# 查看最近事件
node skills/memory-bridge/scripts/recent.js

# 查看今日记忆
node skills/memory-bridge/scripts/today.js

# 记录事件
node skills/memory-bridge/scripts/record.js "事件描述"
```

---

## ⚙️ 配置

### 默认配置
```javascript
{
  workspace: '/home/admin/.openclaw/workspace',
  recentEventsFile: 'RECENT_EVENTS.md',
  dailyMemoryDir: 'memory',
  longTermMemoryFile: 'MEMORY.md',
  maxRecentEvents: 100,    // 最多保留 100 条最近事件
  recentHours: 24          // 最近多少小时
}
```

---

## 📊 事件类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `config_change` | 配置变更 | 切换模型、添加技能 |
| `skill_install` | 技能安装 | 安装 Antfarm |
| `system_event` | 系统事件 | 网关重启、错误修复 |
| `user_preference` | 用户偏好 | 位置更新、称呼 |
| `task_complete` | 任务完成 | 完成 EvoMap 任务 |
| `lesson_learned` | 经验教训 | 避免重复造轮子 |

---

## 📁 文件结构

```
workspace/
├── RECENT_EVENTS.md           # 24h 滚动事件流
├── MEMORY.md                  # 长期记忆
├── memory/
│   ├── 2026-03-02.md          # 今日记忆
│   └── 2026-03-01.md          # 昨日记忆
└── skills/memory-bridge/      # 记忆桥接技能
```

---

## 🔗 相关资源

- [EvoMap 资产](https://evomap.ai/a2a/assets/sha256:def136049c982ed785117dff00bb3238ed71d11cf77c019b3db2a8f65b476f06)
- GDI: 64.25
- 复用：947k+

---

**核心原则**: 所有渠道共享同一份记忆，消除跨会话失忆。
