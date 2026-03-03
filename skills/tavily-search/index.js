/**
 * Tavily Search - 智能联网搜索
 * 
 * 用法:
 *   const tavily = require('./skills/tavily-search');
 *   const result = await tavily.search("query");
 */

const https = require('https');

// 配置
const API_KEY = process.env.TAVILY_API_KEY || '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';
const BASE_URL = 'https://api.tavily.com';

/**
 * 搜索 Tavily
 * @param {string} query - 搜索关键词
 * @param {object} options - 选项
 * @returns {Promise<object>} 搜索结果
 */
async function search(query, options = {}) {
  const {
    maxResults = 5,
    depth = 'basic',
    includeAnswer = false,
    includeRawContent = false,
    includeImages = false,
    days = null
  } = options;

  const payload = {
    api_key: API_KEY,
    query,
    search_depth: depth,
    max_results: maxResults,
    include_answer: includeAnswer,
    include_raw_content: includeRawContent,
    include_images: includeImages
  };

  if (days) {
    payload.time_range = days <= 1 ? 'day' : days <= 7 ? 'week' : days <= 30 ? 'month' : 'year';
  }

  return makeRequest('/search', payload);
}

/**
 * 获取新闻
 */
async function getNews(query, options = {}) {
  const { days = 7, maxResults = 10 } = options;
  
  const payload = {
    api_key: API_KEY,
    query: `${query} news`,
    search_depth: 'basic',
    max_results: maxResults,
    time_range: days <= 1 ? 'day' : days <= 7 ? 'week' : 'month'
  };

  return makeRequest('/search', payload);
}

/**
 * 获取答案摘要
 */
async function getAnswer(query) {
  const result = await search(query, {
    maxResults: 1,
    includeAnswer: true
  });
  
  return result.answer || '未找到答案';
}

/**
 * 发送 HTTP 请求
 */
function makeRequest(endpoint, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const data = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          
          if (res.statusCode === 429) {
            reject(new Error('搜索配额已用完 (429 Rate Limit)'));
          } else if (res.statusCode !== 200) {
            reject(new Error(`API 错误：${res.statusCode} - ${result.message || 'Unknown error'}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`解析响应失败：${e.message}`));
        }
      });
    });

    req.on('error', (e) => {
      reject(new Error(`请求失败：${e.message}`));
    });

    req.write(data);
    req.end();
  });
}

/**
 * 缓存管理
 */
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小时

async function searchWithCache(query, options = {}) {
  const cacheKey = `${query}:${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const result = await search(query, options);
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  
  return result;
}

module.exports = {
  search,
  searchWithCache,
  getNews,
  getAnswer,
  
  // 常量
  API_KEY,
  BASE_URL
};
