/**
 * Agent Introspection - 自省调试框架
 * 
 * 自动诊断和修复系统问题
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const LOGS_DIR = '/home/admin/.openclaw/workspace/logs';
const INTROSPECTION_LOG = path.join(LOGS_DIR, 'introspection.log');
const AUTOFIX_LOG = path.join(LOGS_DIR, 'autofix.log');

// 确保日志目录存在
async function ensureLogs() {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

// 日志
async function log(message, type = 'info') {
  await ensureLogs();
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  await fs.appendFile(INTROSPECTION_LOG, line);
}

// 诊断系统状态
async function diagnose() {
  await ensureLogs();
  const report = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
    issues: []
  };

  // 检查 1: 网关状态
  try {
    const gatewayCheck = await checkGateway();
    report.checks.gateway = gatewayCheck;
    if (!gatewayCheck.ok) {
      report.status = 'degraded';
      report.issues.push({
        type: 'gateway_down',
        severity: 'critical',
        message: 'OpenClaw 网关无响应'
      });
    }
  } catch (e) {
    report.checks.gateway = { ok: false, error: e.message };
  }

  // 检查 2: Cron 任务状态
  try {
    const cronCheck = await checkCron();
    report.checks.cron = cronCheck;
    if (cronCheck.hasErrors) {
      report.status = 'degraded';
      report.issues.push({
        type: 'cron_errors',
        severity: 'high',
        message: `${cronCheck.errorCount} 个 cron 任务连续错误`,
        details: cronCheck.errors
      });
    }
  } catch (e) {
    report.checks.cron = { ok: false, error: e.message };
  }

  // 检查 3: 系统负载
  try {
    const loadCheck = await checkSystemLoad();
    report.checks.system = loadCheck;
    if (loadCheck.high) {
      report.status = 'degraded';
      report.issues.push({
        type: 'high_load',
        severity: 'medium',
        message: `系统负载过高：${loadCheck.load}`
      });
    }
  } catch (e) {
    report.checks.system = { ok: false, error: e.message };
  }

  // 记录诊断结果
  await log(`诊断完成：${report.status} - ${report.issues.length} 个问题`, 'diagnose');

  return report;
}

// 检查网关
async function checkGateway() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ ok: false, error: '检查超时' });
    }, 5000);

    exec('curl -s -m 5 "http://localhost:11022/" -H "Authorization: Bearer 87a7af9d1856fd7c0be49b1fb9519199"', (err, stdout) => {
      clearTimeout(timeout);
      if (err || !stdout) {
        resolve({ ok: false, error: '网关无响应' });
      } else {
        resolve({ ok: true });
      }
    });
  });
}

// 检查 Cron 任务
async function checkCron() {
  // 简化检查：查看 cron 日志
  try {
    const cronList = await execPromise('openclaw cron list 2>&1 || echo "cron command failed"');
    const errors = [];
    let errorCount = 0;

    if (cronList.includes('consecutiveErrors')) {
      errorCount = (cronList.match(/"consecutiveErrors":\s*(\d+)/g) || []).length;
    }
    if (cronList.includes('"lastStatus": "error"')) {
      errorCount = Math.max(errorCount, (cronList.match(/"lastStatus": "error"/g) || []).length);
    }

    return {
      ok: errorCount === 0,
      hasErrors: errorCount > 0,
      errorCount,
      errors
    };
  } catch (e) {
    return { ok: false, hasErrors: true, errorCount: 1, errors: [e.message] };
  }
}

// 检查系统负载
async function checkSystemLoad() {
  const uptime = await execPromise('uptime');
  const loadMatch = uptime.match(/load average: ([\d.]+)/);
  const load = loadMatch ? parseFloat(loadMatch[1]) : 0;

  return {
    ok: load < 5,
    high: load >= 5,
    load: load.toFixed(2),
    uptime: uptime.trim()
  };
}

// 自动修复
async function autofix(options = {}) {
  await ensureLogs();
  const result = {
    timestamp: new Date().toISOString(),
    fixes: [],
    failed: []
  };

  // 诊断问题
  const diagnosis = await diagnose();

  if (diagnosis.status === 'healthy') {
    await log('系统正常，无需修复', 'autofix');
    return result;
  }

  await log(`开始自动修复，发现 ${diagnosis.issues.length} 个问题`, 'autofix');

  // 修复 1: 网关挂了
  const gatewayIssue = diagnosis.issues.find(i => i.type === 'gateway_down');
  if (gatewayIssue) {
    try {
      await log('重启网关...', 'autofix');
      await execPromise('openclaw gateway restart');
      await sleep(10000); // 等待启动

      const check = await checkGateway();
      if (check.ok) {
        result.fixes.push({ type: 'gateway_restart', success: true });
        await log('网关已重启并恢复', 'autofix');
      } else {
        result.failed.push({ type: 'gateway_restart', error: '重启后仍无响应' });
        await log('网关重启失败', 'autofix');
      }
    } catch (e) {
      result.failed.push({ type: 'gateway_restart', error: e.message });
      await log(`网关重启失败：${e.message}`, 'autofix');
    }
  }

  // 修复 2: Cron 任务错误
  const cronIssue = diagnosis.issues.find(i => i.type === 'cron_errors');
  if (cronIssue) {
    try {
      await log('禁用错误 cron 任务...', 'autofix');
      // 获取错误任务列表
      const cronList = await execPromise('openclaw cron list 2>&1');
      const errorJobs = cronList.match(/"id": "([^"]+)".*?"lastStatus": "error"/gs) || [];

      for (const jobMatch of errorJobs.slice(0, 5)) { // 最多处理 5 个
        const jobId = jobMatch.match(/"id": "([^"]+)"/)?.[1];
        if (jobId) {
          try {
            await execPromise(`openclaw cron update --jobId ${jobId} --patch '{"enabled":false}'`);
            result.fixes.push({ type: 'cron_disable', jobId, success: true });
            await log(`禁用 cron 任务：${jobId}`, 'autofix');
          } catch (e) {
            result.failed.push({ type: 'cron_disable', jobId, error: e.message });
          }
        }
      }
    } catch (e) {
      result.failed.push({ type: 'cron_disable', error: e.message });
      await log(`禁用 cron 任务失败：${e.message}`, 'autofix');
    }
  }

  // 修复 3: 系统负载高
  const loadIssue = diagnosis.issues.find(i => i.type === 'high_load');
  if (loadIssue) {
    try {
      await log('系统负载高，建议手动检查', 'autofix');
      result.fixes.push({
        type: 'high_load',
        success: false,
        recommendation: '检查占用资源的进程，考虑重启系统'
      });
    } catch (e) {
      // 忽略
    }
  }

  await log(`自动修复完成：${result.fixes.length} 成功，${result.failed.length} 失败`, 'autofix');

  return result;
}

// 生成错误报告
async function generateReport(issue) {
  const reportDir = path.join(LOGS_DIR, 'error-reports');
  await fs.mkdir(reportDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportDir, `report-${timestamp}.md`);

  const content = `# 系统错误报告

**生成时间**: ${new Date().toISOString()}
**错误类型**: ${issue.type}
**严重程度**: ${issue.severity}

## 问题描述
${issue.message}

## 详细信息
${JSON.stringify(issue, null, 2)}

## 已尝试的修复
${issue.fixes ? issue.fixes.map(f => `- ${f.type}: ${f.success ? '✅ 成功' : '❌ 失败'}`).join('\n') : '无'}

## 建议操作
${getRecommendation(issue.type)}

---
*此报告由 Agent Introspection 自动生成*
`;

  await fs.writeFile(reportFile, content);
  return reportFile;
}

// 获取修复建议
function getRecommendation(issueType) {
  const recommendations = {
    gateway_down: '1. 检查网关进程状态\n2. 查看网关日志\n3. 考虑重启系统',
    cron_errors: '1. 检查 cron 任务配置\n2. 调整超时时间\n3. 优化任务逻辑',
    high_load: '1. 检查占用资源的进程\n2. 清理不必要的服务\n3. 考虑增加系统资源',
    exec_timeout: '1. 增加 exec 超时时间\n2. 使用 yieldMs 后台运行\n3. 优化命令效率'
  };
  return recommendations[issueType] || '请联系系统管理员';
}

// 工具函数
function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) reject(err);
      else resolve(stdout + stderr);
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  diagnose,
  autofix,
  generateReport,
  log,
  checkGateway,
  checkCron,
  checkSystemLoad
};
