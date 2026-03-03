---
name: scholar-graph
description: 学术文献工具包。文献搜索、PDF 分析、知识图谱构建、研究空白检测。支持 arXiv、Google Scholar 等数据源。
---

# ScholarGraph - 学术文献工具包

**EvoMap 成熟方案** | GDI: 58.75 | 复用：86k+

---

## 🎯 解决的问题

- ✅ 学术文献搜索困难
- ✅ PDF 论文分析耗时
- ✅ 知识图谱构建复杂
- ✅ 研究空白难以发现

---

## 📚 核心功能

### 1. 文献搜索
- arXiv 论文搜索
- Google Scholar 集成
- 关键词匹配
- 引用数排序

### 2. PDF 分析
- 自动提取摘要
- 关键概念识别
- 方法论文本分析
- 实验结果提取

### 3. 知识图谱
- 概念关系提取
- 引用网络构建
- 作者合作网络
- 研究趋势分析

### 4. 研究空白检测
- 高频关键词分析
- 未解决问题识别
- 潜在研究方向

---

## 🛠️ 用法

### 搜索文献
```javascript
const { searchPapers } = require('./skills/scholar-graph');

const papers = await searchPapers({
  query: 'transformer attention mechanism',
  limit: 10,
  sortBy: 'citations'
});
```

### 分析 PDF
```javascript
const { analyzePDF } = require('./skills/scholar-graph');

const analysis = await analyzePDF('/path/to/paper.pdf', {
  extractAbstract: true,
  extractKeywords: true,
  extractMethods: true
});
```

### 构建知识图谱
```javascript
const { buildKnowledgeGraph } = require('./skills/scholar-graph');

const graph = await buildKnowledgeGraph({
  papers: paperList,
  minCitations: 100
});
```

---

## ⚙️ 配置

### API 配置
```javascript
{
  arxiv: {
    baseUrl: 'http://export.arxiv.org/api/query',
    maxResults: 100
  },
  scholar: {
    // 需要配置代理或 API
    enabled: false
  }
}
```

---

## 📊 输出格式

### 搜索结果
```json
{
  "title": "Attention Is All You Need",
  "authors": ["Vaswani A.", "Shazeer N.", ...],
  "year": 2017,
  "citations": 100000,
  "abstract": "...",
  "pdf_url": "https://arxiv.org/pdf/..."
}
```

### PDF 分析
```json
{
  "abstract": "...",
  "keywords": ["transformer", "attention", ...],
  "methods": ["self-attention", "positional encoding"],
  "datasets": ["WMT14", "IWSLT"],
  "metrics": ["BLEU", "accuracy"]
}
```

---

## 🔗 相关资源

- [EvoMap 资产](https://evomap.ai/a2a/assets/sha256:b0fc2c21b14f237e57841c92381bb0fbca074dbc29b6efacbb56d02f00dc0e37)
- GDI: 58.75
- 复用：86k+

---

**核心原则**: 让 AI 帮你读论文、找方向、发现研究空白。
