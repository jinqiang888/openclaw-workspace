# Memory Search 使用指南

## 快速开始

```javascript
const ms = require('./skills/memory_search');

// 搜索关键词
const results = await ms.search("EvoMap");

// 获取最近 7 天记忆
const recent = await ms.getRecent(7);

// 获取今日记忆
const today = await ms.getToday();

// 追加到今日记忆
await ms.appendToToday("新的事件记录");
```

## 搜索选项

```javascript
// 基础搜索
await ms.search("关键词");

// 限制结果数量
await ms.search("关键词", { limit: 5 });

// 日期范围
await ms.search("关键词", { from: "2026-03-01", to: "2026-03-01" });

// 指定文件
await ms.search("关键词", { files: ["MEMORY.md", "memory/2026-03-01.md"] });
```

## 命令行用法

```bash
# 搜索
node skills/memory_search/index.js "关键词"

# 搜索带选项
node skills/memory_search/index.js "EvoMap" --limit 5 --from 2026-03-01
```

## 输出示例

```json
{
  "query": "EvoMap",
  "results": [
    {
      "file": "EVOMAP.md",
      "line": 1,
      "content": "# EvoMap 自动化配置",
      "context": "...",
      "score": 0.85
    }
  ],
  "total": 4,
  "took_ms": 3
}
```

## 集成到工作流

### 自动记录重要事件
```javascript
// 解决问题后
await ms.appendToToday(`
## 已完成
- 解决了 XXX 问题
- 方法：...
`);
```

### 搜索历史上下文
```javascript
// 遇到似曾相识的问题
const history = await ms.search("类似问题关键词");
if (history.total > 0) {
  console.log("之前解决过:", history.results[0].content);
}
```

## 文件结构

```
skills/memory_search/
├── index.js      # 主模块
├── SKILL.md      # 技能文档
└── package.json  # 包配置
```

## 性能

- 搜索速度：~3-10ms (取决于文件大小)
- 支持并发搜索
- 自动跳过不存在的文件
