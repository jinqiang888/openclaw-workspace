---
name: agent-introspection
description: AI 代理自省调试框架。自动捕获错误、分析根因、尝试修复、无法修复时通知用户。解决后台任务超时、exec 卡死、cron 失败等问题。当系统出现异常时自动触发。
---

# Agent Introspection - 代理自省调试

自动诊断和修复系统问题。

## 🎯 解决的问题

- ✅ 后台任务超时/卡死
- ✅ exec 调用失败
- ✅ cron 任务连续错误
- ✅ 网关无响应
- ✅ 消息发送失败

## 🔧 核心功能

### 1. 全局错误捕获
自动拦截：
- 未捕获的异常
- 工具调用错误
- 超时错误
- 网络错误

### 2. 根因分析
基于规则库匹配 80%+ 常见错误：

| 错误模式 | 自动诊断 | 自动修复 |
|----------|----------|----------|
| cron 超时 | ✅ | 禁用超时任务 |
| exec 卡死 | ✅ | 增加超时限制 |
| 网关无响应 | ✅ | 重启网关 |
| API 超时 | ✅ | 启用重试机制 |
| 内存不足 | ✅ | 清理缓存 |

### 3. 自动修复
常见问题的自动修复：
- 重启挂起的服务
- 清理堵塞的队列
- 重置超时的连接
- 禁用失败的任务

### 4. 自省报告
无法自动修复时，生成详细报告：
```markdown
## 系统错误报告

**时间**: 2026-03-01 22:15
**错误**: cron 任务超时
**根因**: 任务执行时间超过 60 秒
**已尝试**: 禁用超时任务
**建议**: 优化任务逻辑或增加超时时间
```

## 🛠️ 用法

### 自动触发
系统错误时自动运行，无需手动调用。

### 手动诊断
```javascript
const introspect = require('./skills/agent-introspection');

// 诊断系统状态
const report = await introspect.diagnose();
console.log(report);

// 尝试自动修复
const fix = await introspect.autofix();
console.log(fix);
```

### 命令行
```bash
# 诊断
node skills/agent-introspection/scripts/diagnose.js

# 修复
node skills/agent-introspection/scripts/fix.js
```

## 📊 错误规则库

### Cron 超时
```yaml
pattern: "cron.*timeout|job execution timed out"
diagnosis: "cron 任务执行超时"
fix: "禁用超时任务，调整超时时间"
severity: high
```

### Exec 卡死
```yaml
pattern: "exec.*timeout|process.*hung"
diagnosis: "exec 调用卡死"
fix: "增加超时限制，使用 yieldMs"
severity: high
```

### 网关无响应
```yaml
pattern: "gateway.*unreachable|ECONNREFUSED.*11022"
diagnosis: "OpenClaw 网关无响应"
fix: "重启网关"
severity: critical
```

### API 超时
```yaml
pattern: "TimeoutError|ECONNRESET|ETIMEDOUT"
diagnosis: "API 调用超时"
fix: "启用重试机制，增加超时时间"
severity: medium
```

## 📋 诊断输出

### 正常
```json
{
  "status": "healthy",
  "checks": {
    "gateway": "ok",
    "cron": "ok",
    "exec": "ok",
    "memory": "ok"
  }
}
```

### 异常
```json
{
  "status": "degraded",
  "issues": [
    {
      "type": "cron_timeout",
      "severity": "high",
      "message": "3 个 cron 任务连续超时",
      "fixed": true,
      "action": "已禁用超时任务"
    }
  ]
}
```

## ⚙️ 配置

### 超时设置
```javascript
{
  execTimeout: 30,      // exec 默认超时 (秒)
  cronTimeout: 60,      // cron 默认超时 (秒)
  gatewayTimeout: 10,   // 网关检查超时 (秒)
  maxRetries: 3         // 最大重试次数
}
```

### 自动修复开关
```javascript
{
  autoFix: true,        // 启用自动修复
  notifyOnFix: true,    // 修复后通知用户
  reportUnfixable: true // 无法修复时生成报告
}
```

## 📁 日志位置

- 诊断日志：`/workspace/logs/introspection.log`
- 修复记录：`/workspace/logs/autofix.log`
- 错误报告：`/workspace/logs/error-reports/`

## 🔗 相关资源

- [EvoMap 资产](https://evomap.ai/a2a/assets/sha256:3788de88cc227ec0e34d8212dccb9e5d333b3ee7ef626c06017db9ef52386baa)
- [GDI 分数]: 66.2
- [复用次数]: 940k+

---

**核心原则**: 自动修复 80% 常见问题，20% 复杂问题生成详细报告。
