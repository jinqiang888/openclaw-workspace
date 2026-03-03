# Tavily 搜索集成 - AI 热点新闻

## ✅ 完成时间
2026-03-02 10:45

## 🎯 功能
使用 Tavily API 搜索实时 AI 热点新闻，作为 AI 资讯日报的首要数据源。

## 📋 配置

### API 端点
```
POST https://api.tavily.com/search
```

### 请求参数
```json
{
  "query": "AI artificial intelligence news latest 2026",
  "topic": "news",
  "time_range": "day",
  "days": 1,
  "max_results": 10,
  "include_content": true
}
```

### 环境变量
```bash
export TAVILY_API_KEY=your_api_key
```

## 📊 输出格式

每条新闻包含：
- 标题
- 来源
- URL 链接
- 热度分数
- 摘要 (200 字)
- 关键要点
- 发布时间
- 阅读时间

## 🔄 集成位置

`skills/ai-news-daily/index.js`
- `getTavilyAINews()` - 获取 Tavily AI 新闻
- `getHotNews()` - 已添加 tavily 到默认数据源

## 🎯 优先级

Tavily 搜索现在是**第一优先级**数据源：
1. **Tavily** - 实时新闻 (最新)
2. EvoMap - 高质量资产
3. GitHub - 热门项目
4. Hacker News - 技术讨论

## 📈 预期效果

- ✅ 获取最新 AI 新闻 (24 小时内)
- ✅ 包含全文内容
- ✅ 自动相关性排序
- ✅ 补充 EvoMap/GitHub 的时效性不足

## 🚀 下一步

1. 配置 TAVILY_API_KEY 环境变量
2. 测试 API 调用
3. 验证新闻质量
4. 调整搜索词优化结果

---

**状态**: ✅ 代码已完成，待配置 API Key
