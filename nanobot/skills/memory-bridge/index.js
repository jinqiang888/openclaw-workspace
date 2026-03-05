/**
 * 跨会话记忆桥接
 * 
 * RECENT_EVENTS.md + 每日记忆 + 长期记忆
 * 
 * EvoMap 成熟方案 | GDI: 64.25 | 复用：947k+
 */

const fs = require('fs').promises;
const path = require('path');

const WORKSPACE = '/home/admin/.openclaw/workspace';
const RECENT_EVENTS_FILE = path.join(WORKSPACE, 'RECENT_EVENTS.md');
const LONG_TERM_MEMORY_FILE = path.join(WORKSPACE, 'MEMORY.md');
const DAILY_MEMORY_DIR = path.join(WORKSPACE, 'memory');

// 确保目录存在
async function ensureDirs() {
  await fs.mkdir(DAILY_MEMORY_DIR, { recursive: true });
}

// 获取今日日期
function getToday() {
  return new Date().toISOString().split('T')[0];
}

// 获取今日记忆文件路径
function getTodayMemoryFile() {
  return path.join(DAILY_MEMORY_DIR, `${getToday()}.md`);
}

/**
 * 记录事件到 RECENT_EVENTS.md
 */
async function recordEvent(event) {
  await ensureDirs();

  const {
    type = 'general',
    summary,
    details = '',
    channel = 'unknown',
    timestamp = new Date().toISOString()
  } = event;

  const eventLine = `- [${timestamp}] **${type}**: ${summary} ${details ? `(${details})` : ''} [${channel}]\n`;

  // 读取或创建 RECENT_EVENTS.md
  let content = '';
  try {
    content = await fs.readFile(RECENT_EVENTS_FILE, 'utf-8');
  } catch (e) {
    // 文件不存在，创建
    content = '# RECENT_EVENTS.md - 24h 滚动事件流\n\n';
    content += `**创建时间**: ${timestamp}\n\n`;
    content += '## 最近事件\n\n';
  }

  // 插入事件到列表开头
  const lines = content.split('\n');
  const insertIndex = lines.findIndex(l => l.startsWith('## ')) + 2;
  lines.splice(insertIndex, 0, eventLine.trim());

  // 保留最多 100 条事件
  const headerLines = lines.slice(0, insertIndex + 1);
  const eventLines = lines.slice(insertIndex + 1).filter(l => l.trim().startsWith('-')).slice(0, 99);
  const footerLines = lines.slice(insertIndex + 1).filter(l => !l.trim().startsWith('-'));

  content = headerLines.join('\n') + '\n' + eventLines.join('\n') + '\n' + footerLines.join('\n');

  await fs.writeFile(RECENT_EVENTS_FILE, content);

  // 同时写入今日记忆
  await appendToDailyMemory(event);

  return { success: true, file: RECENT_EVENTS_FILE };
}

/**
 * 追加到今日记忆
 */
async function appendToDailyMemory(event) {
  const todayFile = getTodayMemoryFile();
  const today = getToday();

  let content = '';
  try {
    content = await fs.readFile(todayFile, 'utf-8');
  } catch (e) {
    content = `# ${today}\n\n## 📝 事件记录\n\n`;
  }

  const eventLine = `- ${event.summary}\n`;
  content += eventLine;

  await fs.writeFile(todayFile, content);
}

/**
 * 加载记忆
 */
async function loadMemory(options = {}) {
  const {
    loadRecent = true,
    loadDaily = true,
    loadLongTerm = true,
    hours = 24
  } = options;

  const memory = {
    recent: [],
    daily: null,
    longTerm: null,
    loaded: {
      recent: false,
      daily: false,
      longTerm: false
    }
  };

  // 加载长期记忆
  if (loadLongTerm) {
    try {
      const content = await fs.readFile(LONG_TERM_MEMORY_FILE, 'utf-8');
      memory.longTerm = content;
      memory.loaded.longTerm = true;
    } catch (e) {
      memory.loaded.longTerm = false;
    }
  }

  // 加载最近事件
  if (loadRecent) {
    try {
      const content = await fs.readFile(RECENT_EVENTS_FILE, 'utf-8');
      // 解析事件行
      const eventLines = content.split('\n').filter(l => l.trim().startsWith('- ['));
      memory.recent = eventLines.slice(0, 50); // 最多 50 条
      memory.loaded.recent = true;
    } catch (e) {
      memory.loaded.recent = false;
    }
  }

  // 加载今日记忆
  if (loadDaily) {
    try {
      const todayFile = getTodayMemoryFile();
      const content = await fs.readFile(todayFile, 'utf-8');
      memory.daily = content;
      memory.loaded.daily = true;
    } catch (e) {
      memory.loaded.daily = false;
    }
  }

  return memory;
}

/**
 * 获取最近事件 (纯文本)
 */
async function getRecentEvents(limit = 20) {
  try {
    const content = await fs.readFile(RECENT_EVENTS_FILE, 'utf-8');
    const eventLines = content.split('\n').filter(l => l.trim().startsWith('- ['));
    return eventLines.slice(0, limit);
  } catch (e) {
    return [];
  }
}

/**
 * 清理过期事件 (超过 24 小时)
 */
async function cleanupOldEvents(hours = 24) {
  try {
    const content = await fs.readFile(RECENT_EVENTS_FILE, 'utf-8');
    const lines = content.split('\n');
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const preservedLines = [];
    const eventLines = [];

    for (const line of lines) {
      if (line.trim().startsWith('- [')) {
        const timestamp = line.match(/\[(.*?)\]/)?.[1];
        if (timestamp && timestamp > cutoff) {
          eventLines.push(line);
        }
      } else {
        preservedLines.push(line);
      }
    }

    // 重新组合
    const newContent = preservedLines.join('\n') + '\n' + eventLines.join('\n');
    await fs.writeFile(RECENT_EVENTS_FILE, newContent);

    return { cleaned: lines.length - eventLines.length, remaining: eventLines.length };
  } catch (e) {
    return { cleaned: 0, remaining: 0, error: e.message };
  }
}

module.exports = {
  recordEvent,
  loadMemory,
  getRecentEvents,
  appendToDailyMemory,
  cleanupOldEvents,
  getToday,
  getTodayMemoryFile,
  RECENT_EVENTS_FILE,
  LONG_TERM_MEMORY_FILE,
  DAILY_MEMORY_DIR
};
