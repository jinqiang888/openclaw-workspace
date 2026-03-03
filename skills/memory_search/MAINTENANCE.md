# 记忆系统维护指南

## 📁 文件结构

```
/home/admin/.openclaw/workspace/
├── MEMORY.md                    # 长期记忆 ( curated )
├── memory/
│   ├── YYYY-MM-DD.md            # 每日记忆 ( raw logs )
│   └── evomap_log.md            # EvoMap 进化日志
└── skills/memory_search/        # 记忆搜索工具
```

## 🔄 记忆流转

```
每日记忆 (memory/YYYY-MM-DD.md)
    ↓ (定期回顾，提取重要事件)
长期记忆 (MEMORY.md)
```

## ✅ 自动维护任务

### 每日 (心跳时检查)
- 确保 `memory/YYYY-MM-DD.md` 存在
- 追加重要事件到当日记忆
- 检查记忆文件大小

### 每周 (手动或 Cron)
- 回顾过去 7 天的 `memory/*.md`
- 提取重要事件合并到 `MEMORY.md`
- 清理过期的临时记录

### 每月
- 归档旧的每日记忆
- 更新 `MEMORY.md` 中的过期信息
- 检查 EvoMap 积分和声誉变化

## 🔒 安全规则

| 会话类型 | MEMORY.md | memory/*.md |
|----------|-----------|-------------|
| 主会话 (1 对 1) | ✅ 完全访问 | ✅ 完全访问 |
| 子会话 (isolated) | ❌ 不访问 | ⚠️ 仅当日 |
| 群聊/公开 | ❌ 不访问 | ❌ 不访问 |

**原则**: 个人记忆不泄露到群聊或公开场合

## 🛠️ 使用示例

### 记录事件
```javascript
const ms = require('./skills/memory_search');

// 追加到今日记忆
await ms.appendToToday(`
## 重要事件
- 完成了 EvoMap 集成
- 积分：500
`);
```

### 搜索历史
```javascript
// 查找之前的配置
const r = await ms.search("EvoMap 节点");
console.log(r.results[0].content);
```

### 获取最近记忆
```javascript
// 获取最近 7 天
const recent = await ms.getRecent(7);
recent.forEach(day => {
  console.log(`${day.date}: ${day.content.substring(0, 50)}...`);
});
```

## ⚠️ 注意事项

1. **不要** 在群聊中读取 `MEMORY.md`
2. **不要** 删除记忆文件 (用 `trash` 而非 `rm`)
3. **定期** 合并重要事件到 `MEMORY.md`
4. **避免** 在每日记忆中记录敏感信息

## 📈 性能优化

- 单个记忆文件 < 100KB
- `MEMORY.md` 定期精简
- 搜索时使用日期范围过滤
- 大文件考虑拆分
