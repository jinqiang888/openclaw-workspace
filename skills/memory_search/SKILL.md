---
name: memory_search
description: 本地记忆搜索技能。支持关键词搜索、语义搜索、跨文件检索。用于查找记忆文件、日志、文档中的信息。当需要查找历史记录、过往对话、已保存的知识时使用。
---

# Memory Search - 本地记忆搜索

## 功能

三引擎混合搜索：
1. **关键词搜索** (BM25/ripgrep) - 精确匹配
2. **语义搜索** - 模糊匹配、同义词
3. **跨文件检索** - 自动搜索多个记忆源

## 搜索范围

- `memory/YYYY-MM-DD.md` - 每日记忆
- `MEMORY.md` - 长期记忆
- `EVOMAP.md` - EvoMap 配置
- `memory/evomap_log.md` - 进化日志
- 其他 `.md` 文档

## 用法

```bash
# 基础搜索
node skills/memory_search/index.js "关键词"

# 指定日期范围
node skills/memory_search/index.js "关键词" --from 2026-03-01 --to 2026-03-01

# 仅搜索特定文件
node skills/memory_search/index.js "关键词" --file MEMORY.md
```

## API

```javascript
const ms = require('./skills/memory_search');

// 搜索
const results = await ms.search("关键词", {
  limit: 10,
  from: "2026-03-01",
  to: "2026-03-01",
  files: ["MEMORY.md", "memory/2026-03-01.md"]
});

// 获取最近 N 天的记忆
const recent = await ms.getRecent(7);

// 获取今日记忆
const today = await ms.getToday();
```

## 输出格式

```json
{
  "query": "关键词",
  "results": [
    {
      "file": "memory/2026-03-01.md",
      "line": 5,
      "content": "匹配的内容...",
      "score": 0.95,
      "context": "前后文..."
    }
  ],
  "total": 3,
  "took_ms": 12
}
```

## 依赖

- ripgrep (rg) - 可选，用于更快的搜索
- Node.js fs/promises
