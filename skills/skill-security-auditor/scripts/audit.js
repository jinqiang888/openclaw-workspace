#!/usr/bin/env node
/**
 * Skill Security Auditor - 安全审查脚本
 * 
 * 用法：
 *   node scripts/audit.js <skill-path>
 *   node scripts/audit.js <skill-path> --report
 */

const fs = require('fs');
const path = require('path');

// 危险模式
const DANGEROUS_PATTERNS = [
  {
    pattern: /\beval\s*\(/,
    type: 'code_injection',
    severity: 'critical',
    message: '使用 eval() 执行动态代码'
  },
  {
    pattern: /child_process\.exec\s*\([^,)]+[\+`]/,
    type: 'command_injection',
    severity: 'critical',
    message: 'exec 调用可能包含命令注入'
  },
  {
    pattern: /exec\s*\(\s*`[^`]*\$\{/,
    type: 'command_injection',
    severity: 'critical',
    message: '模板字符串中的 exec 调用'
  },
  {
    pattern: /rm\s+-rf\s+[\$\{`]/,
    type: 'dangerous_delete',
    severity: 'critical',
    message: '危险的 rm -rf 命令'
  },
  {
    pattern: /sk-[a-zA-Z0-9]{20,}|api[_-]?key\s*=\s*["'][^"']{10,}/i,
    type: 'hardcoded_secret',
    severity: 'high',
    message: '可能包含硬编码 API 密钥'
  },
  {
    pattern: /password\s*=\s*["'][^"']+["']/i,
    type: 'hardcoded_password',
    severity: 'high',
    message: '硬编码密码'
  },
  {
    pattern: /fetch\s*\(\s*["']http:\/\/(?!localhost)/,
    type: 'insecure_http',
    severity: 'medium',
    message: '使用 HTTP 而非 HTTPS'
  },
  {
    pattern: /\/etc\/|\/root\/|~\/\.ssh/i,
    type: 'sensitive_path',
    severity: 'high',
    message: '访问敏感系统路径'
  }
];

// 需要审查的模式
const REVIEW_PATTERNS = [
  {
    pattern: /child_process\.(exec|spawn|spawnSync)/,
    type: 'system_command',
    severity: 'review',
    message: '系统命令执行，需要人工审查'
  },
  {
    pattern: /fs\.(unlink|rm|rmdir|writeFile)/,
    type: 'file_modification',
    severity: 'review',
    message: '文件修改操作'
  },
  {
    pattern: /https?:\/\/(?!api\.|localhost|127\.0\.0\.1)/,
    type: 'external_request',
    severity: 'review',
    message: '外部网络请求'
  },
  {
    pattern: /process\.env/,
    type: 'env_access',
    severity: 'info',
    message: '读取环境变量（正常）'
  }
];

function auditFile(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // 检查危险模式
    DANGEROUS_PATTERNS.forEach(({ pattern, type, severity, message }) => {
      if (pattern.test(line)) {
        issues.push({
          type,
          severity,
          file: path.relative(process.cwd(), filePath),
          line: index + 1,
          description: message,
          code: line.trim().substring(0, 100)
        });
      }
    });
    
    // 检查需要审查的模式
    REVIEW_PATTERNS.forEach(({ pattern, type, severity, message }) => {
      if (pattern.test(line)) {
        issues.push({
          type,
          severity,
          file: path.relative(process.cwd(), filePath),
          line: index + 1,
          description: message,
          code: line.trim().substring(0, 100)
        });
      }
    });
  });
  
  return issues;
}

function auditSkill(skillPath) {
  const issues = [];
  const jsFiles = [];
  
  // 递归查找所有 JS 文件
  function findJSFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        findJSFiles(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.py') || entry.name.endsWith('.sh'))) {
        jsFiles.push(fullPath);
      }
    }
  }
  
  findJSFiles(skillPath);
  
  // 审计每个文件
  jsFiles.forEach(file => {
    const fileIssues = auditFile(file);
    issues.push(...fileIssues);
  });
  
  return {
    skill: path.basename(skillPath),
    filesScanned: jsFiles.length,
    issues,
    safe: issues.filter(i => ['critical', 'high'].includes(i.severity)).length === 0,
    riskLevel: getRiskLevel(issues)
  };
}

function getRiskLevel(issues) {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  
  if (critical > 0) return 'critical';
  if (high > 0) return 'high';
  if (medium > 0) return 'medium';
  return 'low';
}

function formatReport(result) {
  const lines = [
    `🔒 安全审查报告 - ${result.skill}`,
    `=${'='.repeat(50)}`,
    `文件扫描：${result.filesScanned}`,
    `发现问题：${result.issues.length}`,
    `风险等级：${result.riskLevel.toUpperCase()}`,
    `安全状态：${result.safe ? '✅ 安全' : '❌ 不安全'}`,
    ``
  ];
  
  if (result.issues.length > 0) {
    lines.push(`📋 问题列表:`);
    lines.push(`-`.repeat(50));
    
    result.issues.forEach((issue, i) => {
      const icon = issue.severity === 'critical' ? '🔴' :
                   issue.severity === 'high' ? '🟠' :
                   issue.severity === 'medium' ? '🟡' :
                   issue.severity === 'review' ? '👁️' : 'ℹ️';
      
      lines.push(`${i + 1}. ${icon} [${issue.severity.toUpperCase()}] ${issue.description}`);
      lines.push(`   文件：${issue.file}:${issue.line}`);
      lines.push(`   代码：${issue.code}`);
      lines.push('');
    });
  }
  
  return lines.join('\n');
}

// 主程序
const args = process.argv.slice(2);
const skillPath = args[0];

if (!skillPath) {
  console.log('用法：node audit.js <skill-path> [--report]');
  process.exit(1);
}

if (!fs.existsSync(skillPath)) {
  console.error(`错误：技能目录不存在：${skillPath}`);
  process.exit(1);
}

const result = auditSkill(skillPath);

if (args.includes('--report')) {
  console.log(formatReport(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}

// 如果不安全，退出码为 1
process.exit(result.safe ? 0 : 1);
