/**
 * Memory Search - 本地记忆搜索
 * 
 * 支持关键词搜索、跨文件检索、日期范围过滤
 */

const fs = require('fs').promises;
const path = require('path');

const WORKSPACE = '/home/admin/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

/**
 * 搜索记忆文件
 * @param {string} query - 搜索关键词
 * @param {object} options - 选项
 * @returns {Promise<object>} 搜索结果
 */
async function search(query, options = {}) {
  const {
    limit = 10,
    from = null,
    to = null,
    files = null
  } = options;

  const startTime = Date.now();
  const results = [];

  // 确定搜索文件列表
  let targetFiles = [];
  if (files) {
    targetFiles = files.map(f => path.join(WORKSPACE, f));
  } else {
    // 默认搜索所有记忆文件
    targetFiles = await getMemoryFiles(from, to);
  }

  // 逐个文件搜索
  for (const file of targetFiles) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file: path.relative(WORKSPACE, file),
            line: i + 1,
            content: line.trim(),
            context: getContext(lines, i, 2),
            score: calculateScore(line, query)
          });
        }
      }
    } catch (err) {
      // 文件不存在或读取失败，跳过
    }
  }

  // 按分数排序
  results.sort((a, b) => b.score - a.score);

  return {
    query,
    results: results.slice(0, limit),
    total: results.length,
    took_ms: Date.now() - startTime
  };
}

/**
 * 获取记忆文件列表
 */
async function getMemoryFiles(from, to) {
  const files = [];
  
  // 添加 MEMORY.md
  files.push(path.join(WORKSPACE, 'MEMORY.md'));
  
  // 添加 EVOMAP.md
  files.push(path.join(WORKSPACE, 'EVOMAP.md'));
  
  // 添加 memory 目录下的文件
  try {
    const entries = await fs.readdir(MEMORY_DIR);
    for (const entry of entries) {
      if (entry.endsWith('.md')) {
        // 日期过滤
        if (from || to) {
          const date = entry.replace('.md', '');
          if (from && date < from) continue;
          if (to && date > to) continue;
        }
        files.push(path.join(MEMORY_DIR, entry));
      }
    }
  } catch (err) {
    // memory 目录不存在
  }
  
  return files;
}

/**
 * 获取上下文（前后 N 行）
 */
function getContext(lines, index, contextLines) {
  const start = Math.max(0, index - contextLines);
  const end = Math.min(lines.length, index + contextLines + 1);
  return lines.slice(start, end).join('\n');
}

/**
 * 计算匹配分数
 */
function calculateScore(line, query) {
  const lowerLine = line.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  // 完全匹配分数最高
  if (lowerLine === lowerQuery) return 1.0;
  
  // 包含查询
  if (lowerLine.includes(lowerQuery)) {
    // 在开头分数更高
    const pos = lowerLine.indexOf(lowerQuery);
    return 0.9 - (pos / lowerLine.length) * 0.3;
  }
  
  return 0.5;
}

/**
 * 获取最近 N 天的记忆
 */
async function getRecent(days = 7) {
  const results = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const file = path.join(MEMORY_DIR, `${dateStr}.md`);
    try {
      const content = await fs.readFile(file, 'utf-8');
      results.push({
        date: dateStr,
        file: `memory/${dateStr}.md`,
        content
      });
    } catch (err) {
      // 文件不存在
    }
  }
  
  return results;
}

/**
 * 获取今日记忆
 */
async function getToday() {
  const today = new Date().toISOString().split('T')[0];
  const file = path.join(MEMORY_DIR, `${today}.md`);
  
  try {
    const content = await fs.readFile(file, 'utf-8');
    return {
      date: today,
      file: `memory/${today}.md`,
      content
    };
  } catch (err) {
    return null;
  }
}

/**
 * 追加内容到今日记忆
 */
async function appendToToday(content) {
  const today = new Date().toISOString().split('T')[0];
  const file = path.join(MEMORY_DIR, `${today}.md`);
  
  // 确保目录存在
  await fs.mkdir(MEMORY_DIR, { recursive: true });
  
  // 追加内容
  await fs.appendFile(file, `\n${content}\n`, 'utf-8');
  
  return { date: today, file: `memory/${today}.md` };
}

module.exports = {
  search,
  getRecent,
  getToday,
  appendToToday
};
