/**
 * ScholarGraph - 学术文献工具包
 * 
 * 文献搜索、PDF 分析、知识图谱、研究空白检测
 * 
 * EvoMap 成熟方案 | GDI: 58.75 | 复用：86k+
 */

const https = require('https');

/**
 * 搜索 arXiv 论文
 */
async function searchPapers(options = {}) {
  const {
    query = '',
    limit = 10,
    sortBy = 'relevance',
    sortOrder = 'descending'
  } = options;

  const url = new URL('http://export.arxiv.org/api/query');
  url.searchParams.set('search_query', query);
  url.searchParams.set('start', '0');
  url.searchParams.set('max_results', limit.toString());
  url.searchParams.set('sortBy', sortBy);
  url.searchParams.set('sortOrder', sortOrder);

  return new Promise((resolve, reject) => {
    https.get(url.toString(), (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const papers = parseArxivResponse(data);
          resolve(papers);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 解析 arXiv XML 响应
 */
function parseArxivResponse(xml) {
  const papers = [];
  const entries = xml.split('<entry>');
  
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    
    const title = extractTag(entry, 'title')?.replace(/\s+/g, ' ').trim();
    const summary = extractTag(entry, 'summary')?.replace(/\s+/g, ' ').trim();
    const published = extractTag(entry, 'published');
    const pdfUrl = entry.match(/<link[^>]*href="([^"]*arxiv.org\/pdf\/[^"]+)"/)?.[1];
    
    // 提取作者
    const authors = [];
    const authorMatches = entry.matchAll(/<author>[\s\S]*?<name>([^<]+)<\/name>/g);
    for (const match of authorMatches) {
      authors.push(match[1]);
    }

    papers.push({
      title,
      authors,
      published,
      summary,
      pdf_url: pdfUrl,
      arxiv_id: extractTag(entry, 'id')?.split('/abs/')[1]
    });
  }

  return papers;
}

/**
 * 提取 XML 标签内容
 */
function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`));
  return match ? match[1] : null;
}

/**
 * 分析 PDF (简化版，实际需要 PDF 解析库)
 */
async function analyzePDF(pdfPath, options = {}) {
  // 注意：实际需要 pdf-parse 或类似库
  // 这里提供框架，返回模拟数据
  
  return {
    path: pdfPath,
    abstract: '需要安装 pdf-parse 库来提取摘要',
    keywords: [],
    methods: [],
    datasets: [],
    metrics: [],
    note: '完整功能需要安装：npm install pdf-parse'
  };
}

/**
 * 构建知识图谱 (简化版)
 */
async function buildKnowledgeGraph(options = {}) {
  const { papers = [] } = options;

  // 提取关键词共现
  const keywordCooccurrence = {};
  
  papers.forEach(paper => {
    // 简化：从标题和摘要提取关键词
    const words = (paper.title + ' ' + paper.summary)
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !['that', 'with', 'this', 'which', 'from', 'their'].includes(w));

    // 统计词频
    words.forEach(word => {
      keywordCooccurrence[word] = (keywordCooccurrence[word] || 0) + 1;
    });
  });

  // 排序
  const topKeywords = Object.entries(keywordCooccurrence)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  return {
    papers: papers.length,
    topKeywords,
    nodes: topKeywords.map(([keyword, count]) => ({
      id: keyword,
      label: keyword,
      size: Math.sqrt(count) * 5
    })),
    edges: []  // 需要更复杂的共现分析
  };
}

/**
 * 检测研究空白
 */
async function detectResearchGaps(papers = []) {
  // 分析高频主题
  const topics = {};
  
  papers.forEach(paper => {
    const words = (paper.title + ' ' + paper.summary)
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 5);

    words.forEach(word => {
      topics[word] = (topics[word] || 0) + 1;
    });
  });

  // 找出被讨论但可能未解决的问题
  const frequentTopics = Object.entries(topics)
    .filter(([_, count]) => count > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return {
    frequentTopics,
    suggestion: '关注这些高频主题，可能是当前研究热点',
    note: '完整分析需要 NLP 和领域知识'
  };
}

module.exports = {
  searchPapers,
  analyzePDF,
  buildKnowledgeGraph,
  detectResearchGaps,
  parseArxivResponse
};
