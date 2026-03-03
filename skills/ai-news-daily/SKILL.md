---
name: ai-news-daily
description: AI 热点资讯日报。每天 9:00 推送近 24 小时热门 10 个 AI 资讯，来源包括 Tavily 搜索、EvoMap、GitHub、Hacker News 等。
---

# AI 热点资讯日报

**自动化任务** | 每天 9:00 推送

---

## 🕐 时间安排

| 任务 | 时间 | 说明 |
|------|------|------|
| 资讯收集 | 8:00-9:00 | 收集近 24 小时热门资讯 |
| 资讯推送 | 9:00 | 推送 Top 10 热门资讯 |

---

## 📰 数据来源

| 渠道 | 内容类型 | 权重 | 状态 |
|------|----------|------|------|
| **Tavily 搜索** | 实时 AI 新闻 | ⭐⭐⭐⭐⭐ | ✅ 已配置 |
| **EvoMap** | 高 GDI 资产 | ⭐⭐⭐⭐ | ✅ 已配置 |
| **GitHub Trending** | AI 热门项目 | ⭐⭐⭐ | ✅ 已配置 |
| **Hacker News** | AI 技术讨论 | ⭐⭐⭐ | ✅ 已配置 |
| **B 站** | AI 视频教程 | ⭐⭐ | ✅ 已配置 |

---

## 🎯 推送内容

### Top 10 热门资讯
每条包含：
- **标题** - 准确反映内容
- **来源** - Tavily/EvoMap/GitHub/HN/B 站
- **热度** - 阅读/点赞/转发数/Stars
- **发布时间** - 资讯发布时间
- **摘要** - 100-200 字核心内容
- **关键要点** - 3-5 个 bullet points
- **原文链接** - 阅读原文
- **阅读时间** - 估算阅读时长

### 趋势分析
- 热门话题
- 新技术发布
- 工具更新
- 行业动态

### 对 OpenClaw 的启发
- 可学习的技能
- 可优化的配置
- 可集成的工具
- 行动建议

---

## ⚙️ 配置

### Tavily API 配置
```javascript
{
  tavily: {
    apiKey: process.env.TAVILY_API_KEY,
    baseUrl: 'https://api.tavily.com/search',
    maxResults: 10,
    timeRange: 'day'
  }
}
```

### 环境变量
```bash
export TAVILY_API_KEY=your_api_key_here
```

---

## 🛠️ 使用方法

### 手动获取资讯
```javascript
const { getHotNews } = require('./skills/ai-news-daily');

const news = await getHotNews({
  hours: 24,
  limit: 10,
  sources: ['tavily', 'evomap', 'github', 'hackernews']
});
```

### 生成日报
```javascript
const { generateDailyDigest } = require('./skills/ai-news-daily');

const digest = await generateDailyDigest({
  limit: 10,
  detailed: true
});
```

### 查看历史资讯
```bash
cat memory/ai-news-2026-03-02.md
```

---

## 📁 输出文件

### 资讯日志
```
memory/
└── ai-news-YYYY-MM-DD.md
```

---

## 📊 预期效果

| 指标 | 目标 |
|------|------|
| 资讯数量 | 10 条/天 |
| 数据来源 | ≥3 个渠道 |
| 推送时间 | 9:00 准时 |
| 内容质量 | 摘要 + 要点 + 链接 |

---

## 🔗 相关资源

- [Tavily API](https://tavily.com/)
- [EvoMap](https://evomap.ai/)
- [GitHub Trending](https://github.com/trending)
- [Hacker News](https://news.ycombinator.com/)

---

**核心原则**: 精选热门、每日推送、启发学习。
