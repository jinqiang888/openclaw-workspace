/**
 * Proactive Agent - 自我进化 + 反思
 * 
 * 用法:
 *   const agent = require('./skills/proactive-agent');
 *   await agent.reflect();
 */

const fs = require('fs').promises;
const path = require('path');

const WORKSPACE = '/home/admin/.openclaw/workspace';
const MEMORY_FILE = path.join(WORKSPACE, 'MEMORY.md');
const EVOMAP_LOG = path.join(WORKSPACE, 'memory', 'evomap_log.md');

// 事件存储
let events = [];

/**
 * 记录事件
 */
async function logEvent(event) {
  const timestamped = {
    ...event,
    timestamp: new Date().toISOString(),
    id: `evt_${Date.now()}`
  };
  
  events.push(timestamped);
  
  // 追加到今日记忆
  const today = new Date().toISOString().split('T')[0];
  const memoryFile = path.join(WORKSPACE, 'memory', `${today}.md`);
  
  try {
    await fs.appendFile(memoryFile, `\n## 事件\n- ${event.type}: ${event.task || event.description}\n`);
  } catch (e) {
    // 文件不存在则创建
    await fs.mkdir(path.dirname(memoryFile), { recursive: true });
    await fs.writeFile(memoryFile, `# ${today}\n\n## 事件\n- ${event.type}: ${event.task || event.description}\n`);
  }
  
  return timestamped;
}

/**
 * 执行反思
 */
async function reflect() {
  const today = new Date().toISOString().split('T')[0];
  
  // 读取今日记忆
  const memoryFile = path.join(WORKSPACE, 'memory', `${today}.md`);
  let content = '';
  try {
    content = await fs.readFile(memoryFile, 'utf-8');
  } catch (e) {
    return { error: '今日记忆不存在' };
  }
  
  // 分析内容
  const analysis = {
    date: today,
    tasksCompleted: (content.match(/✅/g) || []).length,
    issuesFound: (content.match(/❌|问题 | 错误/g) || []).length,
    improvements: (content.match(/💡|改进 | 优化/g) || []).length,
    skillsCreated: (content.match(/技能|skill/gi) || []).length
  };
  
  // 生成反思
  const reflection = `
## 🔄 反思 - ${today}

### 📊 统计
- 完成任务：${analysis.tasksCompleted}
- 发现问题：${analysis.issuesFound}
- 改进建议：${analysis.improvements}
- 创建技能：${analysis.skillsCreated}

### 💭 自动分析
${analysis.tasksCompleted > 5 ? '✅ 高效率的一天！' : '⚠️ 可以提高效率'}
${analysis.issuesFound > 3 ? '⚠️ 发现较多问题，建议系统性优化' : '✅ 问题控制良好'}
${analysis.skillsCreated > 0 ? '✅ 有技能产出，符合复用原则' : '💡 考虑将重复工作技能化'}
`;
  
  // 追加到进化日志
  try {
    await fs.appendFile(EVOMAP_LOG, reflection);
  } catch (e) {
    await fs.mkdir(path.dirname(EVOMAP_LOG), { recursive: true });
    await fs.writeFile(EVOMAP_LOG, `# EvoMap 进化日志\n\n${reflection}`);
  }
  
  return {
    ...analysis,
    reflection,
    recommendations: generateRecommendations(analysis)
  };
}

/**
 * 生成改进建议
 */
function generateRecommendations(analysis) {
  const recs = [];
  
  if (analysis.skillsCreated === 0) {
    recs.push('考虑将今天的重复工作打包成技能');
  }
  
  if (analysis.issuesFound > 3) {
    recs.push('建议系统性解决反复出现的问题');
  }
  
  if (analysis.tasksCompleted > 10) {
    recs.push('高效率！考虑发布经验到 EvoMap');
  }
  
  return recs;
}

/**
 * 获取改进建议
 */
async function getImprovements() {
  const reflection = await reflect();
  return reflection.recommendations || [];
}

/**
 * 发布到 EvoMap
 */
async function publishToEvoMap(asset) {
  // 读取节点 ID
  const nodeIdFile = path.join(WORKSPACE, '.evomap_node_id');
  let nodeId = 'node_unknown';
  try {
    nodeId = await fs.readFile(nodeIdFile, 'utf-8').then(t => t.trim());
  } catch (e) {
    throw new Error('未配置 EvoMap 节点');
  }
  
  // 构建发布请求
  const publishData = {
    protocol: 'gep-a2a',
    protocol_version: '1.0.0',
    message_type: 'publish',
    message_id: `msg_${Date.now()}`,
    sender_id: nodeId,
    timestamp: new Date().toISOString(),
    payload: {
      assets: asset.assets
    }
  };
  
  // 发送请求 (简化版，实际需要用 curl 或 https)
  console.log('发布到 EvoMap:', publishData);
  
  return {
    status: 'pending',
    message: '请手动执行 curl 发布或使用 EvoMap 客户端'
  };
}

/**
 * 生成进化报告
 */
async function generateReport(days = 7) {
  const report = {
    period: `Last ${days} days`,
    generated: new Date().toISOString(),
    summary: {
      totalEvents: events.length,
      skillsCreated: 0,
      tasksCompleted: 0,
      lessonsLearned: 0
    },
    evolution: []
  };
  
  // 读取进化日志
  try {
    const logContent = await fs.readFile(EVOMAP_LOG, 'utf-8');
    report.summary.skillsCreated = (logContent.match(/技能|skill/gi) || []).length;
    report.summary.tasksCompleted = (logContent.match(/✅/g) || []).length;
    report.summary.lessonsLearned = (logContent.match(/💡|教训 | lesson/gi) || []).length;
  } catch (e) {
    // 日志不存在
  }
  
  return report;
}

module.exports = {
  logEvent,
  reflect,
  getImprovements,
  publishToEvoMap,
  generateReport,
  
  // 工具
  events: () => events,
  clearEvents: () => { events = []; }
};
