---
name: tavily-search
description: 免费联网搜索技能，使用 Tavily API 进行智能网页搜索。支持摘要提取、多结果聚合、深度搜索模式。当需要获取最新信息、研究主题、查找资料时使用。
---

# Tavily Search

使用 Tavily API 进行智能联网搜索。

## 🚀 快速开始

```javascript
const tavily = require('./skills/tavily-search');

// 基础搜索
const result = await tavily.search("AI agent evolution");

// 深度搜索（更多结果）
const result = await tavily.search("AI agent evolution", { depth: "advanced" });

// 包含摘要
const result = await tavily.search("AI agent evolution", { includeAnswer: true });
```

## 📋 命令

### 基础搜索
```bash
# 搜索并显示前 5 个结果
node skills/tavily-search/scripts/search.js "query"

# 搜索前 10 个结果
node skills/tavily-search/scripts/search.js "query" -n 10

# JSON 输出
node skills/tavily-search/scripts/search.js "query" --json
```

### 高级选项
```bash
# 深度搜索（更详细）
node skills/tavily-search/scripts/search.js "query" --depth advanced

# 包含答案摘要
node skills/tavily-search/scripts/search.js "query" --include-answer

# 时间范围过滤
node skills/tavily-search/scripts/search.js "query" --days 7
```

## ⚙️ 配置

### API 密钥
```bash
export TAVILY_API_KEY="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"
```

或在 `.env` 文件中：
```
TAVILY_API_KEY=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
```

### 环境变量
| 变量 | 默认值 | 说明 |
|------|--------|------|
| `TAVILY_API_KEY` | (必需) | Tavily API 密钥 |
| `TAVILY_MAX_RESULTS` | 5 | 默认返回结果数 |
| `TAVILY_SEARCH_DEPTH` | basic | basic / advanced |

## 📊 搜索参数

### 深度模式
- **basic** (默认) - 快速搜索，5 个结果
- **advanced** - 深度搜索，10 个结果，更详细

### 包含内容
- **includeAnswer** - AI 生成的答案摘要
- **includeRawContent** - 原始网页内容
- **includeImages** - 相关图片

### 时间范围
- **hours** - 过去几小时
- **days** - 过去几天
- **weeks** - 过去几周
- **months** - 过去几月
- **year** - 过去一年

## 💡 使用场景

### 1. 研究主题
```javascript
// 查找最新研究
const research = await tavily.search("AI agent memory systems 2026", {
  days: 30,
  includeAnswer: true
});
```

### 2. 验证信息
```javascript
// 交叉验证多个来源
const fact = await tavily.search("OpenClaw latest version", {
  includeRawContent: true
});
```

### 3. 竞品分析
```javascript
// 收集竞品信息
const competitors = await tavily.search("AI assistant frameworks", {
  maxResults: 10,
  depth: "advanced"
});
```

## 📁 输出格式

```json
{
  "query": "AI agent evolution",
  "answer": "AI agent evolution refers to...",
  "results": [
    {
      "title": "Title of the page",
      "url": "https://example.com",
      "content": "Brief excerpt from the page",
      "score": 0.95,
      "publishedDate": "2026-03-01"
    }
  ],
  "images": [],
  "followUpQuestions": [
    "What is AI agent?",
    "How does evolution work?"
  ]
}
```

## 🔧 API 参考

### search(query, options)
```javascript
await tavily.search(query, {
  maxResults: 5,          // 结果数量 (1-10)
  depth: "basic",         // basic | advanced
  includeAnswer: false,   // 包含 AI 答案
  includeRawContent: false, // 包含原始内容
  includeImages: false,   // 包含图片
  days: null              // 时间范围 (天数)
});
```

### getNews(query, options)
```javascript
await tavily.getNews("AI news", {
  days: 7,
  maxResults: 10
});
```

### getAnswer(query)
```javascript
const answer = await tavily.getAnswer("What is EvoMap?");
// 返回简洁的答案摘要
```

## ⚠️ 注意事项

### 配额限制
- **免费层**: 1000 次搜索/月
- **开发者层**: 10000 次搜索/月
- 超出后返回 429 错误

### 最佳实践
1. **缓存结果** - 相同查询缓存 24 小时
2. **批量查询** - 合并多个查询为一次
3. **精确查询** - 使用具体关键词减少搜索次数
4. **错误处理** - 处理 API 超时和配额错误

### 错误处理
```javascript
try {
  const result = await tavily.search("query");
} catch (error) {
  if (error.code === 'RATE_LIMIT') {
    console.log('搜索配额已用完');
  } else if (error.code === 'TIMEOUT') {
    console.log('搜索超时');
  }
}
```

## 📚 示例

### 示例 1: 研究最新技术
```javascript
const tavily = require('./skills/tavily-search');

async function researchTopic(topic) {
  const results = await tavily.search(topic, {
    depth: "advanced",
    includeAnswer: true,
    days: 30
  });
  
  console.log("答案摘要:", results.answer);
  console.log("\n来源:");
  results.results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title} - ${r.url}`);
  });
  
  return results;
}
```

### 示例 2: 监控品牌提及
```javascript
async function monitorBrand(brandName) {
  const results = await tavily.search(brandName, {
    days: 1,
    maxResults: 10
  });
  
  return {
    date: new Date().toISOString(),
    mentions: results.results.length,
    sentiment: analyzeSentiment(results.results)
  };
}
```

## 🔗 相关资源

- [Tavily 官方文档](https://docs.tavily.com/)
- [API 参考](https://app.tavily.com/api)
- [定价方案](https://tavily.com/pricing)
